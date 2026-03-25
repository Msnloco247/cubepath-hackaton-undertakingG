// src/types/errors.ts
// Clases de errores personalizadas para un manejo estandarizado

export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = "ERROR_INTERNO",
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Mantiene el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "ERRORES_VALIDACION", 400, details);
  }
}

export class OpenRouterError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "ERROR_SERVICIO_IA", 502, details);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string) {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = "Recurso no encontrado") {
    super(message, "RUTA_NO_ENCONTRADA", 404);
  }
}
