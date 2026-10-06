# API documentation

One REST API serves both the web app and the Android app.

- **Base URL (local):** `http://localhost:4000/api`
- **Base URL (deployed):** `https://<your-backend>.onrender.com/api`
- **Interactive docs (Swagger UI):** `GET /api/docs` — OpenAPI 3 spec at `GET /api/openapi.json`
  (source: [`backend/openapi.yaml`](../backend/openapi.yaml))

## Conventions

**Authentication.** Protected endpoints need `Authorization: Bearer <token>`. Get a token from
`POST /auth/register` or `POST /auth/login`. Tokens are JWTs (HS256) that expire after
`JWT_EXPIRES_IN` (default 7 days); logout revokes the token server-side.

**Response envelope.**

```json
{ "success": true, "message": "Task created", "data": { ... }, "pagination": { ... } }
```

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}
```

`message` and `pagination` appear only when relevant; `errors` only on validation failures.

**Dates.** `startDate`, `endDate`, `dueDate` are calendar dates in strict `YYYY-MM-DD` form
(e.g. `2026-10-20`); impossible dates such as `2026-02-30` are rejected. Timestamps
(`createdAt`, `updatedAt`, `completedAt`, `expiresAt`) are ISO-8601 UTC.

**IDs** are UUIDs. A malformed id returns `400`.

**Partial updates.** `PUT` accepts any subset of fields (at least one). Send
`{"status":"COMPLETED"}` to mark a task done.

**Authorization.** Every query is scoped to the authenticated user. A project/task that belongs
to another user returns **404**, exactly like one that does not exist, so ids cannot be probed
(IDOR protection). Fields such as `ownerId` in a request body are ignored.

### Status codes

| Code | When | `code` field |
|---|---|---|
| 200 | Success | — |
| 201 | Created (register, project, task) | — |
| 400 | Malformed JSON, malformed id, invalid query parameter | `BAD_REQUEST` |
| 401 | No token / invalid / revoked token; wrong login | `AUTH_REQUIRED`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS` |
| 403 | Reserved for permission errors (not used by current routes — other users' data returns 404) | `FORBIDDEN` |
| 404 | Not found **or not yours**; unknown route | `NOT_FOUND` |
| 409 | Email already registered | `CONFLICT` |
| 413 | Body larger than 100 KB | `PAYLOAD_TOO_LARGE` |
| 422 | Body failed validation (`errors` lists each field) | `VALIDATION_ERROR` |
| 429 | Rate limit hit | `RATE_LIMITED` |
| 500 | Unexpected server error (details are logged, never returned) | `INTERNAL_ERROR` |

### Rate limits

| Scope | Limit |
|---|---|
| `POST /auth/login` | `AUTH_RATE_LIMIT_MAX` (default 10) **failed** attempts per IP per 15 min |
| `POST /auth/register` | `AUTH_RATE_LIMIT_MAX` attempts per IP per 15 min |
| All `/api` routes | 1000 requests per IP per 15 min |

Responses include `RateLimit` / `RateLimit-Policy` headers (IETF draft 7).

---

## Auth

### `POST /auth/register` — create an account
Public. Rate-limited.

| Field | Type | Rules |
|---|---|---|
| `fullName` | string | required, 2–100 chars, trimmed |
| `email` | string | required, valid email, ≤254 chars, unique (case-insensitive) |
| `password` | string | required, 8–72 chars, at least one letter and one number |

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Tester","email":"jane@example.com","password":"Secret123"}'
```

`201 Created`
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-10-13T15:00:00.000Z",
    "user": { "id": "0b6f…", "fullName": "Jane Tester", "email": "jane@example.com", "createdAt": "2026-10-06T15:00:00.000Z" }
  }
}
```
Errors: `409` email exists · `422` validation · `400` malformed JSON · `429` too many attempts.

### `POST /auth/login` — log in
Public. Only failed attempts count toward the rate limit.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo@12345"}'
```
`200 OK` — same `data` shape as register.
Errors: `401` `Invalid email or password` (same message whether the email or the password is wrong) · `422` · `429`.

### `POST /auth/logout` — log out
Protected. Revokes the current token (its id is added to a denylist until it expires). Other
sessions of the same user (e.g. the phone) stay signed in.

```bash
curl -X POST http://localhost:4000/api/auth/logout -H "Authorization: Bearer $TOKEN"
```
`200 OK` `{ "success": true, "message": "Logged out successfully", "data": null }` · Errors: `401`.

### `GET /auth/me` — current user
Protected.

`200 OK` `{ "success": true, "data": { "user": { "id", "fullName", "email", "createdAt" } } }`
Errors: `401` with `code` `TOKEN_EXPIRED` (clients show "Your session has expired") or `TOKEN_INVALID`.

---

## Projects (all protected)

Project object:

```json
{
  "id": "6a1d…",
  "name": "Website Redesign",
  "description": "Refresh the marketing site",
  "status": "IN_PROGRESS",
  "startDate": "2026-09-16",
  "endDate": "2026-10-31",
  "createdAt": "2026-10-06T15:05:06.000Z",
  "updatedAt": "2026-10-06T15:05:06.000Z",
  "taskCount": 6,
  "completedTaskCount": 2,
  "progress": 33
}
```

### `GET /projects` — list your projects

| Query | Values | Default |
|---|---|---|
| `search` | case-insensitive substring of the name (≤100 chars) | — |
| `status` | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` | — |
| `sortBy` | `createdAt` \| `updatedAt` \| `name` \| `startDate` \| `endDate` \| `status` | `createdAt` |
| `order` | `asc` \| `desc` | `desc` |
| `page` | ≥1 | 1 |
| `limit` | 1–100 | 20 |

```bash
curl "http://localhost:4000/api/projects?search=website&status=IN_PROGRESS" -H "Authorization: Bearer $TOKEN"
```
`200 OK` `{ "success": true, "data": [Project…], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }`
Errors: `400` invalid query value · `401`.

### `GET /projects/:id`
`200 OK` `{ "data": Project }` · Errors: `400` bad id · `401` · `404` not found / not yours.

### `POST /projects`

| Field | Rules |
|---|---|
| `name` | required, non-blank, ≤120 |
| `description` | optional, ≤2000; `""` or `null` → null |
| `status` | optional enum, default `NOT_STARTED` |
| `startDate` | required `YYYY-MM-DD` |
| `endDate` | optional `YYYY-MM-DD` or null; must not be before `startDate` |

```bash
curl -X POST http://localhost:4000/api/projects -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Website Redesign","status":"IN_PROGRESS","startDate":"2026-10-01","endDate":"2026-12-15"}'
```
`201 Created` `{ "message": "Project created", "data": Project }` · Errors: `401` · `422`.

### `PUT /projects/:id`
Any subset of the fields above (at least one). The end-date rule is checked against the
merged result (e.g. sending only an `endDate` earlier than the stored `startDate` → `422`).

```bash
curl -X PUT http://localhost:4000/api/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"COMPLETED"}'
```
`200 OK` `{ "message": "Project updated", "data": Project }` · Errors: `400` · `401` · `404` · `422`.

### `DELETE /projects/:id`
Deletes the project **and all its tasks** (FK `ON DELETE CASCADE`).
`200 OK` `{ "message": "Project deleted", "data": null }` · Errors: `400` · `401` · `404`.

---

## Tasks (all protected)

Task object:

```json
{
  "id": "c41e…",
  "name": "Implement login page",
  "description": "Email + password form",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-10-12",
  "completedAt": null,
  "projectId": "6a1d…",
  "project": { "id": "6a1d…", "name": "Website Redesign" },
  "createdAt": "2026-10-06T15:05:06.000Z",
  "updatedAt": "2026-10-06T15:05:06.000Z"
}
```

### `GET /tasks` — list your tasks (across all your projects)

| Query | Values | Default |
|---|---|---|
| `projectId` | UUID — only tasks of this project (must be yours, else empty list) | — |
| `search` | case-insensitive substring of the name | — |
| `status` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` | — |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | — |
| `sortBy` | `createdAt` \| `updatedAt` \| `name` \| `dueDate` \| `priority` \| `status` | `createdAt` |
| `order` | `asc` \| `desc` | `desc` |
| `page`, `limit` | as for projects | 1, 20 |

Sorting by `dueDate` puts tasks without a due date last. Sorting by `priority` follows
LOW < MEDIUM < HIGH.

```bash
curl "http://localhost:4000/api/tasks?search=login&status=PENDING&priority=HIGH" -H "Authorization: Bearer $TOKEN"
```
`200 OK` `{ "data": [Task…], "pagination": {…} }` · Errors: `400` · `401`.

### `GET /tasks/:id`
`200 OK` `{ "data": Task }` · Errors: `400` · `401` · `404`.

### `POST /tasks`

| Field | Rules |
|---|---|
| `name` | required, non-blank, ≤160 |
| `projectId` | required UUID of a project **you own** |
| `description` | optional, ≤2000 |
| `priority` | optional enum, default `MEDIUM` |
| `status` | optional enum, default `PENDING` |
| `dueDate` | optional `YYYY-MM-DD` or null |

```bash
curl -X POST http://localhost:4000/api/tasks -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Implement login page","priority":"HIGH","dueDate":"2026-10-20","projectId":"'$PROJECT_ID'"}'
```
`201 Created` `{ "message": "Task created", "data": Task }`
Errors: `401` · `404` `Project not found` (missing or another user's project) · `422`.

### `PUT /tasks/:id`
Any subset of the fields above. `completedAt` is set when status becomes `COMPLETED` and
cleared when it changes back. Changing `projectId` moves the task, only into a project you own.

```bash
# Mark completed
curl -X PUT http://localhost:4000/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"COMPLETED"}'
# Change priority
curl -X PUT http://localhost:4000/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"priority":"LOW"}'
```
`200 OK` `{ "message": "Task updated", "data": Task }` · Errors: `400` · `401` · `404` · `422`.

### `DELETE /tasks/:id`
`200 OK` `{ "message": "Task deleted", "data": null }` · Errors: `400` · `401` · `404`.

---

## Dashboard

### `GET /dashboard` — statistics for the authenticated user (protected)
Computed live from the database on every request, so it reflects changes from any device.

```json
{
  "success": true,
  "data": {
    "totalProjects": 4,
    "totalTasks": 15,
    "completedTasks": 6,
    "pendingTasks": 7,
    "inProgressTasks": 2,
    "projectsInProgress": 2,
    "projectsNotStarted": 1,
    "projectsCompleted": 1,
    "overdueTasks": 1,
    "completionRate": 40,
    "openTasksByPriority": { "HIGH": 4, "MEDIUM": 3, "LOW": 2 },
    "upcomingTasks": [Task…],
    "recentProjects": [Project…]
  }
}
```

Definitions: **pendingTasks** = status `PENDING`; **inProgressTasks** = status `IN_PROGRESS`;
**totalTasks** = pending + in progress + completed; **overdueTasks** = not completed and due
before today (UTC); **upcomingTasks** = up to 6 open tasks with a due date, soonest first;
**recentProjects** = 5 most recently updated projects with progress.

Errors: `401`.

---

## System

### `GET /health` (public)
Checks the database connection. `200 OK` `{ "success": true, "data": { "status": "ok", "time": "…" } }`.
