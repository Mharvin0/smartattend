#
# Production Dockerfile for SmartAttend (Laravel 12 + Inertia React/Vite)
# Single container: Nginx + PHP-FPM
#

############################
# 1) Build frontend assets
############################
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json vite.config.js postcss.config.js tailwind.config.js ./
COPY resources ./resources
COPY public ./public

RUN npm ci --no-audit --no-fund
RUN npm run build


############################
# 2) Install PHP dependencies
############################
FROM composer:2 AS composer_bin
FROM php:8.2-cli-bookworm AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
COPY --from=composer_bin /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Composer needs zip/unzip for dist installs, and git for source fallback
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
  && docker-php-ext-install -j$(nproc) zip \
  && rm -rf /var/lib/apt/lists/*

RUN composer install \
  --no-dev \
  --no-interaction \
  --no-progress \
  --prefer-dist \
  --optimize-autoloader \
  --no-scripts


############################
# 3) Runtime (PHP-FPM + Nginx)
############################
FROM php:8.2-fpm-bookworm

ENV APP_DIR=/var/www/html

# OS packages + PHP extensions for Laravel
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    git \
    unzip \
    ca-certificates \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libicu-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) pdo_mysql zip gd intl opcache \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && rm -rf /var/lib/apt/lists/*

# App files
WORKDIR ${APP_DIR}
COPY . ${APP_DIR}
COPY --from=vendor /app/vendor ${APP_DIR}/vendor
COPY --from=frontend /app/public/build ${APP_DIR}/public/build

# Nginx + Supervisor + entrypoint
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Permissions (Railway uses ephemeral FS, but Laravel needs writable storage)
RUN chown -R www-data:www-data ${APP_DIR}/storage ${APP_DIR}/bootstrap/cache \
  && chmod -R ug+rwx ${APP_DIR}/storage ${APP_DIR}/bootstrap/cache

# Railway provides $PORT; entrypoint will template nginx to use it.
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]

