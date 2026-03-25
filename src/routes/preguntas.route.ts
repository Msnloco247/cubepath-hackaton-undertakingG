// src/routes/preguntas.route.ts
// Endpoints separados para análisis de emprendimientos

import { Hono } from "hono";
import { validatePreguntasMiddleware } from "../middleware/validate.middleware.ts";
import { rateLimitMiddleware } from "../middleware/rateLimit.middleware.ts";
import { 
  verificarTemaEmprendimiento, 
  generarFodaYZona, 
  generarProductoYEstrategia, 
  generarPasosYPresupuesto 
} from "../services/openrouter.service.ts";
import type { PreguntasRequest } from "../types/index.ts";

// Definir el tipo de variables del contexto de Hono
type Variables = {
  preguntasValidadas: PreguntasRequest;
};

const preguntasRoute = new Hono<{ Variables: Variables }>();

// Función auxiliar para verificar el tema
async function verificarOAbortar(c: any, datos: PreguntasRequest) {
  const validacion = await verificarTemaEmprendimiento(datos);
  if (!validacion.esValido) {
    return c.json(
      {
        exito: false,
        error: "TEMA_INVALIDO",
        mensaje: validacion.razon,
        timestamp: new Date().toISOString(),
      },
      400
    );
  }
  return null;
}

// ─── POST /api/preguntas/foda-zona ────────────────────────────────────────────
preguntasRoute.post(
  "/foda-zona",
  rateLimitMiddleware,
  validatePreguntasMiddleware,
  async (c) => {
    const datos = c.get("preguntasValidadas");

    const falloVerificacion = await verificarOAbortar(c, datos);
    if (falloVerificacion) return falloVerificacion;

    const { analisisFODA, analisisZona, modelo } = await generarFodaYZona(datos);

    return c.json(
      {
        exito: true,
        analisis: { analisisFODA, analisisZona },
        modelo,
        timestamp: new Date().toISOString(),
      },
      200
    );
  }
);

// ─── POST /api/preguntas/producto-estrategia ──────────────────────────────────
preguntasRoute.post(
  "/producto-estrategia",
  rateLimitMiddleware,
  validatePreguntasMiddleware,
  async (c) => {
    const datos = c.get("preguntasValidadas");

    const falloVerificacion = await verificarOAbortar(c, datos);
    if (falloVerificacion) return falloVerificacion;

    const { analisisProducto, estrategiasClave, modelo } = await generarProductoYEstrategia(datos);

    return c.json(
      {
        exito: true,
        analisis: { analisisProducto, estrategiasClave },
        modelo,
        timestamp: new Date().toISOString(),
      },
      200
    );
  }
);

// ─── POST /api/preguntas/pasos-presupuesto ────────────────────────────────────
preguntasRoute.post(
  "/pasos-presupuesto",
  rateLimitMiddleware,
  validatePreguntasMiddleware,
  async (c) => {
    const datos = c.get("preguntasValidadas");

    const falloVerificacion = await verificarOAbortar(c, datos);
    if (falloVerificacion) return falloVerificacion;

    const { analisisPasos, modelo } = await generarPasosYPresupuesto(datos);

    return c.json(
      {
        exito: true,
        analisis: analisisPasos,
        modelo,
        timestamp: new Date().toISOString(),
      },
      200
    );
  }
);

// ─── Métodos no permitidos ────────────────────────────────────────────────────
preguntasRoute.all("/*", (c) => {
  return c.json(
    {
      exito: false,
      error: "METODO_NO_PERMITIDO",
      mensaje: `El método "${c.req.method}" no está permitido o la subruta no existe. Usa POST en /foda-zona, /producto-estrategia o /pasos-presupuesto.`,
      timestamp: new Date().toISOString(),
    },
    405
  );
});

export default preguntasRoute;
