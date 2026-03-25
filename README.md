# UndertakingG — Backend (Bun/Hono)

Este es el servicio de API impulsado por IA de la plataforma **UndertakingG**. Proporciona una orquestación especializada para modelos generativos con el fin de generar análisis estratégicos estructurados para emprendedores.

## 🚀 Descripción de la API

El backend está construido con **Bun** y **Hono**, diseñado para respuestas de baja latencia y procesamiento de datos altamente estructurados.

### Endpoints Principales del Servicio:
- **`POST /api/preguntas/foda-zona`**: Análisis FODA (SWOT) y evaluación del mercado regional.
- **`POST /api/preguntas/producto-estrategia`**: Propuesta de valor, audiencia y estrategias por plazos.
- **`POST /api/preguntas/pasos-presupuesto`**: Hoja de ruta operativa y legal con presupuestos estructurados.

## 🛠️ Stack Tecnológico

- **Runtime**: Bun
- **Framework**: Hono
- **Lenguaje**: TypeScript
- **Orquestación de IA**: SDK de OpenRouter
## 🛡️ Seguridad y Robustez

- **Prevención de Prompt Injection**: Implementa *Prompt Fencing* (etiquetado `<user_input>`) y validación de temas mediante un auditor de IA dedicado para prevenir manipulaciones.
- **Rate Limiting**: Protección contra abusos mediante limitación de peticiones por IP usando Redis.
- **Validación Estricta**: Middleware de validación que asegura que los datos de entrada cumplan con los esquemas requeridos antes de procesar cualquier llamada a la IA.
- **Sanitización**: Limpieza de caracteres de control y etiquetas maliciosas en las entradas del usuario.

## 📦 Despliegue con Docker

El backend incluye configuración para producción y desarrollo mediante Docker.

```bash
# Iniciar API y Redis localmente
docker-compose up --build
```

### Notas de Seguridad en Docker:
- Ejecución con usuario no-root (`bun`).
- Aislamiento de red para Redis (no expuesto al exterior).
- Límites de recursos (RAM) configurados para evitar denegación de servicio.

## ⚙️ Características Arquitectónicas Clave

- **Separación de Prompts**: Los prompts están aislados estratégicamente para asegurar una alta confiabilidad del modelo y eficiencia en el uso de tokens.
- **Selección Dinámica de Modelo de IA**: Construido para consumir modelos específicos vía configuración para optimizar costo y rendimiento.
- **Llamadas de IA Resilientes**: Implementa patrones de reintento con backoff exponencial para estabilidad ante dependencias de APIs externas.
- **Validación de JSON Estructurado**: Asegura que todas las respuestas de la IA se ajusten a esquemas JSON estrictos antes de ser enviadas.

## 🛠️ Comandos Locales

Desde el directorio `backend`:
- `bun install`: Instala las dependencias.
- `bun run dev`: Inicia el servidor de desarrollo local en modo watch.
- `bun run start`: Ejecuta la aplicación en modo producción.
- `bun run test`: Ejecuta las pruebas del backend (si están disponibles).
