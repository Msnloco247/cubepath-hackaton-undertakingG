# 1. Base Setup
FROM oven/bun:alpine AS base
# Instalar bash porque Dokploy lo necesita para ejecutar sus procesos internos
RUN apk add --no-cache bash
WORKDIR /app

# Instalamos dependencias de producción
COPY package.json bun.lock* ./
RUN bun install --production

# 3. Empaquetado para Producción
FROM base AS release
# Copiamos solo dependencias de producción
COPY --from=install /app/node_modules node_modules

# Copiamos el código fuente (excluye ficheros en .dockerignore)
COPY . .

# Seguridad: Asignamos permisos al usuario no root provisto por 'oven/bun'
RUN chown -R bun:bun /app

# Cambiamos al usuario "bun" (UID 1000) en lugar de usar root
USER bun

# Establecemos variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=3000

# Exposición del puerto declarado en la app
EXPOSE 3000

# Ejecutar el proyecto
CMD ["bun", "start"]
