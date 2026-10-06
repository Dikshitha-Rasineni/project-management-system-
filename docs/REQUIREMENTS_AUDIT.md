# Requirements audit

Every requirement from the assignment brief, where it is implemented, and how it was verified.
"Test" = backend integration test in `backend/tests/`. "E2E" = scripted browser run of the web
app. "Mobile run" = the Expo app driven through login → dashboard → projects → project tasks →
create task against the live API.

## Functional requirements

| # | Requirement | Implementation | Verified |
|---|---|---|---|
| 1 | User registration | `POST /api/auth/register`; web `RegisterPage`; mobile `RegisterScreen` | Test, E2E |
| 1 | User login | `POST /api/auth/login`; web `LoginPage`; mobile `LoginScreen` | Test, E2E, Mobile run |
| 1 | User logout | `POST /api/auth/logout` (token revoked); sidebar "Log out"; mobile Account tab | Test |
| 1 | Fields: full name, email, password | `users` table, `registerSchema` | Test |
| 1 | Unique email | DB unique index + 409 check (case-insensitive, stored lower-case) | Test |
| 1 | No plain-text passwords | bcrypt hash in `password_hash` | Test (checks `$2…` hash) |
| 1 | Stay logged in until logout/expiry | JWT with `exp`; web localStorage, mobile SecureStore; restore on start | E2E, Mobile run |
| 1 | One account on web and mobile | Same API + DB | Mobile run (seeded account), test "logout on one device" |
| 2 | Create / view / edit / delete project | `/api/projects` CRUD; web modal + details page | Test, E2E |
| 2 | View all own projects | `GET /api/projects` scoped by owner; Projects page / tab | Test |
| 2 | Name, description, status, start, end, created date | Schema + forms + details page | Test |
| 3 | Create / edit / delete tasks | `/api/tasks` CRUD; web TaskBoard + modal; mobile task form, long-press delete | Test, E2E, Mobile run |
| 3 | Mark tasks completed | `PUT {status:"COMPLETED"}`; checkbox on web and mobile | Test, E2E |
| 3 | View tasks under a project | `GET /api/tasks?projectId=`; project details (web), project screen (mobile) | Test, Mobile run |
| 3 | Name, description, priority, status, due date, created date | Schema + forms | Test |
| 4 | Dashboard: total projects, total tasks, completed, pending, projects in progress | `GET /api/dashboard`; web + mobile dashboards | Test (exact counts), E2E |
| 4 | Dashboard updates per user's data | Live queries scoped by user; cache invalidation after mutations | Test ("updates after changes") |
| 5 | Search projects by name | `?search=` (case-insensitive) | Test |
| 5 | Search tasks by name | `?search=` | Test |
| 5 | Filter projects by status | `?status=` | Test |
| 5 | Filter tasks by status / priority | `?status=` / `?priority=` | Test |

## Mobile app

| Requirement | Implementation | Verified |
|---|---|---|
| Same backend & DB, no mobile backend | `mobile/src/services/endpoints.ts` calls `/api/*` | Mobile run (task created on mobile visible via API/web) |
| Register / login / logout with same account | Login, Register screens; Account → Log out | Mobile run |
| View dashboard | Dashboard tab | Mobile run |
| View projects and their tasks | Projects tab → project screen | Mobile run |
| Create / edit / delete tasks | Task form (create/edit, delete button), long-press delete | Mobile run (create) |
| Mark completed, change status & priority | Checkbox; tap status pill / priority bars; segmented controls in form | Code review, typecheck |
| Search tasks, filter by status & priority | Search bar + chip rows (backend query params) | Mobile run (UI rendered) |
| Android required | Expo app with `android.package`, EAS `preview` profile builds an APK | Android JS bundle export succeeds (Hermes) |
| iOS optional | Same app: `ios.bundleIdentifier`, EAS `ios-simulator` / `preview` / `production` profiles, iOS action sheets, iOS date picker, sheet Cancel button, Keychain storage, ATS-compliant | iOS bundle export succeeds; `expo prebuild -p ios` generates a valid Xcode project/Info.plist. Not run on a device or Simulator in the build environment |
| Change on one platform appears on other after refresh | Pull-to-refresh on every list; web refetches on focus / F5 | Mobile run + API check |
| Token in secure storage | `expo-secure-store` (`secureSession.ts`) — Android Keystore | Code |
| Token expiry → login with clear message | 401 `TOKEN_EXPIRED` handler, expiry timer, foreground check → login notice | Code; API behaviour tested |
| No network → clear message, no crash/blank | `ApiError('network')` → `ErrorView` "No connection" + retry; `OfflineBanner` via NetInfo; login shows "Can't reach the server" | Mobile run (observed while API was unreachable) |

## Technical requirements

| Area | Requirement | Where |
|---|---|---|
| Web | React | Vite + React 19 |
| Web | Responsive | Tailwind breakpoints; sidebar → drawer; task table → stacked rows (screenshots at 390 px and 1366 px) |
| Web | Component structure | `components/ui` primitives, feature components, pages, layouts |
| Web | Form validation | React Hook Form + Zod; server field errors mapped onto inputs |
| Web | Loading / error handling / clean UX | Skeletons, spinners, ErrorState with retry, empty states, toasts, confirm dialogs, offline banner |
| Mobile | React Native (Expo) | Expo SDK 57 |
| Mobile | Navigation & screen structure | Expo Router: protected stack + tabs; screens in `src/screens` |
| Mobile | Form validation, loading, pull-to-refresh, error handling, secure storage | See above |
| Backend | Node.js + Express, one backend for both | `backend/` |
| Backend | REST architecture, route organisation, middleware | `routes/`, `controllers/`, `services/`, `middleware/` |
| Backend | Error handling | `middleware/errorHandler.ts` (central), `AppError` |
| Backend | Logging | pino + pino-http (request id, status, latency; secrets redacted) |
| Backend | CORS for web domain | `CORS_ORIGIN` allow-list (tested) |
| Database | PostgreSQL, relational design, FKs, normalised | `schema.prisma`, migration SQL, `docs/ER_DIAGRAM.md` |

## Security requirements

| Requirement | Where | Verified |
|---|---|---|
| bcrypt hashing | `auth.service.ts` | Test |
| Protected APIs require auth | `authenticate` middleware on all non-auth routes | Test (401s) |
| Users only see/modify/delete own data (web & mobile) | Owner-scoped queries in services | Test (IDOR suite) |
| Backend validation of all input | Zod: required, empty strings, email, dates, enums, ids, lengths | Test |
| JWT, auth middleware, protected routes | `utils/jwt.ts`, `middleware/authenticate.ts`, `routes/index.ts` | Test |
| No sensitive data in responses | Serializers whitelist fields; generic 500s | Test (no password in response) |
| SQL injection protection | Prisma parameterized queries only | Code |
| Rate limiting on auth | `middleware/rateLimiters.ts` | Test (429) |

## API expectations

All 15 required endpoints exist with the exact paths (`/api/auth/register|login|logout|me`,
`/api/projects[/{id}]` GET/POST/PUT/DELETE, `/api/tasks[/{id}]` GET/POST/PUT/DELETE,
`/api/dashboard`) and are used by both clients. Plus `/api/health`, `/api/docs`.

## Documentation & submission

| Item | Status |
|---|---|
| Setup instructions (backend, web, mobile) | README §9–12 |
| Environment variable docs | README §8, `.env.example` files |
| Database setup | README §7 |
| API documentation | `docs/API.md` + Swagger UI (`backend/openapi.yaml`) |
| Running mobile against deployed backend | README §16, `docs/DEPLOYMENT.md` §4 |
| ER diagram | `docs/ER_DIAGRAM.md`, `docs/er-diagram.svg/png` |
| Test data only | `prisma/seed.ts` uses fictional names and `example.com` emails |
| Public GitHub repo | **Manual** — push the repo (see final checklist) |
| Deployment URLs (web + backend) | **Manual** — needs your Neon/Render/Vercel accounts |
| Android APK / Expo link | **Manual** — needs your Expo account (`npm run build:apk`) |
| 5-minute recording | **Manual** — follow `docs/DEMO_SCRIPT.md` |

## Bonus features

| Bonus | Status |
|---|---|
| Docker support | ✅ `docker-compose.yml`, `backend/Dockerfile` |
| Unit / integration tests | ✅ 51 API integration tests (Vitest + Supertest + PostgreSQL) |
| Pagination | ✅ `page` / `limit` on lists, web pagination controls |
| Sorting | ✅ `sortBy` / `order`; web sort menu |
| CI/CD pipeline | ✅ GitHub Actions (tests, builds, typechecks) |
| Swagger / OpenAPI | ✅ `/api/docs` |
| Refresh tokens | ✗ (server-side revocation implemented instead) |
| Audit logs, RBAC, push notifications, offline task viewing | ✗ not implemented |
| Shared types between apps | Partial — types duplicated per app for simplicity |
