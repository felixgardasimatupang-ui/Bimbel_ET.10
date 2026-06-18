FROM node:22-alpine AS builder

ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_SENTRY_DSN
ARG VITE_GPS_LAT
ARG VITE_GPS_LON
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_GPS_LAT=$VITE_GPS_LAT
ENV VITE_GPS_LON=$VITE_GPS_LON
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache wget && \
    rm -f /etc/nginx/conf.d/default.conf

COPY --chown=101:101 --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
