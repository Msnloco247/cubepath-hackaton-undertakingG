/**
 * @module ConfigRedis
 * @description Configuración y gestión del cliente Redis (ioredis).
 * Incluye lógica de reconexión con backoff y gestión de estado para fallback automático.
 */

import { Redis } from "ioredis";
import { config } from "./env.ts";

export const redisClient = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 1, // Fallar rápido en vez de pausar la API
  retryStrategy(times) {
    if (times > 10) {
      // Intentar reconectar indefinidamente o con un límite más alto en prod
      return Math.min(times * 100, 5000);
    }
    return Math.min(times * 50, 2000); // Backoff progresivo de reconexión
  },
});

let isRedisConnected = false;

redisClient.on("ready", () => {
    isRedisConnected = true;
});

redisClient.on("error", (err) => {
    isRedisConnected = false;
    // Solo mostramos warning si queremos que quede evidente, omitimos throw
});

// Helper de conexión (fire and forget)
redisClient.connect().catch(() => {
    console.warn("⚠️ No se pudo conectar a Redis. Se usará el fallback en memoria para Rate Limiting.");
});

/**
 * Devuelve el estado actual de la conexión con Redis.
 * @returns true si Redis está listo para recibir comandos.
 */
export const getRedisStatus = () => isRedisConnected;
