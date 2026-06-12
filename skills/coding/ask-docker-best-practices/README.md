# Docker Best Practices

Best practices for writing Dockerfiles, optimizing images, and securing containerized deployments.

## Key Principles

1. **Pin Base Images** — Always use specific versions (e.g., `node:18-alpine3.18`), never `latest`.
2. **Multi-Stage Builds** — Separate build and runtime stages to minimize final image size.
3. **Layer Caching** — Order `RUN`, `COPY` instructions from least to most frequently changing.
4. **Non-Root User** — Use `USER` directive; never run as root in production.
5. **Scan Images** — Use `docker scan` or Trivy for vulnerability detection.

## Example Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --production
USER node
CMD ["node", "dist/server.js"]
```

## .dockerignore

```
node_modules
.git
.env
dist
Dockerfile
```

## `docker compose` Best Practices

- Use `healthcheck` to let services wait for dependencies.
- Set `restart: unless-stopped` for production.
- Limit resources with `deploy.resources.limits`.
- Prefer named volumes (`docker volume create`) over bind mounts for data.

## Image Size Optimization Tips

| Technique | Typical Savings |
|-----------|----------------|
| Switch to alpine | 50-80% |
| Multi-stage build | 30-70% |
| RUN --no-cache | 5-15% |
| Combine RUN layers | 10-20% |
