"use client";

import { Card } from "@/components/bits";
import { refreshLive, workspace } from "@/data/live";
import { parseTillCsv, type ImportResult } from "@/engine/csv";
import { loadImportedOrders, isImported } from "@/engine/till";
import { useStore } from "@/lib/store";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

type Checked = { fileName: string; result: ImportResult; first: string; last: string; days: number; stale: boolean };

function summarise(fileName: string, result: ImportResult): Checked {
  const days = [...new Set(result.orders.map((o) => o.day))].sort();
  const first = days[0] ?? "";
  const last = days[days.length - 1] ?? "";
  const ageMs = last ? Date.now() - new Date(`${last}T12:00:00`).getTime() : 0;
  return { fileName, result, first, last, days: days.length, stale: ageMs > 7 * 24 * 3600 * 1000 };
}

/** Pilot data comes in as a CSV in the standard till template. Checked here, then loaded into the engine. */
export function TillUpload() {
  const store = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState<Checked | null>(null);
  const [problem, setProblem] = useState("");
  const [loaded, setLoaded] = useState(isImported(workspace.id));

  async function onFile(file: File | undefined) {
    setProblem("");
    setChecked(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setProblem("That isn’t a .csv file. Export your sales as CSV and try again.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setProblem("That file is over 5 MB. Split it into months and upload the most recent 8 weeks first.");
      return;
    }
    const text = await file.text();
    const result = parseTillCsv(text, workspace);
    if (!result.orders.length) {
      const why = result.skipped[0]?.reason ?? "No rows found";
      setProblem(`Nothing could be read. ${why}. Use the template below and keep its column names.`);
      return;
    }
    setChecked(summarise(file.name, result));
  }

  function load() {
    if (!checked) return;
    loadImportedOrders(workspace.id, checked.result.orders);
    refreshLive();
    setLoaded(true);
    store.notify(`${checked.result.orders.length} orders loaded from ${checked.fileName}.`);
    setChecked(null);
    if (input.current) input.current.value = "";
  }

  return (
    <section className="grid gap-2" id="till-upload">
      <h2 className="font-serif text-3xl text-[#F4EEE1]">Till data</h2>
      <Card className="grid gap-3 p-4">
        <p className="text-[#2B2B2B]">
          Upload your till export as a CSV. Calon reads your sales, covers and bookings from it.{" "}
          {loaded ? "Your uploaded data is in use." : "Until you upload, Calon shows demo data."}
        </p>
        <p className="text-[0.85rem] text-[#5C564C]">
          Include the last 8 weeks up to today for the best read. This version keeps the data in this browser only.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/templates/calon-till-template.csv"
            download
            className="inline-flex h-11 items-center rounded-full border border-[#1F4D3A] px-4 text-[0.9rem] font-semibold text-[#1F4D3A]"
          >
            Download the template
          </a>
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-saffron px-4 font-semibold text-saffron-ink">
            <Upload className="size-5" aria-hidden="true" />
            Choose CSV file
            <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        {problem ? (
          <p role="alert" className="rounded-xl bg-[#F6DDD6] p-3 text-[0.9rem] text-[#7A2E1C]">
            {problem}
          </p>
        ) : null}
        {checked ? <Review checked={checked} onLoad={load} /> : null}
      </Card>
    </section>
  );
}

function Review({ checked, onLoad }: { checked: Checked; onLoad: () => void }) {
  const { result } = checked;
  const shown = result.skipped.slice(0, 5);
  return (
    <div className="grid gap-2 rounded-xl bg-[#E7DFD0] p-3 text-[0.9rem] text-[#2B2B2B]" aria-live="polite">
      <p className="font-medium">{checked.fileName} checked</p>
      <p>
        {result.orders.length} orders across {checked.days} days, {checked.first} to {checked.last}.
      </p>
      {checked.stale ? <p className="text-[#7A2E1C]">The latest sale is over a week old, so “today” will look quiet. Upload a more recent export for a live read.</p> : null}
      {result.skipped.length ? (
        <div>
          <p>
            {result.skipped.length} of {result.rows} rows were left out:
          </p>
          <ul className="ml-4 list-disc">
            {shown.map((s) => (
              <li key={`${s.line}-${s.reason}`}>
                Row {s.line}: {s.reason}
              </li>
            ))}
          </ul>
          {result.skipped.length > shown.length ? <p>and {result.skipped.length - shown.length} more.</p> : null}
        </div>
      ) : null}
      {result.unknownItems.length ? (
        <p>
          {result.unknownItems.length} item names aren’t on the menu ({result.unknownItems.slice(0, 4).join(", ")}
          {result.unknownItems.length > 4 ? "…" : ""}). They count towards takings but not item reports.
        </p>
      ) : null}
      <button type="button" onClick={onLoad} className="h-11 justify-self-start rounded-full bg-saffron px-4 font-semibold text-saffron-ink">
        Load into Calon
      </button>
    </div>
  );
}
