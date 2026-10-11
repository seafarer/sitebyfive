import type { Tone } from "../schema/site-schema";
import { contrast, ensureContrast, isDark, mix } from "./color";
import { fontVar, presets, type Palette, type ResolvedTheme } from "./presets";

/**
 * Turns a resolved theme into CSS custom properties.
 *
 * Every section tone gets its own set of surface tokens (--s-*). Components only
 * ever read --s-* (via the Tailwind colour names in global.css), so the same markup
 * is readable on any surface under any preset. All text colours are derived for
 * WCAG contrast: 4.5:1 for body text and links, 3:1 for large accents and UI edges.
 */

export interface Surface {
  bg: string;
  fg: string;
  fgMuted: string;
  border: string;
  card: string;
  link: string;
  /** Heading accent colour (large text, 3:1). */
  accentInk: string;
  /** Accent-coloured small text: labels, dates (4.5:1). */
  label: string;
  /** Marker highlight behind accented words. */
  markBg: string;
  /** Highlighter behind accented words with body-colour text over it (bright preset). */
  highlight: string;
  markFg: string;
  btnBg: string;
  btnFg: string;
  btn2Fg: string;
  btn2Border: string;
  focus: string;
  eyebrow: string;
  /** Pill/tag background. */
  pill: string;
  pillFg: string;
}

const WHITE = "#ffffff";

function inkFor(c: Palette): string {
  // Body text on light surfaces: the neutral, deepened until it reads at 9:1 on white.
  return ensureContrast(c.neutral, WHITE, 9);
}

/** Section tones plus the internal elevated surface (floating nav, badges). */
export type SurfaceName = Tone | "raised";

function surface(bg: string, c: Palette, tone: SurfaceName): Surface {
  const dark = isDark(bg);
  const ink = inkFor(c);
  const fg = dark ? mix(WHITE, bg, 0.95) : ensureContrast(ink, bg, 7);
  const fgMuted = ensureContrast(mix(fg, bg, 0.72), bg, 4.6);
  const onAccent = tone === "accent";
  // Brand colour as text. A colour far too light for this surface (lime or yellow on white) would
  // have to be darkened into olive or mustard; try the other brand colour, then the text colour.
  // The light colour stays for fills, buttons, and highlights.
  // On dark surfaces, accent text prefers a brand colour that already reads clearly (Lattice: lime, not deep green).
  const brandText = (colors: string[], min: number, preferBright = false) => {
    const bright = preferBright && dark ? colors.find((x) => contrast(x, bg) >= 4.5) : undefined;
    const usable = bright ?? colors.find((x) => contrast(x, bg) >= 1.6);
    return usable ? ensureContrast(usable, bg, min) : fg;
  };

  // Buttons: first candidate that stands off the surface at 3:1.
  const [btnBg, btnFg] = labelPair([c.primary, c.accent, fg].find((x) => contrast(x, bg) >= 3) ?? fg, ink, dark);

  // Marker highlight: a brand colour that differs visibly from the surface.
  const [markBg, markFg] = labelPair([onAccent ? c.primary : c.accent, c.primary, c.accent].find((x) => contrast(x, bg) >= 1.6) ?? fg, ink, dark);

  const accentInk = onAccent ? fg : brandText(dark ? [c.accent, c.primary] : [c.accent], 3, true);
  const card = dark ? mix(WHITE, bg, 0.07) : luminanceIsWhite(bg) ? mix(c.neutral, WHITE, 0.035) : mix(WHITE, bg, 0.65);
  const pill = dark ? mix(WHITE, bg, 0.12) : mix(c.primary, bg, 0.1);

  // Highlighter: the lighter brand colour, softened, with the text still reading at 4.5:1 over it.
  const light = [c.accent, c.primary].sort((a, b) => contrast(fg, b) - contrast(fg, a))[0]!;
  let highlight = mix(light, bg, 0.6);
  for (let k = 0.6; contrast(fg, highlight) < 4.5 && k > 0; k -= 0.1) highlight = mix(light, bg, k);

  return {
    bg,
    fg,
    fgMuted,
    border: mix(fg, bg, 0.16),
    card,
    link: onAccent ? fg : brandText(dark ? [c.primary] : [c.primary, c.accent], 4.5),
    accentInk,
    label: onAccent ? fg : brandText(dark ? [c.accent, c.primary] : [c.accent], 4.5, true),
    markBg,
    markFg,
    highlight,
    btnBg,
    btnFg,
    btn2Fg: fg,
    btn2Border: mix(fg, bg, 0.55),
    focus: brandText(dark ? [c.primary] : [c.primary, c.accent], 3),
    eyebrow: onAccent || dark ? mix(fg, bg, 0.85) : brandText([c.primary, c.accent], 4.5),
    pill,
    pillFg: ensureContrast(fg, pill, 4.5),
  };
}

/**
 * A fill and the label colour on it, with the label at 4.5:1. If neither white nor ink
 * reaches that on a mid-tone fill, the fill itself shifts: lighter (ink label) on dark
 * surfaces, darker (white label) on light ones, so it still stands off the surface.
 */
function labelPair(fill: string, ink: string, surfaceDark: boolean): [string, string] {
  const fg = contrast(WHITE, fill) >= contrast(ink, fill) ? WHITE : ink;
  if (contrast(fg, fill) >= 4.5) return [fill, fg];
  return surfaceDark ? [ensureContrast(fill, ink, 4.5, WHITE), ink] : [ensureContrast(fill, WHITE, 4.5, "#000000"), WHITE];
}

const luminanceIsWhite = (hex: string) => contrast(hex, WHITE) < 1.03;

export function surfaces(theme: ResolvedTheme): Record<SurfaceName, Surface> {
  const def = presets[theme.preset];
  const c = theme.colors;
  const paper = def.paper(c);
  return {
    default: surface(paper, c, "default"),
    muted: surface(def.muted(c, paper), c, "muted"),
    tint: surface(def.tint(c, paper), c, "tint"),
    raised: surface(def.raised(c, paper), c, "raised"),
    inverse: surface(def.inverse(c), c, "inverse"),
    accent: surface(def.accentSurface(c, paper), c, "accent"),
  };
}

/**
 * Fun preset accent underline: three gentle arcs, stretched to the accent's width with a
 * constant stroke. Baked per surface because a data-URI SVG can't read CSS variables.
 */
function squiggle(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 12" preserveAspectRatio="none"><path d="M3 8Q22 2 41 7T80 7T117 5" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const RADIUS = {
  none: { sm: "0px", md: "0px", lg: "0px", btn: "0px" },
  soft: { sm: "6px", md: "12px", lg: "20px", btn: "10px" },
  round: { sm: "12px", md: "22px", lg: "32px", btn: "999px" },
} as const;

const DENSITY = {
  airy: { section: "clamp(4.5rem, 9vw, 8.5rem)", gap: "clamp(2.5rem, 5vw, 4.5rem)", stack: "1.5" },
  standard: { section: "clamp(3.75rem, 7vw, 6.25rem)", gap: "clamp(2rem, 4vw, 3.5rem)", stack: "1.2" },
  compact: { section: "clamp(2.75rem, 5vw, 4.25rem)", gap: "clamp(1.5rem, 3vw, 2.5rem)", stack: "1" },
} as const;

/** CSS for :root and the five .tone-* classes. */
export function themeCss(theme: ResolvedTheme): string {
  const s = surfaces(theme);
  const r = RADIUS[theme.radius];
  const d = DENSITY[theme.density];
  const root = [
    `--brand-primary:${theme.colors.primary}`,
    `--brand-accent:${theme.colors.accent}`,
    `--brand-neutral:${theme.colors.neutral}`,
    `--ff-heading:var(${fontVar(theme.fonts.heading.name)})`,
    `--ff-body:var(${fontVar(theme.fonts.body.name)})`,
    `--heading-scale-sm:${theme.fonts.heading.smallScale ?? 1}`,
    `--r-sm:${r.sm}`,
    `--r-md:${r.md}`,
    `--r-lg:${r.lg}`,
    `--r-btn:${r.btn}`,
    `--space-section:${d.section}`,
    `--space-gap:${d.gap}`,
    `--space-stack:${d.stack}`,
    `--paper:${s.default.bg}`,
    `--ink:${s.default.fg}`,
  ];
  const tones = (Object.keys(s) as SurfaceName[]).map((tone) => {
    const vars = Object.entries(s[tone]).map(([k, v]) => `--s-${kebab(k)}:${v}`);
    if (theme.preset === "fun") {
      // The squiggle needs to read as a line: the highlight colour if it stands off the surface, else primary, else text.
      const x = s[tone];
      const ink = [x.markBg, theme.colors.primary].find((col) => contrast(col, x.bg) >= 2.5) ?? x.fg;
      vars.push(`--squiggle:${squiggle(ink)}`);
    }
    return `.tone-${tone}{${vars.join(";")};color-scheme:${isDark(s[tone].bg) ? "dark" : "light"}}`;
  });
  // Transparent nav (CSS scroll-driven animation; typed custom properties animate): the bar
  // fades from clear to the first block's solid surface, then flips to the default surface
  // in one step. Blending text and fill together would pass both through the same grey.
  const NAV_KEYS: (keyof Surface)[] = ["bg", "fg", "fgMuted", "border", "link", "focus", "btnBg", "btnFg", "btn2Fg", "btn2Border"];
  const props = NAV_KEYS.map((k) => `@property --s-${kebab(k)}{syntax:"<color>";inherits:true;initial-value:transparent}`);
  const frame = (x: Surface, bgOverride?: string) =>
    NAV_KEYS.map((k) => `--s-${kebab(k)}:${k === "bg" && bgOverride ? bgOverride : x[k]}`).join(";");
  // Button labels also animate `color` directly: Chrome recomputes an inherited animated
  // variable but doesn't repaint text that uses it.
  const flip = (name: string, prop: string, from: string, to: string) =>
    `@keyframes ${name}{0%,49.9%{${prop}:${from}}50%,100%{${prop}:${to}}}`;
  const navFrames = (["inverse", "accent"] as const).flatMap((tone) => [
    `@keyframes nav-solid-${tone}{0%{${frame(s[tone], `${s[tone].bg}00`)}}49.9%{${frame(s[tone])}}50%,100%{${frame(s.default)}}}`,
    flip(`nav-btn-${tone}`, "color", s[tone].btnFg, s.default.btnFg),
    flip(`nav-btn2-${tone}`, "color", s[tone].btn2Fg, s.default.btn2Fg),
  ]);
  return `${props.join("\n")}\n:root{${root.join(";")}}\n${tones.join("\n")}\n${navFrames.join("\n")}`;
}

/** Contrast report for lint output: any surface pair that fell short despite derivation. */
export function contrastReport(theme: ResolvedTheme): string[] {
  const out: string[] = [];
  for (const [tone, x] of Object.entries(surfaces(theme))) {
    const checks: [string, string, string, number][] = [
      ["text", x.fg, x.bg, 4.5],
      ["muted text", x.fgMuted, x.bg, 4.5],
      ["link", x.link, x.bg, 4.5],
      ["label", x.label, x.bg, 4.5],
      ["button label", x.btnFg, x.btnBg, 4.5],
      ["marker", x.markFg, x.markBg, 4.5],
    ];
    for (const [label, fg, bg, min] of checks) {
      const ratio = contrast(fg, bg);
      if (ratio < min) out.push(`tone ${tone}: ${label} ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (needs ${min}:1)`);
    }
  }
  return out;
}
