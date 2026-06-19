FROM node:22-alpine AS builder

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/http.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD sh -c "sed -i 's|__BACKEND_URL__|${BACKEND_URL:-http://backend.railway.internal:3001}|g' /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"