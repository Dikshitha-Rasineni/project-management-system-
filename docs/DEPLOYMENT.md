# Deployment guide

Target setup (all have free tiers):

| Part | Service | Result |
|---|---|---|
| Database | **Neon** (PostgreSQL) | `postgresql://…neon.tech/…?sslmode=require` |
| Backend API | **Render** (Node web service) | `https://pms-api-xxxx.onrender.com/api` |
| Web app | **Vercel** (static Vite build) | `https://pms-web-xxxx.vercel.app` |
| Android app | **Expo EAS Build** | Downloadable `.apk` + install link |

Do the steps in this order — each step needs a URL from the previous one.

> Steps marked 🔑 need your own account/credentials and can't be automated from the repo.

---

## 1. Database — Neon 🔑

1. Sign up at <https://neon.tech> → **Create project** (PostgreSQL 16, region near you).
2. Copy the **connection string** (Dashboard → Connection Details). It looks like
   `postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.
3. Keep it secret — it goes into Render as `DATABASE_URL` only.

Migrations run automatically when the backend starts (`npm run start:prod` runs
`prisma migrate deploy`). To load the **test data** once, from your laptop:

```bash
cd backend
DATABASE_URL="<neon url>" npx prisma migrate deploy
DATABASE_URL="<neon url>" npm run db:seed
```

(Supabase or Railway Postgres work the same way — just use their connection string.)

## 2. Backend — Render 🔑

**Option A — Blueprint (uses `render.yaml`):** Render → **New → Blueprint** → pick the repo.
Render reads `render.yaml`, generates `JWT_SECRET`, and asks for `DATABASE_URL` and
`CORS_ORIGIN`.

**Option B — manual web service:** Render → **New → Web Service** → connect the repo, then:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm run start:prod` |
| Health check path | `/api/health` |

Environment variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | 48+ random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://pms-web-xxxx.vercel.app` (set a placeholder first, update after step 3) |
| `TRUST_PROXY` | `1` (Render sits behind a proxy; needed for per-IP rate limiting) |
| `LOG_LEVEL` | `info` |

Verify: open `https://<service>.onrender.com/api/health` → `{"success":true,…}` and
`https://<service>.onrender.com/api/docs` for Swagger UI.

> Render's free tier sleeps after ~15 minutes idle; the first request then takes ~30–60 s.
> Open `/api/health` a minute before a demo to wake it up.

`--include=dev` is needed because the TypeScript compiler and the Prisma CLI (used for
`migrate deploy` at start-up) are dev dependencies.

## 3. Web app — Vercel 🔑

1. Vercel → **Add New → Project** → import the repo.
2. **Root directory:** `web`. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL = https://<service>.onrender.com/api`
4. Deploy. `web/vercel.json` adds the SPA rewrite (deep links like `/projects/:id` work on
   refresh) and security headers.
5. Go back to Render and set `CORS_ORIGIN` to the exact Vercel URL (no trailing slash).
   Several origins can be comma-separated, e.g. `https://pms.vercel.app,http://localhost:5173`.

Netlify works too: base dir `web`, build `npm run build`, publish `web/dist`, same env var,
plus a `_redirects` file with `/* /index.html 200`.

## 4. Android app — Expo EAS 🔑

The mobile app reads the backend URL from `EXPO_PUBLIC_API_URL` **at build time**.

1. Edit `mobile/eas.json` → replace `https://REPLACE-WITH-YOUR-BACKEND.onrender.com/api` (in
   both `preview` and `production`) with your Render URL + `/api`.
2. Create a free account at <https://expo.dev>, then:

   ```bash
   cd mobile
   npm install
   npx eas-cli@latest login
   npx eas-cli@latest init          # links the project, writes extra.eas.projectId into app.json
   npm run build:apk                # = eas build -p android --profile preview
   ```

3. When the cloud build finishes (≈10–20 min), EAS prints a page URL with a QR code and a
   **download link for the `.apk`**. That link is your submission's "Android APK" link; you can
   also download the file and attach it to a GitHub Release.
4. Install on a phone: open the link on the device → download → allow "install unknown apps"
   for your browser → install **Tasklane**.

The `android.package` in `app.json` is `com.example.tasklane`; change it to your own reverse
domain before publishing anywhere public.

### Pointing the mobile app at a backend — all options

| Scenario | How |
|---|---|
| APK for submission | `EXPO_PUBLIC_API_URL` in `eas.json` → deployed Render URL |
| Expo Go against the **deployed** backend | `mobile/.env.local`: `EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api`, then `npx expo start -c` |
| Expo Go on a phone against your **laptop** | Leave it unset — in dev the app uses `http://<laptop-LAN-IP>:4000/api` automatically (phone and laptop on the same Wi-Fi; allow port 4000 through the firewall) |
| Android emulator against your laptop | `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api` (or leave unset) |

The Account tab in the app shows which API URL it is using — handy when debugging.

Release builds only talk to HTTPS backends (Android blocks plain HTTP by default), which is
another reason the APK must point at the deployed `https://` URL.

## 5. Final check (the demo flow)

1. Web: register → create a project → add a task → change its status/priority.
2. Phone (APK): log in with the same account → pull to refresh → the project and task appear.
3. Phone: add or edit a task.
4. Web: refresh (or just switch back to the tab — it refetches on focus) → the change is there.

## Docker (optional, local)

```bash
docker compose up --build      # PostgreSQL + API on http://localhost:4000
docker compose exec api npx prisma db seed   # optional test data
```

The image runs `prisma migrate deploy` before starting. The compose file uses a local-only
JWT secret — never reuse it in a real deployment.
