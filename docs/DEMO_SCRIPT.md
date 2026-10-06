# 5-minute demo script

**Before recording:** wake the Render backend (open `/api/health`), have the web app open in a
browser and the APK installed on a phone (or Expo Go running). Use a fresh account so the
recording shows registration. Screen-record both (e.g. OBS for the desktop + Android's built-in
screen recorder, or `scrcpy` to mirror the phone onto the desktop and record one screen).

| Time | Do | Say |
|---|---|---|
| 0:00 | Show the repo README briefly | "One Express + PostgreSQL backend, a React web app and an Expo Android app — both apps call the same REST API." |
| 0:20 | **Web** → Create account (`Demo Reviewer`, `reviewer.demo@example.com`, `Demo@12345`) | "Passwords are validated on both sides and stored as bcrypt hashes." |
| 0:45 | Dashboard (empty state) → **New project** "Mobile Launch", status In progress, dates | "Every statistic is computed for the logged-in user only." |
| 1:15 | Open the project → **Add task** "Prepare store listing", High, due in 3 days | — |
| 1:40 | Change its status to *In progress* inline; change priority to *Medium* | "Inline edits call `PUT /api/tasks/:id`; the dashboard and progress bars refresh." |
| 2:00 | Back to Dashboard — counts and the progress bar updated; show search + status filter on Projects | "Search and filters are backend query parameters." |
| 2:20 | **Phone** → open Tasklane → log in with the **same** account | "The token is stored in Android Keystore via Expo SecureStore." |
| 2:45 | Dashboard → pull to refresh → Projects → open "Mobile Launch" → the task is there | "Same backend, same database." |
| 3:10 | Tap **Add task** → "Record demo video", High, due date → Create. Tick another task as completed. | — |
| 3:40 | Show task search + status/priority filter chips on the phone | — |
| 4:00 | **Web** → switch back to the tab (it refetches on focus) or press F5 | "The task created on the phone is here, and the completed one is ticked." |
| 4:20 | (Optional) Turn on airplane mode on the phone → pull to refresh | "No crash, no blank screen — a clear offline message." |
| 4:40 | Log out on the phone | "Logout revokes the token on the server." |
| 5:00 | End | — |

**Test accounts from the seed script** (if you'd rather show existing data):
`demo@example.com` / `Demo@12345` and `reviewer@example.com` / `Demo@12345`
(the second account's project is never visible to the first — a quick way to show data isolation).
