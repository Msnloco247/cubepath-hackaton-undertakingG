/**
 * @module EntryPoint
 * @description Punto de entrada principal del servidor EmprendeIA.
 * Configura la aplicación Hono, aplica middlewares globales (CORS, Errores) y arranca el servidor Bun.
 */

import { Hono } from "hono";
import { config } from "./src/config/env.ts";
import router from "./src/router.ts";
import { errorHandler, notFoundHandler } from "./src/middleware/error.middleware.ts";

// ─── Middlewares Globales ───────────────────────────────────────────────────
const app = new Hono();

import { cors } from 'hono/cors';

// 1. Cabeceras de seguridad (Habilitando protecciones básicas)
app.use('*', async (c, next) => {
  await next();
  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env["NODE_ENV"] === "production") {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
});

// 2. CORS Centralizado (Elimina la necesidad de cors.middleware.ts)
app.use('/*', cors({
  origin: config.cors.allowedOrigins === '*' ? '*' : config.cors.allowedOrigins.split(','),
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

// ─── Registrar rutas y middleware de error ───────────────────────────────────
app.route("/", router);
app.onError(errorHandler);
app.notFound(notFoundHandler);

// ─── Iniciar servidor con Bun ─────────────────────────────────────────────────
const server = Bun.serve({
  port: config.server.port,
  fetch: app.fetch,
});

console.log(`
╔══════════════════════════════════════════════════╗
║        🚀 EmprendeIA API — Emprendimientos       ║
╠══════════════════════════════════════════════════╣
║  URL:    http://localhost:${config.server.port}               ║
║  Env:    ${(process.env["NODE_ENV"] ?? "development").padEnd(38)}║
║  Modelo: ${config.openrouter.model.padEnd(38)}║
╠══════════════════════════════════════════════════╣
║  Endpoints disponibles:                          ║
║    GET  /                 → Info del API         ║
║    GET  /health           → Estado del servidor  ║
║    POST /api/preguntas/foda-zona                 ║
║    POST /api/preguntas/producto-estrategia       ║
║    POST /api/preguntas/pasos-presupuesto         ║
╚══════════════════════════════════════════════════╝
`);