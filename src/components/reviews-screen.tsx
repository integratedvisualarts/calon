"use client";

import { reviews } from "@/data/demo-data";
import { Card, EmptyState, PageHeader, Pill, PrimaryButton, Trend } from "@/components/bits";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { Copy, Star } from "lucide-react";
import { useState } from "react";

export function ReviewsScreen() {
  const store = useStore();
  if (!store.sources.reviews) {
    return (
      <EmptyState
        title="Reviews aren’t connected"
        body="Connect Google reviews in Profile to see the inbox."
        action={
          <button type="button" className="min-h-11 font-semibold text-saffron" onClick={() => store.go("profile")}>
            Open connected sources
          </button>
        }
      />
    );
  }
  const praise = reviews.themes.filter((theme) => theme.tone !== "down");
  const fix = reviews.themes.filter((theme) => theme.tone === "down");
  return (
    <div className="rise grid gap-4">
      <PageHeader
        kicker="Reviews"
        title={`${reviews.score} from ${reviews.count} reviews`}
        lede={`${reviews.newCount} new since ${reviews.sinceLabel}. Replies stay here until you approve them.`}
      />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="p-5">
          <p className="text-[0.8rem] text-mist">Rating trend</p>
          <p className="font-serif text-4xl">{reviews.score}</p>
          <Trend data={reviews.trend} />
          <ul className="mt-3 flex flex-wrap gap-2">
            {reviews.themes.map((theme) => (
              <li key={theme.name}>
                <Pill tone={theme.tone === "down" ? "coral" : theme.tone === "up" ? "teal" : "neutral"}>
                  {theme.name} · {theme.count}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
        <ul className="grid gap-3">
          {reviews.items.map((review) => (
            <ReviewCard key={review.id} id={review.id} />
          ))}
        </ul>
      </div>
      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">Themes</h2>
        <p className="text-mist">What guests praise, and what needs a reply.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <ThemeColumn title="What guests praise" themes={praise} />
          <ThemeColumn title="What needs fixing" themes={fix} />
        </div>
      </section>
    </div>
  );
}

function ThemeColumn({
  title,
  themes,
}: {
  title: string;
  themes: (typeof reviews.themes)[number][];
}) {
  const store = useStore();
  return (
    <div className="grid gap-3">
      <h3 className="font-serif text-2xl">{title}</h3>
      {themes.map((theme) => (
        <Card key={theme.name} className="grid gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{theme.name}</p>
            <Pill tone={theme.tone === "down" ? "coral" : "teal"}>{theme.count}</Pill>
            <Pill>{theme.trend}</Pill>
            <Pill tone={theme.severity === "High" ? "coral" : "neutral"}>{theme.severity}</Pill>
          </div>
          <ul className="grid gap-1 text-mist">
            {theme.quotes.map((quote) => (
              <li key={quote}>“{quote}”</li>
            ))}
          </ul>
          <p>{theme.action}</p>
          <button
            type="button"
            className="min-h-11 justify-self-start rounded-full bg-saffron px-4 font-semibold text-saffron-ink"
            onClick={() =>
              store.openOrCreate(`theme-${theme.name}`, () => ({
                id: `theme-${theme.name}`,
                title: theme.name,
                status: "draft",
                audience: "Guests who mentioned this theme",
                timing: "This week",
                variants: [{ id: "a", label: "Straight", body: theme.draft }],
              }))
            }
          >
            Approve a draft
          </button>
        </Card>
      ))}
    </div>
  );
}

function ReviewCard({ id }: { id: string }) {
  const review = reviews.items.find((item) => item.id === id);
  const store = useStore();
  const saved = store.replies[id];
  const [text, setText] = useState(saved?.text ?? review?.draft ?? "");
  const [copied, setCopied] = useState(false);
  if (!review) return null;

  async function approve() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    store.saveReply(id, text, true);
  }

  return (
    <li>
      <Card className="grid gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{review.name}</p>
            <p className="text-[0.8rem] text-faint">{review.when} · Google</p>
          </div>
          <span className="inline-flex items-center gap-1 text-saffron" aria-label={`${review.stars} stars`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="size-4" fill={index < review.stars ? "currentColor" : "transparent"} aria-hidden="true" />
            ))}
          </span>
        </div>
        <p>{review.text}</p>
        <div className="flex flex-wrap gap-2">
          {review.themes.map((theme) => (
            <Pill key={theme}>{theme}</Pill>
          ))}
        </div>
        <label className="grid gap-2">
          <span className="font-medium">Draft reply</span>
          <Textarea
            value={text}
            rows={4}
            onChange={(event) => {
              setText(event.target.value);
              setCopied(false);
            }}
            className="rounded-xl border-line bg-navy-2 p-3 text-base md:text-base"
          />
        </label>
        <p className="text-[0.8rem] text-faint">Edit it first. Approving copies it. It does not post.</p>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => void approve()}>
            <Copy className="size-4" aria-hidden="true" />
            {saved?.approved ? "Approved · copy again" : "Approve and copy"}
          </PrimaryButton>
          <button
            type="button"
            className="min-h-11 rounded-full border border-line px-4 font-medium"
            onClick={() => {
              setText(review.draft);
              setCopied(false);
            }}
          >
            Reset draft
          </button>
        </div>
        {saved?.approved ? (
          <p className="text-teal">{copied ? "Copied. Paste it into Google yourself." : "Approved. Copy was blocked by the browser — select the text above."}</p>
        ) : null}
      </Card>
    </li>
  );
}
