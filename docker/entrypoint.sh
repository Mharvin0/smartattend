#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/html}"
cd "$APP_DIR"

# Ensure Laravel dirs exist
mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

# Render nginx config with Railway $PORT (defaults to 8080)
PORT="${PORT:-8080}"
export PORT
envsubst '${PORT}' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.rendered
mv /etc/nginx/nginx.conf.rendered /etc/nginx/nginx.conf

# If APP_KEY is missing, fail fast (common Railway misconfig)
if [ -z "${APP_KEY:-}" ]; then
  echo "ERROR: APP_KEY is not set. Set it in Railway Variables."
  exit 1
fi

# Optionally run migrations on boot (set RUN_MIGRATIONS=true)
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running migrations..."
  php artisan migrate --force || true
fi

# Cache config/routes/views (safe; can be toggled off)
if [ "${CACHE_CONFIG:-true}" = "true" ]; then
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

