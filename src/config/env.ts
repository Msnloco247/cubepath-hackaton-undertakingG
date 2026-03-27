/**
 * @module ConfigEnv
 * @description Centraliza la carga y validación de todas las variables de entorno.
 * Proporciona métodos seguros para obtener strings y números, lanzando errores si faltan campos requeridos.
 */

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`❌ Variable de entorno requerida no encontrada: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`❌ Variable de entorno ${key} debe ser un número`);
  }
  return parsed;
};

/**
 * Objeto de configuración global de la aplicación.
 * @readonly
 */
export const config = {
  server: {
    port: getEnvNumber("PORT", 3000),
    isProduction: process.env["NODE_ENV"] === "production",
  },
  openrouter: {
    apiKey: getEnv("OPENROUTER_API_KEY"),
    model: getEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
    baseUrl: "https://openrouter.ai/api/v1",
    siteUrl: getEnv("OPENROUTER_SITE_URL", "http://localhost:3000"),
    siteName: getEnv("OPENROUTER_SITE_NAME", "EmprendeIA API"),
  },
  rateLimit: {
    max: getEnvNumber("RATE_LIMIT_MAX", 30),
    windowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 60_000),
  },
  businessDelay: {
    initialDelayMs: getEnvNumber("BUSINESS_INITIAL_DELAY_MS", 5000),
    windowMs: getEnvNumber("BUSINESS_WINDOW_MS", 180_000), // 3 minutos
  },
  cors: {
    allowedOrigins: getEnv("ALLOWED_ORIGINS", process.env["NODE_ENV"] === "production" ? "https://midominio.com" : "*"),
  },
  redis: {
    url: getEnv("REDIS_URL", "redis://localhost:6379"),
  }
} as const;
