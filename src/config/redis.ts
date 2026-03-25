// src/config/redis.ts
// Instancia del cliente de Redis para caché distribuido

import { Redis } from "ioredis";
import { config } from "./env.ts";

export const redisClient = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 1, // Fallar rápido en vez de pausar la API
  retryStrategy(times) {
    if (times > 3) {
      return null; // Deja de reintentar si falla mucho
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

export const getRedisStatus = () => isRedisConnected;
