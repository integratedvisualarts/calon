"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-card border border-line bg-surface shadow-[var(--shadow-lift)]", className)}>
      {children}
    </section>
  );
}

const tones = {
  neutral: "bg-surface-2 text-mist",
  saffron: "bg-saffron text-saffron-ink",
  teal: "bg-teal/15 text-teal",
  coral: "bg-coral/15 text-coral",
  paper: "bg-paper text-paper-ink",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("h-auto rounded-full px-2.5 py-1 text-[0.8rem] font-medium tracking-normal", tones[tone], className)}
    >
      {children}
    </Badge>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 min-h-11 rounded-full bg-saffron px-4 text-base font-semibold text-saffron-ink hover:bg-saffron/90",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <Button
      type={type}
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-11 min-h-11 rounded-full border-line bg-surface-2 px-4 text-base font-medium text-[#2B2B2B] hover:border-saffron hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function PageHeader({ kicker, title, lede }: { kicker?: string; title: string; lede?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [title]);
  return (
    <header className="mb-4 grid gap-1">
      {kicker ? <p className="text-[0.8rem] font-medium tracking-wide text-saffron uppercase">{kicker}</p> : null}
      <h1 ref={ref} tabIndex={-1} id="screen-title" className="font-serif text-4xl leading-tight text-ink outline-none lg:text-5xl">
        {title}
      </h1>
      {lede ? <p className="max-w-xl text-mist">{lede}</p> : null}
    </header>
  );
}

export function ForecastNote() {
  return <p className="text-[0.8rem] text-faint">Range from the last 8 weeks of till data.</p>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="grid gap-3 p-5">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-mist">{body}</p>
      {action}
    </Card>
  );
}

export function CardSkeleton() {
  return (
    <div className="grid gap-2" aria-hidden="true">
      <div className="shimmer h-28 rounded-card" />
      <div className="shimmer h-40 rounded-card" />
      <div className="shimmer h-40 rounded-card" />
    </div>
  );
}

export function usePause(key: string) {
  const [wait, setWait] = useState(true);
  useEffect(() => {
    setWait(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setWait(false), reduced ? 0 : 400);
    return () => window.clearTimeout(timer);
  }, [key]);
  return wait;
}

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative size-36 shrink-0" role="img" aria-label={`${label}: ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} stroke="#C4A15A" strokeWidth="8" fill="none" opacity="0.35" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="score-ring"
          stroke="#C4A15A"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ ["--ring-circ" as string]: String(circ) }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl leading-none">{score}</span>
        <span className="mt-1 text-[0.8rem] text-mist">of 100</span>
      </div>
    </div>
  );
}

export function Spark({ data, tone = "neutral" }: { data: number[]; tone?: "up" | "down" | "alert" | "neutral" }) {
  const width = 160;
  const height = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - 4 - ((value - min) / span) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");
  const color = tone === "down" || tone === "alert" ? "#8C4034" : tone === "up" ? "#1F4D3A" : "#C4A15A";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-9 w-full" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

export function Trend({ data }: { data: { n: string; v: number }[] }) {
  const width = 320;
  const height = 96;
  const rawMin = Math.min(...data.map((item) => item.v));
  const rawMax = Math.max(...data.map((item) => item.v));
  const pad = Math.max((rawMax - rawMin) * 0.35, rawMax > 20 ? 2 : 0.2);
  const min = rawMin - pad;
  const max = rawMax + pad;
  const span = max - min || 1;
  const coords = data.map((item, index) => {
    const x = 36 + (index / Math.max(data.length - 1, 1)) * (width - 72);
    const y = 12 + (1 - (item.v - min) / span) * (height - 36);
    return { x, y, ...item };
  });
  const line = coords.map((item) => `${item.x},${item.y}`).join(" ");
  const fill = `${coords[0]?.x ?? 0},${height - 18} ${line} ${coords.at(-1)?.x ?? 0},${height - 18}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label="Score trend">
      <polygon points={fill} fill="#C4A15A" opacity="0.2" />
      <polyline fill="none" stroke="#1F4D3A" strokeWidth="2" points={line} />
      {coords.map((item) => (
        <text key={item.n} x={item.x} y={height - 4} textAnchor="middle" fill="#6F675C" fontSize="11">
          {item.n}
        </text>
      ))}
    </svg>
  );
}

export function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="grid h-24 grid-cols-4 items-end gap-2" role="img" aria-label="Weekly chart">
      {data.map((item) => (
        <div key={item.label} className="grid h-full grid-rows-[1fr_auto] gap-1">
          <div className="flex items-end">
            <div className="w-full rounded-t-md bg-saffron" style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
          <span className="text-center text-[0.7rem] text-faint">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function mentionTone(mention: "ranked" | "mentioned" | "absent") {
  if (mention === "ranked") return { label: "Ranked", tone: "teal" as const };
  if (mention === "mentioned") return { label: "Mentioned", tone: "saffron" as const };
  return { label: "Missing", tone: "coral" as const };
}
