/**
 * Standard till template. One row per item on a bill; rows that share an order_id are one bill.
 * A pilot restaurant exports this from its POS (or we map their POS export to it), and the engine
 * runs on their real orders instead of the simulation. Columns, in any order:
 *
 *   order_id, date (YYYY-MM-DD), time (HH:MM, when the bill closed), channel
 *   (dine-in | deliveroo | uber | justeat), covers, booked (yes/no), seated (HH:MM, optional),
 *   item, qty, unit_price
 *
 * Delivery rows carry covers 0. Lunch or dinner is read from the seated time against the
 * workspace's opening hours.
 */

import { atMinute, dateKey, parseKey } from "./dates";
import type { Channel, Order, Workspace } from "./types";

export const templateHeader = "order_id,date,time,channel,covers,booked,seated,item,qty,unit_price";

function splitRow(line: string): string[] {
  const out: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cell.trim());
      cell = "";
    } else cell += ch;
  }
  out.push(cell.trim());
  return out;
}

const channelAliases: Record<string, Channel> = {
  "dine-in": "dine-in",
  dinein: "dine-in",
  "dine in": "dine-in",
  restaurant: "dine-in",
  "eat in": "dine-in",
  takeaway: "dine-in",
  deliveroo: "deliveroo",
  uber: "uber",
  "uber eats": "uber",
  ubereats: "uber",
  justeat: "justeat",
  "just eat": "justeat",
};

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export type ImportResult = { orders: Order[]; rows: number; skipped: { line: number; reason: string }[]; unknownItems: string[] };

export function parseTillCsv(text: string, ws: Workspace): ImportResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const skipped: ImportResult["skipped"] = [];
  if (lines.length < 2) return { orders: [], rows: 0, skipped: [{ line: 1, reason: "No rows" }], unknownItems: [] };
  const header = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const required = ["order_id", "date", "time", "channel", "item", "qty", "unit_price"];
  const missing = required.filter((name) => col(name) < 0);
  if (missing.length) return { orders: [], rows: 0, skipped: [{ line: 1, reason: `Missing columns: ${missing.join(", ")}` }], unknownItems: [] };
  const byId = new Map<string, Order>();
  const unknown = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    const get = (name: string) => (col(name) >= 0 ? cells[col(name)] ?? "" : "");
    const date = get("date");
    const asDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseKey(date) : null;
    if (!asDate || Number.isNaN(asDate.getTime()) || dateKey(asDate) !== date) {
      skipped.push({ line: i + 1, reason: `Bad date “${date}”` });
      continue;
    }
    const channel = channelAliases[get("channel").toLowerCase()];
    if (!channel) {
      skipped.push({ line: i + 1, reason: `Unknown channel “${get("channel")}”` });
      continue;
    }
    const qty = Number(get("qty"));
    const price = Number(get("unit_price").replace(/[£,]/g, ""));
    if (!Number.isFinite(qty) || !Number.isFinite(price)) {
      skipped.push({ line: i + 1, reason: "Quantity or price is not a number" });
      continue;
    }
    const name = get("item");
    const item = ws.menu.find((m) => m.name.toLowerCase() === name.toLowerCase() || m.id === name.toLowerCase());
    if (!item) unknown.add(name);
    const id = get("order_id");
    let order = byId.get(id);
    if (!order) {
      const day = parseKey(date);
      const closed = minutes(get("time"));
      const seated = get("seated") ? minutes(get("seated")) : channel === "dine-in" ? closed - 60 : closed;
      order = {
        id,
        day: date,
        at: atMinute(day, closed).getTime(),
        seatedAt: atMinute(day, seated).getTime(),
        service: seated < ws.hours.dinner.open - 60 ? "lunch" : "dinner",
        channel,
        covers: channel === "dine-in" ? Math.max(1, Number(get("covers")) || 1) : 0,
        booked: /^(y|yes|true|1)$/i.test(get("booked")),
        lines: [],
        total: 0,
      };
      byId.set(id, order);
    }
    order.lines.push({ item: item?.id ?? name.toLowerCase(), qty, price });
    order.total = Math.round((order.total + qty * price) * 100) / 100;
  }
  return { orders: [...byId.values()], rows: lines.length - 1, skipped, unknownItems: [...unknown] };
}
