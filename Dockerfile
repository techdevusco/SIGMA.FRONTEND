# Build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve
FROM nginx:alpine

# Copia build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx SPA
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
\n\
  location / {\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    try_files $uri /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
