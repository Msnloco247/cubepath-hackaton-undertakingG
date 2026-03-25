/**
 * @module ValidationMiddleware
 * @description Middleware encargado de la validación sintáctica, estructural y sanitización de las peticiones entrantes.
 * Asegura que los datos respeten los límites de longitud y tipos antes de ser procesados por la IA.
 */

import type { Context, Next } from "hono";
import type { PreguntasRequest } from "../types/index.ts";
import { ValidationError, ApplicationError } from "../types/errors.ts";

type Variables = {
    preguntasValidadas: PreguntasRequest;
};

const MAX_PREGUNTAS = 10;
const MIN_PREGUNTAS = 1;
const MAX_LONGITUD_PREGUNTA = 500;
const MAX_LONGITUD_CONTEXTO = 1000;

/**
 * Sanitiza un string eliminando caracteres de control invisibles y limitando su longitud.
 * @param texto - El texto original del usuario.
 * @returns El texto limpio y recortado.
 */
function sanitizarTexto(texto: string): string {
    return texto
        .trim()
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Caracteres de control
        .slice(0, MAX_LONGITUD_PREGUNTA);
}

/**
 * Middleware principal de validación para los endpoints de preguntas.
 * Verifica el Content-Type, la estructura JSON y las reglas de negocio (min/max de respuestas).
 * Adjunta los datos sanitizados al contexto de Hono como 'preguntasValidadas'.
 */
export const validatePreguntasMiddleware = async (
    c: Context<{ Variables: Variables }>,
    next: Next
) => {
    // Verificar Content-Type
    const contentType = c.req.header("Content-Type") ?? "";
    if (!contentType.includes("application/json")) {
        throw new ApplicationError("El Content-Type debe ser 'application/json'.", "CONTENT_TYPE_INVALIDO", 415);
    }

    // Parsear body
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        throw new ValidationError("El cuerpo de la solicitud no es un JSON válido.", { error: "JSON_INVALIDO" });
    }

    // Verificar que sea un objeto
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new ValidationError("El cuerpo debe ser un objeto JSON.", { error: "BODY_INVALIDO" });
    }

    const data = body as Record<string, unknown>;

    // Validar campo "respuestasCliente"
    if (!("respuestasCliente" in data)) {
        throw new ValidationError('El campo "respuestasCliente" es requerido.');
    }

    if (!Array.isArray(data["respuestasCliente"])) {
        throw new ValidationError('El campo "respuestasCliente" debe ser un arreglo de strings.', { error: "TIPO_INVALIDO" });
    }

    if (data["respuestasCliente"].length < MIN_PREGUNTAS) {
        throw new ValidationError("Debes enviar al menos una respuesta.", { error: "RESPUESTAS_VACIAS" });
    }

    if (data["respuestasCliente"].length > MAX_PREGUNTAS) {
        throw new ValidationError(`Puedes enviar un máximo de ${MAX_PREGUNTAS} respuestas por solicitud.`, { error: "DEMASIADAS_RESPUESTAS" });
    }

    // Validar que cada respuesta sea un string no vacío
    for (let i = 0; i < data["respuestasCliente"].length; i++) {
        const respuesta = data["respuestasCliente"][i];
        if (typeof respuesta !== "string" || respuesta.trim().length === 0) {
            throw new ValidationError(`La respuesta en el índice ${i} debe ser un texto no vacío.`);
        }
    }

    // Validar campo "contexto" (opcional)
    if ("contexto" in data && data["contexto"] !== undefined) {
        if (typeof data["contexto"] !== "string") {
            throw new ValidationError('El campo "contexto" debe ser un string.', { error: "TIPO_INVALIDO" });
        }
        if (data["contexto"].length > MAX_LONGITUD_CONTEXTO) {
            throw new ValidationError(`El "contexto" no puede superar ${MAX_LONGITUD_CONTEXTO} caracteres.`);
        }
    }

    // Validar campo "ubicacion" (opcional)
    if ("ubicacion" in data && data["ubicacion"] !== undefined) {
        if (typeof data["ubicacion"] !== "string") {
            throw new ValidationError('El campo "ubicacion" debe ser un string.', { error: "TIPO_INVALIDO" });
        }
        if (data["ubicacion"].length > MAX_LONGITUD_CONTEXTO) {
            throw new ValidationError(`La "ubicacion" no puede superar ${MAX_LONGITUD_CONTEXTO} caracteres.`);
        }
    }

    // Sanitizar y adjuntar datos validados al contexto de Hono
    const datosSanitizados: PreguntasRequest = {
        respuestasCliente: (data["respuestasCliente"] as string[]).map(sanitizarTexto),
        contexto:
            typeof data["contexto"] === "string"
                ? data["contexto"].trim().slice(0, MAX_LONGITUD_CONTEXTO)
                : undefined,
        ubicacion:
            typeof data["ubicacion"] === "string"
                ? data["ubicacion"].trim().slice(0, MAX_LONGITUD_CONTEXTO)
                : undefined,
    };

    c.set("preguntasValidadas", datosSanitizados);
    await next();
};
