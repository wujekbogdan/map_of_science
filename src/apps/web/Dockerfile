FROM node:22.15.0-alpine3.20 AS base

FROM base AS pnpm
RUN apk update
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM pnpm AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @map-of-science/web --docker

FROM pnpm AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build

FROM nginx:1.27.2-alpine AS runner
COPY --from=builder /app/src/apps/web/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
