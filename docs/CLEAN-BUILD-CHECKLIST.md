# Clean-build checklist

Run on a normal computer with network access. Node 20.9 or newer.

1. `node -v` shows 20.9+ (22 is fine).
2. Fresh clone or unzip into an empty folder. Do not reuse `node_modules` or `.next`.
3. `npm ci` (uses `package-lock.json`). Expect no errors. Warnings about peer dependencies are fine.
4. `npm run typecheck` passes.
5. `npm test` passes (11 engine tests).
6. `npm run lint` passes, or list what it reports.
7. `npm run build` completes. Note any warning about fonts: `next/font/google` downloads fonts at build time and needs network.
8. `npm start`, open http://localhost:43123, and check:
   - Home loads and the header says "Demo data".
   - Opportunities -> Sales: all three section headings are readable.
   - Campaigns: start a campaign, step through all five steps, approve it.
   - Ask Calon opens and answers a suggested question.
   - Reload the page: drafts and approvals persist.
   - Profile: Plus/Pro switch works; connectors show as simulated.
9. Deep links: open `/opportunities/sales` and `/campaigns` directly. They should load, not 404.
10. Record the result (date, Node version, commit) at the top of `PRODUCTION-READINESS.md`.

Fix-forward notes
- If `npm ci` fails on a `cn` or `shadcn` package, check the registry version in `package.json` against `package-lock.json`.
- The `dev` and `start` scripts bind `0.0.0.0:43123`; change the port or host if that clashes.
