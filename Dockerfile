

# ---------- Frontend build ----------
FROM node:20-bookworm AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- Backend dependencies ----------
FROM node:20-bookworm AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./


FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    mariadb-server \
    mariadb-client \
    nginx \
    tini \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-build /app/backend /app/backend
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
  && mkdir -p /run/mysqld /var/log/compcraft \
  && chown -R mysql:mysql /run/mysqld /var/lib/mysql

ENV NODE_ENV=production \
    PORT=5000 \
    API_PREFIX=/api/v1 \
    DB_HOST=127.0.0.1 \
    DB_PORT=3306 \
    DB_USER=compcraft \
    DB_PASSWORD=compcraft_password \
    DB_NAME=pc_configurator_pro \
    SESSION_SECRET=change_me_session_secret \
    JWT_ACCESS_SECRET=change_me_access_secret \
    JWT_REFRESH_SECRET=change_me_refresh_secret \
    JWT_ACCESS_EXPIRES=15m \
    JWT_REFRESH_EXPIRES=7d \
    BCRYPT_ROUNDS=12 \
    FRONTEND_ORIGIN=http://localhost

EXPOSE 80
VOLUME ["/var/lib/mysql"]

ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
