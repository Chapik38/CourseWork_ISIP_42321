#!/usr/bin/env bash
set -euo pipefail

MYSQL_SOCKET="/run/mysqld/mysqld.sock"
SEEDED_FLAG="/var/lib/mysql/.compcraft_seeded"

mkdir -p /run/mysqld /var/lib/mysql /var/log/compcraft
chown -R mysql:mysql /run/mysqld /var/lib/mysql

# Если пользователь подключил пустой volume, системных таблиц MariaDB ещё нет.
if [ ! -d "/var/lib/mysql/mysql" ]; then
  echo "[CompCraft] Инициализация MariaDB..."
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql --skip-test-db >/dev/null
fi

echo "[CompCraft] Запуск MariaDB..."
mysqld_safe --datadir=/var/lib/mysql --socket="$MYSQL_SOCKET" --bind-address=127.0.0.1 >/var/log/compcraft/mysql.log 2>&1 &
MYSQL_PID=$!

for i in {1..60}; do
  if mysqladmin --protocol=socket --socket="$MYSQL_SOCKET" -uroot ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" = "60" ]; then
    echo "[CompCraft] MariaDB не запустилась. Логи:"
    cat /var/log/compcraft/mysql.log || true
    exit 1
  fi
done

# Создаём БД и пользователя для приложения. Для one-click контейнера даём права на seed/init.
mysql --protocol=socket --socket="$MYSQL_SOCKET" -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL

cd /app/backend

# Seed выполняется один раз для нового volume. RESET_SEED=true пересоздаст демо-данные.
if [ ! -f "$SEEDED_FLAG" ] || [ "${RESET_SEED:-false}" = "true" ]; then
  echo "[CompCraft] Заполнение базы демо-данными..."
  npm run seed
  touch "$SEEDED_FLAG"
fi

echo "[CompCraft] Запуск Express API..."
node app.js >/var/log/compcraft/backend.log 2>&1 &
BACKEND_PID=$!

# Небольшая пауза, чтобы API успел подняться до nginx.
sleep 2

echo "[CompCraft] Запуск Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

_term() {
  echo "[CompCraft] Остановка сервисов..."
  kill -TERM "$NGINX_PID" "$BACKEND_PID" "$MYSQL_PID" 2>/dev/null || true
  wait || true
}
trap _term SIGTERM SIGINT

wait -n "$NGINX_PID" "$BACKEND_PID" "$MYSQL_PID"
_term
