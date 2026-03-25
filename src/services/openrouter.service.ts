// src/services/openrouter.service.ts
// Servicio de integración con IA usando el SDK Oficial

import { config } from "../config/env.ts";
import { OpenRouterError } from "../types/errors.ts";
import { OpenRouter } from "@openrouter/sdk";
import type {
  OpenRouterMessage,
  PreguntasRequest,
  VerificacionTema,
  AnalisisFODA,
  AnalisisZona,
  AnalisisProducto,
  EstrategiasClave,
  AnalisisPasos
} from "../types/index.ts";

// ─── Inicializar SDK OpenRouter ───────────────────────────────────────────────

const openrouter = new OpenRouter({
  apiKey: config.openrouter.apiKey
});

// ─── Prompts ──────────────────────────────────────────────────────────────────

import {
  THEME_VALIDATION_SYSTEM_PROMPT,
  FODA_ZONA_SYSTEM_PROMPT,
  PRODUCTO_ESTRATEGIA_SYSTEM_PROMPT,
  PASOS_GESTACION_SYSTEM_PROMPT,
  PASOS_OPERACION_SYSTEM_PROMPT,
} from "../prompts/system.prompts.ts";

// ─── Lógica central de API IA ─────────────────────────────────────────────────

async function llamarOpenRouterConReintento(
  mensajesOriginales: OpenRouterMessage[],
  endpointName: string,
  extraxtorJsonInfo: (jsonObj: any) => boolean,
  overrideModel?: string
): Promise<{ parsed: any; modelo: string }> {
  const selectedModel = overrideModel ?? config.openrouter.model;
  let ultimoError: unknown;
  const reintentosMaximos = 2;

  for (let intento = 0; intento <= reintentosMaximos; intento++) {
    try {
      const stream = await openrouter.chat.send({
        chatGenerationParams: {
          model: selectedModel,
          messages: mensajesOriginales,
          stream: true,
          response_format: { type: "json_object" }
        }
      } as any) as any;

      let contenido = "";
      for await (const chunk of stream) {
        const deltaContent = chunk.choices[0]?.delta?.content;
        if (deltaContent) contenido += deltaContent;
      }

      if (!contenido) throw new Error("Respuesta vacía de IA");

      // Buscar si devolvió algo envuelto en markdown
      const cleanJson = contenido.replace(/```json/g, "").replace(/```/g, "").trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : cleanJson;

      const parsed = JSON.parse(jsonStr);
      if (extraxtorJsonInfo(parsed)) {
        return { parsed, modelo: selectedModel };
      }
      throw new Error(`Estructura JSON incompleta para: ${endpointName}`);

    } catch (err: any) {
      ultimoError = err;
      if (intento < reintentosMaximos) {
        console.warn(`⚠️ Intento ${intento + 1} fallido en ${endpointName}. Reintentando...`);
        // Fallback: Si falló de formato, podríamos inyectar un system prompt reforzando JSON
        // Pero típicamente con modelos gratuitos, un simple retry directo funciona mejor ante fallas de red o stream cortado
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        console.warn(`❌ Fallo definitivo tras ${reintentosMaximos} reintentos en ${endpointName}.`);
      }
    }
  }

  if (ultimoError instanceof SyntaxError) {
     throw new OpenRouterError(`El modelo de IA devolvió un JSON inválido tras múltiples intentos en ${endpointName}`);
  }
  
  throw new OpenRouterError(`Fallo al generar ${endpointName} vía IA. Asegúrate de tener saldo o cambia de modelo.`);
}

// ─── Funciones Públicas ───────────────────────────────────────────────────────

export async function verificarTemaEmprendimiento(
  datos: PreguntasRequest
): Promise<VerificacionTema> {
  const contenidoUsuario = armarContenidoUsuario(datos);
  const mensajes: OpenRouterMessage[] = [
    { role: "system", content: THEME_VALIDATION_SYSTEM_PROMPT },
    { role: "user", content: contenidoUsuario },
  ];

  try {
    const { parsed, modelo } = await llamarOpenRouterConReintento(
      mensajes, 
      "validacion-tema", 
      (obj) => obj.esValido !== undefined
    );
    return {
      esValido: Boolean(parsed.esValido),
      razon: parsed.razon || "Evaluación completada",
    };
  } catch (err) {
    console.error("Error en validación de tema:", err);
    return {
      esValido: false,
      razon: "No se pudo verificar si el tema pertenece a emprendimiento.",
    };
  }
}

export async function generarFodaYZona(
  datos: PreguntasRequest
): Promise<{ analisisFODA: AnalisisFODA; analisisZona: AnalisisZona; modelo: string }> {
  const mensajes: OpenRouterMessage[] = [
    { role: "system", content: FODA_ZONA_SYSTEM_PROMPT },
    { role: "user", content: armarContenidoUsuario(datos) },
  ];

  const { parsed, modelo } = await llamarOpenRouterConReintento(
    mensajes,
    "foda-zona",
    (obj) => obj.analisisFODA && obj.analisisZona
  );
  return { analisisFODA: parsed.analisisFODA, analisisZona: parsed.analisisZona, modelo };
}

export async function generarProductoYEstrategia(
  datos: PreguntasRequest
): Promise<{ analisisProducto: AnalisisProducto; estrategiasClave: EstrategiasClave; modelo: string }> {
  const mensajes: OpenRouterMessage[] = [
    { role: "system", content: PRODUCTO_ESTRATEGIA_SYSTEM_PROMPT },
    { role: "user", content: armarContenidoUsuario(datos) },
  ];

  const { parsed, modelo } = await llamarOpenRouterConReintento(
    mensajes,
    "producto-estrategias",
    (obj) => obj.analisisProducto && obj.estrategiasClave
  );
  return { analisisProducto: parsed.analisisProducto, estrategiasClave: parsed.estrategiasClave, modelo };
}

export async function generarPasosYPresupuesto(
  datos: PreguntasRequest
): Promise<{ analisisPasos: AnalisisPasos; modelo: string }> {
  const contenidoUsuario = armarContenidoUsuario(datos);

  const [resGestacion, resOperacion] = await Promise.all([
    llamarOpenRouterConReintento(
      [
        { role: "system", content: PASOS_GESTACION_SYSTEM_PROMPT },
        { role: "user", content: contenidoUsuario },
      ],
      "pasos-gestacion",
      (obj) => Array.isArray(obj.pasos)
    ),
    llamarOpenRouterConReintento(
      [
        { role: "system", content: PASOS_OPERACION_SYSTEM_PROMPT },
        { role: "user", content: contenidoUsuario },
      ],
      "pasos-operacion",
      (obj) => Array.isArray(obj.pasos) && typeof obj.rango_presupuesto_total === "string"
    ),
  ]);

  const pasosCombinados = [
    ...resGestacion.parsed.pasos.map((p: any) => ({ ...p, fase: "Gestación y Formalización" })),
    ...resOperacion.parsed.pasos.map((p: any) => ({ ...p, fase: "Lanzamiento y Operación" })),
  ];

  return {
    analisisPasos: {
      pasos: pasosCombinados,
      rango_presupuesto_total: resOperacion.parsed.rango_presupuesto_total,
    },
    modelo: `${resGestacion.modelo} + ${resOperacion.modelo}`,
  };
}

function armarContenidoUsuario(datos: PreguntasRequest): string {
  return [
    `Instrucciones: Toma los siguientes datos y genera el análisis JSON solicitado. Piensa sobre el impacto geográfico de la "Ubicación Objetivo" en el mercado.`,
    `\n--- DATOS DEL NEGOCIO ---`,
    datos.ubicacion ? `Ubicación Objetivo: ${datos.ubicacion}` : "",
    datos.contexto ? `Contexto aportado: ${datos.contexto}` : "",
    "Respuestas estructuradas:",
    ...datos.respuestasCliente.map((p: string) => `- ${p}`),
    `--- FIN DE LOS DATOS ---`
  ].filter(Boolean).join("\n");
}
