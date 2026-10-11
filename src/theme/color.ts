/** Tiny sRGB colour helpers for build-time token derivation. Hex in, hex out. */

export type RGB = [number, number, number];

export function parseHex(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Theme colours must be hex (#rgb or #rrggbb), got "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix `a` into `b` by `amount` (0 = b, 1 = a). */
export function mix(a: string, b: string, amount: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex(ca.map((v, i) => v * amount + cb[i]! * (1 - amount)) as RGB);
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const isDark = (hex: string) => luminance(hex) < 0.18;

/**
 * Nudge `color` toward black or white (whichever increases contrast against `bg`)
 * until it reaches `target`. Keeps hue roughly intact; returns the closest it can get.
 */
export function ensureContrast(color: string, bg: string, target: number, toward?: string): string {
  if (contrast(color, bg) >= target) return color;
  const dest = toward ?? (isDark(bg) ? "#ffffff" : "#000000");
  for (let step = 0.05; step <= 1.0001; step += 0.05) {
    const c = mix(dest, color, step);
    if (contrast(c, bg) >= target) return c;
  }
  return dest;
}

/** The more readable of two candidate foregrounds on `bg`, preferring the first on ties ≥ 4.5. */
export function readableOn(bg: string, preferred: string, alternate: string): string {
  const a = contrast(preferred, bg);
  if (a >= 4.5) return preferred;
  const b = contrast(alternate, bg);
  return b > a ? alternate : preferred;
}
