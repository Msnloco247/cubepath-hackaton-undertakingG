// src/middleware/cors.middleware.ts
// Middleware de CORS para Hono

import type { MiddlewareHandler } from "hono";
import { config } from "../config/env.ts";

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
    const origin = c.req.header("Origin") ?? "*";
    const allowed = config.cors.allowedOrigins;

    // Determinar si el origen está permitido
    const allowOrigin =
        allowed === "*"
            ? "*"
            : allowed.split(",").map((o) => o.trim()).includes(origin)
                ? origin
                : "";

    c.header("Access-Control-Allow-Origin", allowOrigin || "null");
    c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
    );
    c.header("Access-Control-Max-Age", "86400");
    c.header("Vary", "Origin");

    // Responder preflight directamente
    if (c.req.method === "OPTIONS") {
        return new Response(null, { status: 204 });
    }

    await next();
};
