/**
 * Engine tests. Run with `npm test` (compiles with TypeScript, runs with Node's built-in runner).
 * They pin the behaviour the demo relies on: deterministic replay, numbers that add up,
 * opportunities in every category, fixes that move the score, and CSV import parity.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSnapshot } from "../src/engine/snapshot";
import { chaiSocial } from "../src/engine/workspaces/chai-social";
import { ordersForDay, tillHistory, loadImportedOrders } from "../src/engine/till";
import { parseTillCsv, templateHeader } from "../src/engine/csv";
import { hhmm, minuteOfDay } from "../src/engine/dates";
import type { Workspace } from "../src/engine/types";

const AT = new Date(2026, 10, 18, 21, 30); // Wed 18 Nov 2026, 21:30

test("a day replays identically", () => {
  const day = new Date(2026, 10, 13);
  const a = ordersForDay(chaiSocial, day, AT).map((o) => `${o.id}:${o.total}`);
  const b = ordersForDay({ ...chaiSocial }, day, AT).map((o) => `${o.id}:${o.total}`);
  assert.deepEqual(a, b);
  assert.ok(a.length > 20);
});

test("order totals equal their lines", () => {
  for (const o of tillHistory(chaiSocial, AT, 14)) {
    const sum = Math.round(o.lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100;
    assert.equal(o.total, sum);
  }
});

test("nothing after now is visible", () => {
  const s = computeSnapshot(chaiSocial, new Date(2026, 10, 18, 13, 0));
  for (const o of tillHistory(chaiSocial, new Date(2026, 10, 18, 13, 0), 0)) assert.ok(o.at <= new Date(2026, 10, 18, 13, 0).getTime());
  assert.ok(s.today.summary.takings < s.today.expected.fullDay);
});

test("closed days have no trade", () => {
  const s = computeSnapshot(chaiSocial, new Date(2026, 11, 25, 13, 0));
  assert.equal(s.today.closed, true);
  assert.equal(s.today.summary.takings, 0);
  assert.equal(s.phase, "closed");
});

test("every opportunity type is generated and ranked", () => {
  const s = computeSnapshot(chaiSocial, AT);
  for (const type of ["Festival", "Event", "Food", "Service", "Weather"]) {
    assert.ok(s.opportunities.some((o) => o.type === type), `missing ${type}`);
  }
  for (let i = 1; i < s.opportunities.length; i++) assert.ok(s.opportunities[i - 1].priority >= s.opportunities[i].priority);
  assert.ok(s.salesOpps.length >= 4);
  assert.ok(s.fixes.length > 0);
});

test("opportunities follow the restaurant's tags", () => {
  const pub: Workspace = { ...chaiSocial, id: "test-pub", tags: ["pub", "whisky", "scottish", "local", "groups"] };
  const indian = computeSnapshot(chaiSocial, new Date(2027, 0, 10, 12, 0)).opportunities.map((o) => o.id);
  const pubIds = computeSnapshot(pub, new Date(2027, 0, 10, 12, 0)).opportunities.map((o) => o.id);
  assert.ok(!indian.includes("festival-burns-2027"));
  assert.ok(pubIds.includes("festival-burns-2027"));
});

test("approving a fix raises the visibility score", () => {
  const before = computeSnapshot(chaiSocial, AT);
  const fix = before.fixes[0];
  const after = computeSnapshot(chaiSocial, AT, [{ check: fix.check, at: AT.getTime() }]);
  assert.ok(after.audit.total > before.audit.total);
  assert.ok(!after.fixes.some((f) => f.check === fix.check));
});

test("scores stay inside their ranges", () => {
  const s = computeSnapshot(chaiSocial, AT);
  assert.ok(s.audit.aeo >= 0 && s.audit.aeo <= 50);
  assert.ok(s.audit.seo >= 0 && s.audit.seo <= 50);
  assert.ok(s.reviews.rating >= 1 && s.reviews.rating <= 5);
});

test("imported CSV gives the same answers as the till it came from", () => {
  const ws: Workspace = { ...chaiSocial, id: "csv-parity" };
  const end = new Date(2026, 10, 18, 23, 59);
  const sim = computeSnapshot(chaiSocial, AT);
  const name = (id: string) => chaiSocial.menu.find((m) => m.id === id)!.name;
  const rows = [templateHeader];
  for (const o of tillHistory(chaiSocial, end, 90)) {
    for (const l of o.lines) {
      rows.push([o.id, o.day, hhmm(minuteOfDay(new Date(o.at))), o.channel, o.covers, o.booked ? "yes" : "no", hhmm(minuteOfDay(new Date(o.seatedAt))), `"${name(l.item)}"`, l.qty, l.price].join(","));
    }
  }
  const parsed = parseTillCsv(rows.join("\n"), ws);
  assert.equal(parsed.skipped.length, 0);
  assert.deepEqual(parsed.unknownItems, []);
  loadImportedOrders(ws.id, parsed.orders);
  const real = computeSnapshot(ws, AT);
  assert.equal(Math.round(real.today.summary.takings), Math.round(sim.today.summary.takings));
  assert.equal(real.today.summary.covers, sim.today.summary.covers);
  assert.deepEqual(real.salesOpps.map((o) => o.title), sim.salesOpps.map((o) => o.title));
});

test("CSV import reports bad rows instead of guessing", () => {
  const bad = parseTillCsv(`${templateHeader}\n1,2026-13-40,12:00,dine-in,2,no,,Vegetarian thali,1,13.95\n2,2026-11-18,12:00,carrier pigeon,0,no,,Thali,1,13.95`, chaiSocial);
  assert.equal(bad.orders.length, 0);
  assert.equal(bad.skipped.length, 2);
  const missing = parseTillCsv("date,item\n2026-11-18,Thali", chaiSocial);
  assert.match(missing.skipped[0].reason, /Missing columns/);
});

test("provenance says demo until real sales are loaded, and never claims live early", async () => {
  const { dataMode, dataLabel, provenance, simulatedDomains } = await import("../src/engine/provenance");
  const demo: Workspace = { ...chaiSocial, id: "prov-demo" };
  assert.equal(dataMode(demo), "demo");
  assert.equal(dataLabel(demo), "Demo data");
  assert.equal(provenance(demo).sales, "simulated");

  const real: Workspace = { ...chaiSocial, id: "prov-real" };
  const csv = `${templateHeader}\n1,2026-11-17,13:10,dine-in,2,no,12:15,Vegetarian thali,2,13.95`;
  loadImportedOrders(real.id, parseTillCsv(csv, real).orders);
  assert.equal(provenance(real).sales, "imported");
  assert.equal(dataMode(real), "partial");
  assert.match(dataLabel(real), /rest is demo data/);
  assert.ok(simulatedDomains(real).includes("reviews"));
  assert.ok(!simulatedDomains(real).includes("sales"));
});
