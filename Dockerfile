# Imagen de producción multi-etapa (Node 22 LTS). Funciona igual en AWS (ECS / App Runner)
# y en Azure (Container Apps / App Service para contenedores).

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# La CSP se genera al compilar: los dominios de imágenes y subidas se pasan con --build-arg.
ARG NEXT_PUBLIC_IMAGE_HOST
ARG NEXT_PUBLIC_UPLOAD_HOST
ENV NEXT_PUBLIC_IMAGE_HOST=$NEXT_PUBLIC_IMAGE_HOST NEXT_PUBLIC_UPLOAD_HOST=$NEXT_PUBLIC_UPLOAD_HOST
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Certificado de AWS RDS para la conexión SSL (el valor real de DATABASE_URL llega por Secrets Manager).
ENV DATABASE_SSL_CA_FILE=/app/certs/global-bundle.pem
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/global-bundle.pem ./certs/global-bundle.pem
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
