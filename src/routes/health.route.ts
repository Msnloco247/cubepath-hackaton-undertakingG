// src/routes/health.route.ts
// Endpoint de salud del servidor

import { Hono } from "hono";

const healthRoute = new Hono();

const startTime = Date.now();

healthRoute.get("/", (c) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    return c.json({
        exito: true,
        estado: "ok",
        uptime: `${uptimeSeconds}s`,
        timestamp: new Date().toISOString(),
        entorno: process.env["NODE_ENV"] ?? "development",
    });
});

export default healthRoute;
