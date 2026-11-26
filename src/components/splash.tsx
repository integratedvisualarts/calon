"use client";

import { CalonMark, CalonWordmark } from "@/components/brand";
import { productTagline } from "@/data/demo-data";
import { useEffect, useState } from "react";

const seenKey = "calon-splash";

export function Splash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(seenKey) === "1") return;
    setShow(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(finish, reduced ? 700 : 3000);
    return () => window.clearTimeout(timer);
  }, []);

  function finish() {
    sessionStorage.setItem(seenKey, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <button
      type="button"
      className="splash"
      onClick={finish}
      aria-label="Calon. Skip the introduction."
    >
      <span className="splash-inner">
        <CalonMark tone="cream" className="splash-mark h-20 w-20" />
        <CalonWordmark tone="cream" className="splash-word mt-2 h-14 w-auto" />
        <span className="splash-rule" />
        <span className="splash-tag font-serif italic">{productTagline}</span>
      </span>
      <span className="splash-skip">Skip</span>
    </button>
  );
}
