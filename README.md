# Calon: Restaurant Growth & Intelligence

Calon is a mobile-first web app for independent restaurants. It reads the till, reviews, weather, the local calendar and web presence, finds opportunities in seven categories (Visibility, Sales, Festivals, Events, Food, Service, Weather), turns each one into a campaign, and keeps the owner in control with an approval step before anything goes out.

This repository is the demo workspace for **Chai Social, Cardiff**, used to onboard pilot restaurants. Every figure on screen is computed by the engine in `src/engine` from a simulated till built on Chai Social’s real menu, prices and hours, and it refreshes every 15 seconds. See [ENGINE.md](ENGINE.md) for how the logic works and [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md) for what is finished and what is not.

---

## 1. Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5 (App Router, Turbopack) |
| UI | React 19.1, Tailwind CSS 4, shadcn/ui (Base UI primitives), lucide-react icons |
| Language | TypeScript 5 (strict) |
| Fonts | Inter and Cormorant Garamond via `next/font/google` (downloaded at build time) |
| Logic | `src/engine`: pure TypeScript, no network, runs in the browser |
| Storage | Browser `localStorage` (campaigns, plan, profile edits) and `sessionStorage` (splash, carousel position) |
| Backend, database, auth | **None** (see PRODUCTION-READINESS.md) |
| Tests | Node’s built-in test runner, compiled with TypeScript (no extra dependencies) |

## 2. Requirements

- Node.js **20.9 or later** (22 LTS recommended)
- npm 10 or later
- Internet access during `npm install` and `npm run build` (packages and Google Fonts)

## 3. Install

```bash
npm ci          # exact versions from package-lock.json
# or: npm install
```

No environment variables are needed. `.env.example` lists placeholders for future integrations only.

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:43123. The dev server listens on all interfaces (`-H 0.0.0.0`), so a phone on the same Wi-Fi can open `http://<your-computer-ip>:43123`.

Pitch rehearsal (optional, invisible unless used):

- `?at=2026-11-20T19:30` starts the clock at a chosen moment
- `?speed=60` runs the day at 60× speed
- `?clock=real` returns to real time

## 5. Test, lint and type-check

```bash
npm test            # 10 engine tests: replay, totals, closed days, ranking, tag fit, fixes, CSV parity
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck   # tsc --noEmit over the whole project
```

## 6. Build and run in production mode

```bash
npm run build
npm start           # serves on port 43123
```

To use another port: `npx next start -p 3000`.

## 7. Deploy to Vercel (recommended)

The stack is standard Next.js, so Vercel needs no special configuration.

1. Push this folder to a new GitHub, GitLab or Bitbucket repository (the `.gitignore` already excludes `node_modules`, `.next`, `.env*` and build output).
2. In Vercel: **Add New → Project → Import** the repository.
3. Framework preset: **Next.js** (auto-detected). Build command `npm run build`, output default, install command default. Leave environment variables empty.
4. Deploy. Vercel gives you a `*.vercel.app` URL.
5. Your domain: **Project → Settings → Domains → Add**, enter `yourdomain.com`, and add the DNS records Vercel shows (an `A` record for the apex, a `CNAME` for `www`) at your registrar. HTTPS is issued automatically.

Other hosts: any Node 20+ host that runs `npm run build && npm start` works (Netlify with its Next.js runtime, Render, Railway, Fly.io, a VPS behind nginx). A plain static host does **not** work as-is, because the layout is rendered per request (`dynamic = "force-dynamic"`) and the catch-all route serves every path.

## 8. Project structure

```
├── public/
│   ├── brand/                 Calon logos (SVG + PNG)
│   ├── food/                  Illustration
│   ├── templates/             calon-till-template.csv (standard till import)
│   └── sw.js                  Service-worker kill switch (unregisters old workers)
├── src/
│   ├── app/                   Next.js App Router: layout, global CSS, catch-all page, icon
│   ├── components/            Screens (home, opportunities, insights, sales, visibility,
│   │   │                      reviews, campaigns, profile, ask panel, shell, splash)
│   │   └── ui/                shadcn/ui primitives
│   ├── data/                  Fixed facts + live slots the screens read; live.ts bridges the engine
│   ├── engine/                Simulated till, metrics, reviews, signals, visibility audit,
│   │   │                      opportunity ranking, CSV import, demo clock
│   │   └── workspaces/        One file per restaurant (chai-social.ts)
│   └── lib/                   Store (state, persistence, routing), campaign builder helpers
├── tests/                     Engine tests
├── docs/proposed-schema.sql   Database proposal (not wired in)
├── ENGINE.md                  How the logic works
├── PRODUCTION-READINESS.md    Status, gaps, risks
└── .env.example
```

## 9. Common changes

- **Add a pilot restaurant:** copy `src/engine/workspaces/chai-social.ts`, change the menu, hours, rota, tags, calendar and presence levels, and point `src/data/live.ts` (`workspace`) and `src/data/restaurant.ts` at it. Update the fixed facts in `src/data/demo-data.ts` (name, address, phone, voice).
- **Use real sales:** export the till to `public/templates/calon-till-template.csv` format, parse it with `parseTillCsv()` and pass the orders to `loadImportedOrders()` (`src/engine/till.ts`). Every screen then runs on real orders.
- **Remove the demo label:** delete ` · Demo data` in `src/components/shell.tsx` once the workspace shows real data.

## 10. Ownership

All source code in this repository is plain TypeScript/React with open-source npm dependencies (MIT, ISC and Apache 2.0 licences). There are no calls to Anthropic, Claude or any other hosted service in the code. The Calon brand files in `public/brand` are part of the project. Check the licences of any fonts or images you add later.
