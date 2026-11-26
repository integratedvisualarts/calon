# Calon: Phase 3 architecture (backend, auth, data split)

Status: proposal. Nothing here is wired in. It extends `docs/proposed-schema.sql`.

## 1. Principles carried over from the product record
- Facts, estimates and simulations are labelled differently. `src/engine/provenance.ts` is the single place that says which figures are real.
- The engine does the arithmetic; any language model only words the result. Numbers never come from a model.
- Approval first: nothing publishes without an `approved` record owned by a named user.
- Calon must work with partial data (CSV only is a valid customer).

## 2. Recommended stack (smallest thing that is safe)
| Need | Choice | Why |
|---|---|---|
| Hosting | Vercel (existing Next.js app) | Zero config, already documented |
| Database + auth | Supabase Postgres, London region | Row-level security gives tenant isolation; UK data residency for UK GDPR |
| Login | Supabase Auth: email magic link + Google | No passwords to store |
| Jobs / sync | Vercel Cron or Inngest | Nightly POS and review pulls, retries |
| Payments | Stripe Billing (Plus £25, Pro £50) | Replaces the demo plan switch |
| First integration | Square Orders API (OAuth) | Matches the demo story; CSV is the fallback |
| Wording of recommendations | Anthropic API, server-side only | Receives engine numbers, returns text; key never in the browser |
| Secrets | Vercel env vars; integration tokens encrypted at rest | Never in local storage |

Alternative if you want fewer vendors: Neon + Auth.js. Costs more of your time, saves little money.

## 3. Tenancy and permissions
- Every table carries `restaurant_id`. Row-level security: a user reads/writes a row only through a `memberships` row.
- Roles: `owner` (billing, connections, approve), `manager` (approve campaigns), `staff` (read), `calon_team` (managed-services access, time-limited, audited).
- Managed services (I.V.A.) access must be an explicit, revocable grant, so the software product stays independent of the agency.
- `audit_log` records approvals, publishes, connection changes and exports.

## 4. The data-source seam (already half built)
Today the till is simulated in `src/engine/till.ts`, and `loadImportedOrders(workspaceId, orders)` swaps in real orders with no other code change (tested for parity in `tests/engine.test.ts`). Extend the same pattern per domain:

| Domain | Today | First real source | Origin flag |
|---|---|---|---|
| Sales, bookings | simulated; CSV import works in the engine | Square Orders API, CSV upload screen | `imported` |
| Reviews | simulated | Google Business Profile API (needs approval from Google) | switch to `imported` |
| Weather | simulated | Met Office DataHub | switch to `imported` |
| Calendar | curated by hand | Ticketmaster / council feeds, plus manual entries | `curated` |
| Visibility | simulated from checklist | Own crawler plus Search Console | switch to `imported` |

Rule: when a domain gets a real source, update `provenance()`. The header label and any "what is simulated" list follow automatically.

## 5. Storage model additions to the existing schema
- `connections(id, restaurant_id, provider, status, token_ciphertext, last_sync_at, last_error)`
- `sync_runs(id, connection_id, started_at, finished_at, rows_in, rows_rejected)`
- `orders` / `order_lines` as already proposed; add `source` (`square`, `csv`) and `import_batch_id` so a bad import can be rolled back.
- `campaigns.status` check: `draft -> awaiting_approval -> approved -> scheduled -> published`, with `approved_by`, `approved_at`.

## 6. Build order
1. Auth + restaurants + memberships + RLS, behind a feature flag; demo stays public at a separate route.
2. CSV upload screen writing `orders` with an import batch (reuse `parseTillCsv`; show its skipped-row report).
3. Engine reads orders from the database for the signed-in restaurant (the `loadImportedOrders` seam, per request).
4. Square OAuth + nightly sync.
5. Stripe billing.
6. Reviews, then Search Console, then publishing integrations.

## 7. Decisions needed from you
1. UK data residency required for pilots? (assumed yes)
2. First POS: Square (assumed) or the pilot restaurant's actual system?
3. Who may see a customer's data on the I.V.A. side?
