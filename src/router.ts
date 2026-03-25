/**
 * @module MainRouter
 * @description Orquestador central de rutas. Registra los módulos de salud, preguntas y la información base de la API.
 */

import { Hono } from "hono";
import healthRoute from "./routes/health.route.ts";
import preguntasRoute from "./routes/preguntas.route.ts";

const router = new Hono();

// ─── Middleware global ────────────────────────────────────────────────────────
// (El CORS ahora se gestiona centralizadamente en index.ts)

// ─── Rutas ────────────────────────────────────────────────────────────────────
router.route("/health", healthRoute);
router.route("/api/preguntas", preguntasRoute);

// ─── Info del API ─────────────────────────────────────────────────────────────
router.get("/", (c) => {
  return c.json({
    nombre: "EmprendeIA API - Análisis de Emprendimientos",
    version: "2.0.0",
    descripcion:
      "API que analiza un proyecto de emprendimiento dividiendo el análisis en 3 endpoints para FODA/Zona, Producto/Estrategia, y Pasos/Presupuesto usando Inteligencia Artificial.",
    endpoints: {
      salud: "GET /health",
      fodaZona: "POST /api/preguntas/foda-zona",
      productoEstrategia: "POST /api/preguntas/producto-estrategia",
      pasosPresupuesto: "POST /api/preguntas/pasos-presupuesto"
    },
    documentacion: {
      "POST /api/preguntas/foda-zona": {
        descripcion: "Genera el análisis FODA y de la zona geográfica.",
      },
      "POST /api/preguntas/producto-estrategia": {
        descripcion: "Genera análisis del producto y estrategias clave."
      },
      "POST /api/preguntas/pasos-presupuesto": {
        descripcion: "Genera el paso a paso del emprendimiento con un presupuesto estimado en USD."
      }
    },
    ...(process.env["NODE_ENV"] !== "production" && {
      modelo: "IA Generativa via OpenRouter",
      timestamp: new Date().toISOString()
    })
  });
});

export default router;
