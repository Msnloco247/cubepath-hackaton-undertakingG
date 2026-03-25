// index.ts — Entry point del servidor EmprendeIA API

import { Hono } from "hono";
import { config } from "./src/config/env.ts";
import router from "./src/router.ts";
import { errorHandler, notFoundHandler } from "./src/middleware/error.middleware.ts";

// ─── Crear app Hono ──────────────────────────────────────────────────────────
const app = new Hono();

import { cors } from 'hono/cors';

app.use('/*', cors({
  origin: config.cors.allowedOrigins === '*' ? '*' : config.cors.allowedOrigins.split(','),
  allowMethods: ['POST', 'GET', 'OPTIONS'],
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