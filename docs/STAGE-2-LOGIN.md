# Stage 2, Step A: sign-in and two demo restaurants

- `/login` is the only open page. Everything else redirects there without a valid signed session (`src/middleware.ts`).
- Accounts are listed in `src/lib/accounts.ts`. Passwords come from Vercel env vars:
  `DEMO_CHAI_PASSWORD`, `DEMO_BROTHERS_PASSWORD`. `SESSION_SECRET` signs the cookie.
- Each account opens one restaurant. The workspace id sits in a readable cookie (`calon_ws`) so the app can start on the right restaurant; the signed cookie is what protects the pages.
- Restaurant wording: `src/engine/workspaces/*.ts` (engine, includes `voice`) and `src/data/brands.ts` (screens).
- Known limit: both demo restaurants' sample data ships in the JavaScript bundle. Real pilot data must only ever come from that business's own database after sign-in (Step B).
- Add a pilot (until Step B): new workspace file, one entry in `current.ts`, one in `brands.ts`, one in `accounts.ts`, one password env var.
