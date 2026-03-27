/**
 * @module PreguntasRoutes
 * @description Define los endpoints para el análisis de emprendimientos.
 * Incluye lógica de validación de temas, generación de FODA, productos y presupuestos.
 */

import { Hono } from "hono";
import { validatePreguntasMiddleware } from "../middleware/validate.middleware.ts";
import { rateLimitMiddleware } from "../middleware/rateLimit.middleware.ts";
import { businessAnalysisDelayMiddleware } from "../middleware/businessAnalysisDelay.middleware.ts";
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

/**
 * Verifica si el tema es válido y aborta la petición con un error 400 si no lo es.
 * @param c - Contexto de Hono.
 * @param datos - Datos validados del negocio.
 * @returns Una respuesta JSON de error o null si es válido.
 */
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
  businessAnalysisDelayMiddleware,
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
  businessAnalysisDelayMiddleware,
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
  businessAnalysisDelayMiddleware,
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
