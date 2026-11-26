export function money(n: number, pence = false): string {
  const v = pence ? Math.round(n * 100) / 100 : Math.round(n);
  return `£${v.toLocaleString("en-GB", { minimumFractionDigits: pence ? 2 : 0, maximumFractionDigits: pence ? 2 : 0 })}`;
}

export function moneyRange(low: number, high: number): string {
  const r = (n: number) => (n >= 1000 ? Math.round(n / 50) * 50 : Math.round(n / 10) * 10);
  return `${money(r(low))}–${money(r(high))}`;
}

export function pct(n: number, signed = false): string {
  const v = Math.round(n * 100);
  return `${signed && v > 0 ? "+" : ""}${v}%`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Lower-case the first letter, unless the word is an acronym (FAQ, AEO). */
export function lowerFirst(text: string): string {
  if (!text) return text;
  if (text.length > 1 && text[1] === text[1].toUpperCase() && text[1] !== text[1].toLowerCase()) return text;
  return text[0].toLowerCase() + text.slice(1);
}

export function capitalise(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function round(n: number, step = 1) {
  return Math.round(n / step) * step;
}
