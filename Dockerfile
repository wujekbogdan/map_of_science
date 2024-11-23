FROM node:22.11.0-alpine3.20 AS base

FROM base AS builder

WORKDIR /home/node

COPY package.json package-lock.json ./

ENV HUSKY=0
RUN npm ci

COPY . .

RUN export HUSKY=0
RUN npm run build:prod

FROM base AS installer

USER node
WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/dist ./dist
COPY --from=builder --chown=node:node /home/node/package.json ./package.json
COPY --from=builder --chown=node:node /home/node/package-lock.json ./package-lock.json

RUN npm ci --only=production

FROM base AS runner

USER node
WORKDIR /home/node

COPY --from=installer --chown=node:node /home/node/dist ./dist
