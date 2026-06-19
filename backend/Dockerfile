FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
RUN chown -R appuser:appgroup /app

COPY --chown=appuser:appgroup --from=builder /app/package*.json ./
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/src ./src
COPY --chown=appuser:appgroup --from=builder /app/prisma ./prisma
COPY --chown=appuser:appgroup --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=appuser:appgroup dist-public /usr/share/nginx/html
COPY --chown=appuser:appgroup docker-entrypoint.sh /app/docker-entrypoint.sh

RUN apk add --no-cache wget && \
    chmod +x /app/docker-entrypoint.sh

EXPOSE 3001

USER appuser

CMD ["/app/docker-entrypoint.sh"]
