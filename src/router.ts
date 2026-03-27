/**
 * @module MainRouter
 * @description Orquestador central de rutas. Registra los módulos de salud, preguntas y la información base de la API.
 */

import { Hono } from "hono";
import preguntasRoute from "./routes/preguntas.route.ts";

const router = new Hono();

// ─── Middleware global ────────────────────────────────────────────────────────
// (El CORS ahora se gestiona centralizadamente en index.ts)

// ─── Rutas ────────────────────────────────────────────────────────────────────
router.route("/api/preguntas", preguntasRoute);

// ─── Info del API ─────────────────────────────────────────────────────────────
router.get("/", (c) => {
  return c.body(null, 204);
});

export default router;
