"use client";

import { areaRadii, areaSignals } from "@/data/demo-data";
import { Card, Pill } from "@/components/bits";
import { useState } from "react";
import { brand } from "@/data/brands";

export function AreaSignals({ compact = false }: { compact?: boolean }) {
  const [radius, setRadius] = useState(2);
  const matches = areaSignals.filter((item) => item.miles <= radius);
  const shown = compact ? matches.slice(0, 2) : matches;
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">{brand.areaTitle}</h2>
          <p className="text-[0.8rem] text-mist">{brand.areaBlurb}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Radius">
        {areaRadii.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={radius === item}
            onClick={() => setRadius(item)}
            className={`min-h-11 rounded-full px-4 font-medium ${radius === item ? "bg-saffron text-saffron-ink" : "bg-surface text-mist"}`}
          >
            {item} {item === 1 ? "mile" : "miles"}
          </button>
        ))}
        <Pill>This area</Pill>
      </div>
      <ul className="grid gap-3">
        {shown.map((item) => (
          <li key={item.id}>
            <Card className="grid gap-2 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-2xl">{item.name}</h3>
                <p className="text-[0.8rem] text-mist">
                  {item.miles} {item.miles === 1 ? "mile" : "miles"} · {item.kind}
                </p>
              </div>
              <p>{item.detail}</p>
              {compact ? null : <p className="text-[0.8rem] text-faint">{item.source}</p>}
            </Card>
          </li>
        ))}
        {shown.length === 0 ? <li className="text-mist">Nothing on the map inside that radius.</li> : null}
      </ul>
    </section>
  );
}
