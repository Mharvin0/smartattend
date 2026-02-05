## Railway Deploy (Dockerfile) — SmartAttend

### 1) Railway setup
- Push your repo to GitHub
- Railway → New Project → Deploy from GitHub Repo
- In service settings, ensure it uses **Dockerfile** build (Railway auto-detects if `Dockerfile` exists)

### 2) Required Railway Variables (App service)
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=base64:...` (generate locally via `php artisan key:generate --show`)
- `APP_URL=https://<your-domain>.up.railway.app`

DB (MySQL):
- `DB_CONNECTION=mysql`
- `DB_HOST=<your mysql host>` (Railway internal or public proxy)
- `DB_PORT=3306` (internal) or proxy port
- `DB_DATABASE=railway`
- `DB_USERNAME=root`
- `DB_PASSWORD=<mysql password>`

Optional (recommended):
- `LOG_CHANNEL=stderr`
- `CACHE_STORE=file`
- `SESSION_DRIVER=file`
- `QUEUE_CONNECTION=sync`

### 3) Migrations
Migrations run automatically on every deploy (`RUN_MIGRATIONS` defaults to `true`).
Set `RUN_MIGRATIONS=false` only if you run migrations separately (e.g. from CI).

