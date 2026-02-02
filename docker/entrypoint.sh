#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/html}"
cd "$APP_DIR"

# Treat common truthy values as true (handles values entered with quotes in Railway UI)
is_truthy() {
  local v="${1:-false}"
  # strip surrounding single/double quotes
  v="${v%\"}"; v="${v#\"}"
  v="${v%\'}"; v="${v#\'}"
  # lowercase
  v="$(echo "$v" | tr '[:upper:]' '[:lower:]')"
  case "$v" in
    1|true|yes|y|on) return 0 ;;
    *) return 1 ;;
  esac
}

# Ensure Laravel dirs exist
mkdir -p storage/framework/{cache,sessions,views} storage/framework/cache/data bootstrap/cache
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
if is_truthy "${RUN_MIGRATIONS:-false}"; then
  echo "Running migrations..."
  php artisan migrate --force || true
fi

# Optionally seed demo data on boot (set RUN_SEEDERS=true)
# Note: DatabaseSeeder is non-destructive by default, but StudentSeeder clears academic tables.
if is_truthy "${RUN_SEEDERS:-false}"; then
  echo "Seeding database..."
  php artisan db:seed --force --no-interaction || true
fi

# Cache config/routes/views (safe; can be toggled off)
if is_truthy "${CACHE_CONFIG:-true}"; then
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

