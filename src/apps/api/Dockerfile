FROM node:22.15.0-alpine3.20 AS base

FROM base as pnpm
RUN apk update
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM pnpm AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @map-of-science/api --docker

FROM pnpm AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build
RUN find . -name node_modules -type d -prune -exec rm -rf '{}' +
RUN pnpm install --prod

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 app
RUN adduser --system --uid 1001 app
USER app
COPY --from=builder /app/src/apps/api/dist ./dist
COPY --from=builder /app/src/apps/api/node_modules ./node_modules
COPY --from=builder /app/src/apps/api/package.json ./package.json

CMD node dist/index.js