// src/middleware/error.middleware.ts
// Manejo centralizado de errores para Hono

import type { ErrorHandler, NotFoundHandler } from "hono";
import { ApplicationError, NotFoundError } from "../types/errors.ts";

export const errorHandler: ErrorHandler = (err, c) => {
    const timestamp = new Date().toISOString();
    const isDevelopment = process.env["NODE_ENV"] !== "production";

    console.error(`[${timestamp}] ERROR:`, {
        mensaje: err.message,
        ruta: c.req.path,
        metodo: c.req.method,
        ...(isDevelopment && { stack: err.stack }),
    });

    if (err instanceof ApplicationError) {
        return c.json(
            {
                exito: false,
                error: err.code,
                mensaje: err.message,
                detalles: err.details,
                timestamp,
            },
            err.statusCode as any
        );
    }

    // Fallback para errores no controlados / genéricos
    return c.json(
        {
            exito: false,
            error: "ERROR_INTERNO",
            mensaje: isDevelopment
                ? err.message
                : "Ocurrió un error interno. Por favor intenta de nuevo.",
            timestamp,
        },
        500
    );
};

export const notFoundHandler: NotFoundHandler = (c) => {
    const err = new NotFoundError(`La ruta "${c.req.method} ${c.req.path}" no existe.`);
    return c.json(
        {
            exito: false,
            error: err.code,
            mensaje: err.message,
            timestamp: new Date().toISOString(),
        },
        err.statusCode as any
    );
};
