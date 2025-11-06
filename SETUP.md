# Setup Guide - Fixing CSRF Token Errors

When cloning this Laravel application, you may encounter CSRF token errors. Follow these steps to fix them:

## Quick Fix Steps

1. **Generate Application Key** (Most Important!)
   ```bash
   php artisan key:generate
   ```
   This creates a unique `APP_KEY` in your `.env` file. Each clone must have its own unique key.

2. **Clear All Caches**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

3. **Verify .env File Exists**
   - Make sure you have a `.env` file in the root directory
   - If you don't have one, copy from `.env.example` (if available):
     ```bash
     cp .env.example .env
     php artisan key:generate
     ```

4. **Set Up Database**
   ```bash
   php artisan migrate
   ```

5. **Run Optimize (Optional but Recommended)**
   ```bash
   php artisan optimize:clear
   ```

## Why CSRF Token Errors Occur

CSRF (Cross-Site Request Forgery) token errors typically happen when:
- The `APP_KEY` is missing or invalid in `.env`
- Configuration cache is stale
- Session configuration is incorrect
- The `VerifyCsrfToken` middleware is missing or misconfigured

## Additional Troubleshooting

If you still experience issues:

1. **Check Session Configuration**
   - Ensure `SESSION_DRIVER` is set correctly in `.env` (default: `database`)
   - If using database sessions, run migrations

2. **Verify Middleware**
   - The `VerifyCsrfToken` middleware should exist at `app/Http/Middleware/VerifyCsrfToken.php`
   - Check `app/Http/Kernel.php` to ensure it's registered

3. **Check Storage Permissions**
   ```bash
   # Ensure storage directories are writable
   chmod -R 775 storage bootstrap/cache
   ```

4. **Clear Browser Cache**
   - Clear your browser cookies and cache for the application
   - Try an incognito/private window

## Complete Setup Checklist

- [ ] Clone the repository
- [ ] Copy `.env.example` to `.env` (if needed)
- [ ] Run `php artisan key:generate`
- [ ] Update database credentials in `.env`
- [ ] Run `php artisan migrate`
- [ ] Run `php artisan optimize:clear`
- [ ] Install dependencies: `composer install` and `npm install`
- [ ] Build assets: `npm run build` (or `npm run dev` for development)

## Need Help?

If problems persist, check:
- Laravel logs: `storage/logs/laravel.log`
- PHP version compatibility (requires PHP ^8.2)
- All required PHP extensions are installed

