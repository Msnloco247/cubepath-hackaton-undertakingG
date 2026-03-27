/**
 * @module BusinessAnalysisDelayMiddleware
 * @description Middleware para aplicar un delay inicial y permitir ráfagas de 3 peticiones 
 * (una por cada endpoint) cada 3 minutos por IP.
 */

import type { MiddlewareHandler } from "hono";
import { config } from "../config/env.ts";
import { redisClient, getRedisStatus } from "../config/redis.ts";
import { RateLimitError } from "../types/errors.ts";

// Almacén en memoria (Fallback de Redis)
// Guardamos { count, resetAt }
const businessMemoryStore = new Map<string, { count: number, resetAt: number }>();

// Limpieza de memoria (cada 5 minutos)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of businessMemoryStore.entries()) {
        if (now > entry.resetAt) {
            businessMemoryStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * @description Middleware que implementa:
 * 1. Bypass si no es producción.
 * 2. Delay inicial configurado (ej: 5s) para CADA petición permitida.
 * 3. Permite hasta 3 peticiones en una ráfaga, luego bloquea por 3 minutos.
 */
export const businessAnalysisDelayMiddleware: MiddlewareHandler = async (c, next) => {
    // Solo aplicar delay en producción
    if (!config.server.isProduction) {
        await next();
        return;
    }

    const { initialDelayMs, windowMs } = config.businessDelay;
    const now = Date.now();

    // Obtener IP del cliente
    const ip =
        c.req.header("cf-connecting-ip") ?? 
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        c.req.header("x-real-ip") ??
        "unknown";

    const redisKey = `business_burst:${ip}`;

    try {
        let currentCount = 0;
        let ttlMs = windowMs;

        if (getRedisStatus()) {
            // Usar Redis INCR para contar ráfagas
            currentCount = await redisClient.incr(redisKey);
            if (currentCount === 1) {
                await redisClient.pexpire(redisKey, windowMs);
            } else {
                const ttl = await redisClient.pttl(redisKey);
                ttlMs = ttl > 0 ? ttl : windowMs;
            }
        } else {
            // Fallback en memoria
            let entry = businessMemoryStore.get(ip);
            if (!entry || now > entry.resetAt) {
                entry = { count: 1, resetAt: now + windowMs };
                businessMemoryStore.set(ip, entry);
            } else {
                entry.count += 1;
            }
            currentCount = entry.count;
            ttlMs = entry.resetAt - now;
        }

        // Bloquear si excede 3 peticiones (una ráfaga completa de análisis)
        if (currentCount > 3) {
            const retryAfter = Math.ceil(ttlMs / 1000);
            c.header("Retry-After", String(retryAfter));
            throw new RateLimitError(`Límite de análisis excedido. Has alcanzado el máximo de 3 consultas. Por favor, espera ${retryAfter} segundos.`);
        }

        // Todas las peticiones permitidas (dentro de la ráfaga de 3) experimentan el delay inicial
        // Esto armoniza el comportamiento si se llaman en paralelo
        await new Promise(resolve => setTimeout(resolve, initialDelayMs));

        await next();
    } catch (err) {
        if (err instanceof RateLimitError) throw err;
        console.error("[BusinessDelayMiddleware] Error:", err);
        await next();
    }
};
