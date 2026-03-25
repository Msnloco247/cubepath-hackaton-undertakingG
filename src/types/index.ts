// src/types/index.ts
// Tipos e interfaces TypeScript para la API

// ─── Request ──────────────────────────────────────────────────────────────────

export interface PreguntasRequest {
    /** Array de respuestas del emprendedor (mínimo 1, máximo 10) */
    respuestasCliente: string[];
    /** Contexto adicional del emprendimiento (opcional) */
    contexto?: string;
    /** Ubicación geográfica (opcional) */
    ubicacion?: string;

}

// ─── FODA con Keywords ────────────────────────────────────────────────────────

export interface FODAItem {
    keyword: string;
    descripcion: string;
}

export interface AnalisisFODA {
    fortalezas: FODAItem[];
    oportunidades: FODAItem[];
    debilidades: FODAItem[];
    amenazas: FODAItem[];
}

// ─── Análisis de Zona ─────────────────────────────────────────────────────────

export interface AnalisisZona {
    descripcion: string;
    ventajas: string[];
    desventajas: string[];
    recomendaciones: string;
}

// ─── Análisis de Producto ─────────────────────────────────────────────────────

export interface AnalisisProducto {
    descripcion: string;
    propuestaValor: string;
    publicoObjetivo: string;
    diferenciadores: string[];
}

// ─── Estrategias Clave ────────────────────────────────────────────────────────

export interface EstrategiasClave {
    corto_plazo: string[];
    mediano_plazo: string[];
    largo_plazo: string[];
}

// ─── Response completa ────────────────────────────────────────────────────────

export interface AnalisisEmprendimiento {
    analisisFODA: AnalisisFODA;
    analisisZona: AnalisisZona;
    analisisProducto: AnalisisProducto;
    estrategiasClave: EstrategiasClave;
}

// ─── Análisis Paso a Paso con Presupuesto ─────────────────────────────────────

export interface PasoEmprendimiento {
    paso: string;
    fase: string;
    descripcionDetallada: string;
    presupuestoEstimado: string;
    justificacionCostos: string;
    contextoLocalYLeyes: string;
}

export interface AnalisisPasos {
    pasos: PasoEmprendimiento[];
    rango_presupuesto_total: string;
}

// ─── Responses Específicas ────────────────────────────────────────────────────

export interface FodaZonaResponse {
    exito: true;
    analisis: {
        analisisFODA: AnalisisFODA;
        analisisZona: AnalisisZona;
    };
    modelo: string;
    timestamp: string;
}

export interface ProductoEstrategiaResponse {
    exito: true;
    analisis: {
        analisisProducto: AnalisisProducto;
        estrategiasClave: EstrategiasClave;
    };
    modelo: string;
    timestamp: string;
}

export interface PasosPresupuestoResponse {
    exito: true;
    analisis: AnalisisPasos;
    modelo: string;
    timestamp: string;
}

// ─── Verificación de tema ─────────────────────────────────────────────────────

export interface VerificacionTema {
    esValido: boolean;
    razon: string;
}

// ─── Errores ──────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
    exito: false;
    error: string;
    mensaje: string;
    timestamp: string;
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

export interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" };
}

export interface OpenRouterResponse {
    id: string;
    model: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// ─── Rate Limit ───────────────────────────────────────────────────────────────

export interface RateLimitEntry {
    count: number;
    resetAt: number;
}
