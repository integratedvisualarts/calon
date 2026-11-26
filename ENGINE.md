# How Calon thinks

The interface is unchanged from build `65980aa`. Underneath, nothing on screen is typed in any more: every figure, opportunity, draft and result is computed by the engine in `src/engine`, recalculated every 15 seconds against the clock.

## The flow

```
Till orders ─┐
Reviews ─────┤                 ┌─ Today: takings, covers, spend, bookings, pace vs a normal day
Weather ─────┼─► Metrics ──────┼─ Sales: weekday profile, peaks, dish mix, staffing load, week ahead
Calendar ────┤                 ├─ Reviews: rating, themes, trends, reply drafts
Web presence ┘                 ├─ Visibility: AEO/GEO and SEO audit, engine checks, fixes
                               └─► Opportunities (7 categories) ─► ranked ─► campaigns ─► approve ─► measured in the till
```

| Category | What the engine does |
|---|---|
| Visibility | Weighted audit (AEO 50 + SEO 50). Review checks are computed from the review feed. Approving a fix marks it done and the score moves at once. |
| Sales | Compares today against what a normal same weekday had taken *by this time*; finds the quietest sitting, channel mix, strongest day and open tables. |
| Festivals | Reads the calendar, keeps only those that fit the restaurant’s tags, sizes the lift from a past occurrence in the till where there is one. |
| Events | Local events within 35 days, paydays (last Friday, skipped when closed), campus breaks as a negative event. |
| Food | Best seller by revenue share, slowest item in its course, risers and fallers (last 7 days against the 4 weeks before). |
| Service | Review themes read from the text, trend against the previous 8 weeks, the busiest day behind a complaint tied to floor staffing; the latest low-star review with a reply draft. |
| Weather | Forecast set against the restaurant’s own measured wet-day effect on delivery and covers. |

**Ranking:** priority = 40% impact (£ against an average day) + 25% urgency + 20% fit + 15% confidence. Confidence comes from sample size.

## Files

- `src/engine/workspaces/chai-social.ts`: the restaurant: menu, hours, rota, tables, calendar, web-presence levels. **A pilot restaurant is a new file like this.**
- `src/engine/till.ts`: the simulated Square feed for the demo, and `loadImportedOrders()` for real sales.
- `src/engine/csv.ts` + `public/templates/calon-till-template.csv`: the standard till template.
- `src/engine/metrics.ts`, `reviews.ts`, `signals.ts`, `visibility.ts`: the analysis.
- `src/engine/snapshot.ts`: opportunities, sales moves, fixes, ranking, past campaign results.
- `src/data/live.ts`: writes each snapshot into the data objects the screens read.

## Facts versus modelled

Public facts for Chai Social (address, phone, hours, the 21:45 order-page cut-off, verified menu prices, the Diwali Ball and campus dates) are marked in the workspace file. Demand levels, rota, unverified prices, reviews and presence levels are modelled. Feeding the same orders through the CSV template gives identical results to the simulation, so a pilot’s real export replaces the model with no other change.

## Pitch controls (invisible unless used)

- `?at=2026-11-20T19:30`: start the clock at a chosen moment (Friday dinner, say).
- `?speed=60`: run the day at 60× (one minute per second); the feed then refreshes every 2 seconds.
- `?clock=real`: back to real time.
