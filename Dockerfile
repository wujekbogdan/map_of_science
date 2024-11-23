FROM node:22.11.0-alpine3.20 AS base

FROM base AS builder

WORKDIR /home/node

# Copy just the package.json and package-lock.json to utilize Docker's caching mechanism and cache the npm install step.
COPY package.json package-lock.json ./

ENV HUSKY=0
RUN npm ci

COPY . .

RUN export HUSKY=0
RUN npm run build

# Use a separate image as a runner to reduce the final image size.
FROM nginx:1.27.2-alpine AS runner

COPY --from=builder /home/node/dist /usr/share/nginx/html

# The app doesn't include any backend, so we need to serve the app using a standalone server.
CMD ["nginx", "-g", "daemon off;"]
