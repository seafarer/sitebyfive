import type { Preset, Theme } from "../schema/site-schema";
import { contrast, isDark, mix } from "./color";

/**
 * Theme presets. Each preset owns colour defaults, fonts, radius, density, and the
 * recipes that turn three brand colours into five section surfaces. Visual treatments
 * (accent style, CTA treatment, eyebrow style, shadows) live in src/styles/presets.css,
 * keyed by [data-preset].
 */

export interface FontDef {
  name: string;
  fallbacks: string[];
  /** Size multiplier for small headings (card and list titles), for fonts that run small next to body text. */
  smallScale?: number;
}

/** Heading fonts whose small x-height makes card titles look undersized at the shared sizes (+1pt). */
const SMALL_SCALE: Record<string, number> = { Outfit: 1.07 };

export interface Palette {
  primary: string;
  accent: string;
  neutral: string;
}

export interface PresetDef {
  colors: Palette;
  fonts: { heading: FontDef; body: FontDef };
  radius: NonNullable<Theme["radius"]>;
  density: NonNullable<Theme["density"]>;
  /** Page background. */
  paper: (c: Palette) => string;
  /** Muted surface. */
  muted: (c: Palette, paper: string) => string;
  /** Inverse (dark) surface. */
  inverse: (c: Palette) => string;
  /** Accent surface: the accent colour itself, or a wash of it for quieter presets. */
  accentSurface: (c: Palette, paper: string) => string;
  /** Tint tone: a pale wash of the brand colour. */
  tint: (c: Palette, paper: string) => string;
  /** Elevated UI surface (floating nav bar, date badges). Not a section tone. */
  raised: (c: Palette, paper: string) => string;
  /** Surface the footer sits on. */
  footerTone: "default" | "muted" | "inverse";
  /** Heading weight (mirrors --heading-weight in presets.css); preloaded so headings paint fast. */
  headingWeight: 400 | 500 | 600 | 700 | 800;
}

const darkOf = (hex: string, amount: number) => mix("#000000", hex, amount);
/** A dark colour derived from `hex`, dark enough for white body text (≥ 9:1). */
const deep = (hex: string, start = 0.2) => {
  for (let a = start; a < 1; a += 0.06) {
    const c = darkOf(hex, a);
    if (contrast(c, "#ffffff") >= 9) return c;
  }
  return darkOf(hex, 0.92);
};
const darkEnough = (hex: string) => (isDark(hex) && contrast(hex, "#ffffff") >= 9 ? hex : deep(hex, 0.1));

const sans = ["system-ui", "sans-serif"];
const serif = ["Georgia", "serif"];

export const presets: Record<Preset, PresetDef> = {
  /** Quiet, editorial, low-saturation. Accent tone is a wash, not a fill. */
  muted: {
    colors: { primary: "#3D5C58", accent: "#C4A27F", neutral: "#2B2F33" },
    fonts: { heading: { name: "Hanken Grotesk", fallbacks: sans }, body: { name: "Hanken Grotesk", fallbacks: sans } },
    radius: "soft",
    density: "airy",
    paper: (c) => mix(c.neutral, "#ffffff", 0.025),
    muted: (c, paper) => mix(c.neutral, paper, 0.055),
    inverse: (c) => darkEnough(mix(c.neutral, "#000000", 0.85)),
    accentSurface: (c, paper) => mix(c.accent, paper, 0.28),
    tint: (c, paper) => mix(c.primary, paper, 0.08),
    raised: () => "#ffffff",
    footerTone: "muted",
    headingWeight: 500,
  },
  /** Crisp, serious, square. Inverse is a deep primary, accent is a restrained wash. */
  business: {
    colors: { primary: "#1F3A5F", accent: "#B08D57", neutral: "#2E3338" },
    fonts: { heading: { name: "Newsreader", fallbacks: serif }, body: { name: "Source Sans 3", fallbacks: sans } },
    radius: "none",
    density: "standard",
    paper: () => "#ffffff",
    muted: (c, paper) => mix(c.neutral, paper, 0.045),
    inverse: (c) => darkEnough(c.primary),
    accentSurface: (c, paper) => mix(c.accent, paper, 0.22),
    tint: (c, paper) => mix(c.primary, paper, 0.06),
    raised: (c) => mix(c.neutral, "#ffffff", 0.02),
    footerTone: "inverse",
    headingWeight: 400,
  },
  /** Cream paper, terracotta and marigold, a serif with character. */
  warm: {
    colors: { primary: "#B4472B", accent: "#E9B44C", neutral: "#3A2E28" },
    fonts: { heading: { name: "Fraunces", fallbacks: serif }, body: { name: "Figtree", fallbacks: sans } },
    radius: "soft",
    density: "standard",
    paper: (c) => mix(c.accent, "#fffdf9", 0.07),
    muted: (c, paper) => mix(c.accent, paper, 0.2),
    inverse: (c) => darkEnough(mix(c.neutral, "#000000", 0.9)),
    accentSurface: (c) => c.accent,
    tint: (c, paper) => mix(c.primary, paper, 0.08),
    raised: () => "#fffdf9",
    footerTone: "inverse",
    headingWeight: 600,
  },
  /** High energy, kept clean: white paper, saturated buttons and highlights, a light accent wash, near-black inverse. */
  bright: {
    colors: { primary: "#2F5BFF", accent: "#FF5A36", neutral: "#14171F" },
    fonts: { heading: { name: "DM Sans Variable", fallbacks: sans }, body: { name: "Inter", fallbacks: sans } },
    radius: "soft",
    density: "airy",
    paper: () => "#ffffff",
    muted: (c, paper) => mix(c.neutral, paper, 0.04),
    inverse: (c) => darkEnough(c.neutral),
    accentSurface: (c, paper) => mix(c.accent, paper, 0.14),
    tint: (c, paper) => mix(c.primary, paper, 0.07),
    raised: () => "#ffffff",
    footerTone: "inverse",
    headingWeight: 600,
  },
  /** Playful: near-white paper, a butter-yellow accent wash, deep primary inverse, chunky shapes. */
  fun: {
    colors: { primary: "#3A7BD5", accent: "#FFC247", neutral: "#34323D" },
    fonts: { heading: { name: "Baloo 2", fallbacks: sans }, body: { name: "Nunito Sans", fallbacks: sans } },
    radius: "round",
    density: "airy",
    paper: (c) => mix(c.accent, "#ffffff", 0.04),
    muted: (c, paper) => mix(c.neutral, paper, 0.05),
    inverse: (c) => deep(c.primary, 0.35),
    accentSurface: (c, paper) => mix(c.accent, paper, 0.38),
    tint: (c) => mix(c.primary, "#ffffff", 0.09),
    raised: () => "#ffffff",
    footerTone: "inverse",
    headingWeight: 800,
  },
};

/** Theme after applying overrides to the preset defaults. */
export interface ResolvedTheme {
  preset: Preset;
  colors: Palette;
  fonts: { heading: FontDef; body: FontDef };
  radius: PresetDef["radius"];
  density: PresetDef["density"];
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  const def = presets[theme.preset];
  const font = (role: "heading" | "body"): FontDef => {
    const name = theme.fonts?.[role];
    const base = name ? { name, fallbacks: def.fonts[role].fallbacks } : def.fonts[role];
    return SMALL_SCALE[base.name] ? { ...base, smallScale: SMALL_SCALE[base.name] } : base;
  };
  return {
    preset: theme.preset,
    colors: { ...def.colors, ...theme.colors },
    fonts: { heading: font("heading"), body: font("body") },
    radius: theme.radius ?? def.radius,
    density: theme.density ?? def.density,
  };
}

export const fontVar = (name: string) => `--font-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
