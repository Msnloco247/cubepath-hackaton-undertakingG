// src/middleware/rateLimit.middleware.ts
// Rate limiting escalable (Redis + Fallback en memoria por IP)

import type { MiddlewareHandler } from "hono";
import { config } from "../config/env.ts";
import { redisClient, getRedisStatus } from "../config/redis.ts";
import { RateLimitError } from "../types/errors.ts";
import type { RateLimitEntry } from "../types/index.ts";

// Almacén en memoria: Map<ip, { count, resetAt }> (Fallback de Redis)
const memoryStore = new Map<string, RateLimitEntry>();

// Tarea de limpieza de memoria (cada 5 minutos)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
        if (entry.resetAt < now) {
            memoryStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
    const { max, windowMs } = config.rateLimit;
    const now = Date.now();

    // Obtener IP del cliente
    const ip =
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        c.req.header("x-real-ip") ??
        "unknown";

    if (getRedisStatus()) {
        // --- RATE LIMIT DISTRIBUIDO (REDIS) ---
        const redisKey = `ratelimit:${ip}`;
        try {
            const currentCountStr = await redisClient.get(redisKey);
            const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
            
            if (currentCount >= max) {
                const ttl = await redisClient.pttl(redisKey);
                const retryAfter = Math.ceil(ttl / 1000);
                
                c.header("X-RateLimit-Limit", String(max));
                c.header("X-RateLimit-Remaining", "0");
                c.header("X-RateLimit-Reset", String(Math.ceil((now + ttl) / 1000)));
                c.header("Retry-After", String(retryAfter));
                
                throw new RateLimitError(`Demasiadas solicitudes. Límite: ${max} por ${windowMs / 1000}s. Intenta de nuevo en ${retryAfter}s.`);
            }

            const isNew = currentCount === 0;
            const pipeline = redisClient.pipeline();
            pipeline.incr(redisKey);
            if (isNew) {
                pipeline.pexpire(redisKey, windowMs);
            }
            await pipeline.exec();

            const ttl = await redisClient.pttl(redisKey);
            c.header("X-RateLimit-Limit", String(max));
            c.header("X-RateLimit-Remaining", String(Math.max(0, max - (currentCount + 1))));
            c.header("X-RateLimit-Reset", String(Math.ceil((now + ttl) / 1000)));

            await next();
            return;
        } catch (err) {
            if (err instanceof RateLimitError) throw err;
            // Si hay un error de DB (e.g. timeout), dejamos pasar a fallback
        }
    }

    // --- FALLBACK EN MEMORIA LOCAL ---
    const entry = memoryStore.get(ip);
    
    if (!entry || entry.resetAt < now) {
        memoryStore.set(ip, { count: 1, resetAt: now + windowMs });
        c.header("X-RateLimit-Limit", String(max));
        c.header("X-RateLimit-Remaining", String(max - 1));
        c.header("X-RateLimit-Reset", String(Math.ceil((now + windowMs) / 1000)));
        await next();
        return;
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        throw new RateLimitError(`Demasiadas solicitudes. Límite: ${max} por ${windowMs / 1000}s. Intenta localmente de nuevo en ${retryAfter}s.`);
    }

    await next();
};
