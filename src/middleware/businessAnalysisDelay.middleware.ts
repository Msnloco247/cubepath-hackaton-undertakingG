/**
 * @module BusinessAnalysisDelayMiddleware
 * @description Middleware para aplicar un delay inicial y un bloqueo de 3 minutos por IP 
 * en los endpoints de análisis de negocio.
 */

import type { MiddlewareHandler } from "hono";
import { config } from "../config/env.ts";
import { redisClient, getRedisStatus } from "../config/redis.ts";
import { RateLimitError } from "../types/errors.ts";
import type { RateLimitEntry } from "../types/index.ts";

// Almacén en memoria (Fallback de Redis)
const businessMemoryStore = new Map<string, number>();

// Limpieza de memoria (cada 5 minutos)
setInterval(() => {
    const now = Date.now();
    for (const [key, lastRequestAt] of businessMemoryStore.entries()) {
        if (now - lastRequestAt > config.businessDelay.windowMs) {
            businessMemoryStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * @description Middleware que implementa:
 * 1. Delay inicial configurado (ej: 5s).
 * 2. Bloqueo de 3 minutos para peticiones subsiguientes de la misma IP.
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

    const redisKey = `business_lockout:${ip}`;

    try {
        let lastRequestAt: number | null = null;

        if (getRedisStatus()) {
            const val = await redisClient.get(redisKey);
            lastRequestAt = val ? parseInt(val, 10) : null;
        } else {
            lastRequestAt = businessMemoryStore.get(ip) ?? null;
        }

        // Verificar bloqueo de 3 minutos
        if (lastRequestAt && (now - lastRequestAt < windowMs)) {
            const retryAfter = Math.ceil((windowMs - (now - lastRequestAt)) / 1000);
            c.header("Retry-After", String(retryAfter));
            throw new RateLimitError(`Límite de análisis excedido. Debes esperar ${retryAfter} segundos para realizar otro análisis.`);
        }

        // Si es una petición permitida (primera o después del lockout):
        // 1. Registrar el timestamp actual para el bloqueo
        if (getRedisStatus()) {
            await redisClient.set(redisKey, String(now), "PX", windowMs);
        } else {
            businessMemoryStore.set(ip, now);
        }

        // 2. Aplicar delay inicial (ej: 5 segundos)
        await new Promise(resolve => setTimeout(resolve, initialDelayMs));

        await next();
    } catch (err) {
        if (err instanceof RateLimitError) throw err;
        console.error("[BusinessDelayMiddleware] Error:", err);
        await next(); // Dejar pasar si hay error crítico en el delay
    }
};
