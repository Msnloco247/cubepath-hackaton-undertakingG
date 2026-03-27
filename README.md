# ⚙️ UndertakingG — Backend API (Bun & Hono)

Este es el motor de inteligencia de negocios de la plataforma **UndertakingG**. Proporciona una orquestación avanzada de modelos de lenguaje para generar análisis estratégicos estructurados y planes de acción para emprendedores.

---

## 🚀 Capacidades de la API

El backend está diseñado para ofrecer respuestas de baja latencia y alta confiabilidad, utilizando un sistema de validación de múltiples capas.

### Endpoints Principales:
- **`POST /api/preguntas/foda-zona`**: Genera un análisis FODA detallado y contextualizado geográficamente.
- **`POST /api/preguntas/producto-estrategia`**: Define la propuesta de valor y las estrategias de penetración de mercado.
- **`POST /api/preguntas/pasos-presupuesto`**: Crea una hoja de ruta operativa cronometrada con estimaciones de costos.

---

## 🛠️ Stack Tecnológico

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Lenguaje**: TypeScript
- **Cache/Rate Limit**: Redis
- **IA**: OpenRouter SDK

---

## 🛡️ Características de Seguridad

- **Protección de Prompts**: Implementa técnicas de "Prompt Fencing" para evitar manipulaciones de IA (*Prompt Injection*).
- **Control de Acceso**: Middleware de Rate Limiting basado en Redis para prevenir abusos por IP.
- **Validación de Esquema**: Uso estricto de tipos y validación de JSON para asegurar que la salida de la IA sea siempre procesable.
- **Auditoría de Contenido**: Filtra y valida que las peticiones estén relacionadas exclusivamente con el ámbito empresarial.

---

## 📦 Despliegue y Desarrollo

### Configuración con Docker
```bash
docker-compose up --build -d
```

### Configuración Manual
1.  Instala las dependencias: `bun install`
2.  Configura las variables de entorno en un archivo `.env` (basado en `.env.example`).
3.  Inicia en desarrollo: `bun run dev`
4.  Modo producción: `bun run start`


