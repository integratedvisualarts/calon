/** Seeded randomness, so a given day always replays the same way. */

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Rng = {
  next: () => number;
  between: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  chance: (p: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  weighted: <T>(items: readonly T[], weight: (item: T) => number) => T;
  normal: (mean: number, sd: number) => number;
};

export function rng(seed: string): Rng {
  let a = hashSeed(seed) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const api: Rng = {
    next,
    between: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (items, weight) => {
      const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
      let roll = next() * total;
      for (const item of items) {
        roll -= Math.max(0, weight(item));
        if (roll <= 0) return item;
      }
      return items[items.length - 1];
    },
    normal: (mean, sd) => {
      const u = Math.max(1e-9, next());
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
  return api;
}
