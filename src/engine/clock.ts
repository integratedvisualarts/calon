/**
 * The demo clock. Real time by default, so the feed moves with the room you are pitching in.
 * Two optional URL parameters, for rehearsing a pitch:
 *   ?at=2026-11-20T19:30   start the clock at a given local time
 *   ?speed=60              run the clock faster (60 = one minute per second)
 * Both are remembered for the browser session.
 */

let origin: { real: number; demo: number; speed: number } | null = null;

function init() {
  if (origin) return origin;
  let at: number | null = null;
  let speed = 1;
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("clock") === "real") window.sessionStorage.removeItem("calon-clock");
      const stored = window.sessionStorage.getItem("calon-clock");
      const saved = stored ? (JSON.parse(stored) as { at?: string; speed?: number }) : {};
      const atParam = params.get("at") ?? saved.at ?? null;
      const speedParam = params.get("speed") ?? (saved.speed ? String(saved.speed) : null);
      if (atParam) {
        const parsed = new Date(atParam);
        if (!Number.isNaN(parsed.getTime())) at = parsed.getTime();
      }
      if (speedParam && Number(speedParam) > 0) speed = Math.min(600, Number(speedParam));
      if (params.get("at") || params.get("speed")) {
        window.sessionStorage.setItem("calon-clock", JSON.stringify({ at: params.get("at") ?? saved.at, speed }));
      }
    } catch {
      /* real time */
    }
  }
  const real = Date.now();
  origin = { real, demo: at ?? real, speed };
  return origin;
}

export function liveNow(): Date {
  const o = init();
  return new Date(o.demo + (Date.now() - o.real) * o.speed);
}

/** How often the feed should refresh, in real milliseconds. */
export function tickMs(): number {
  const o = init();
  return o.speed > 1 ? 2_000 : 15_000;
}
