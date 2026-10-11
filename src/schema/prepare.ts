import type { Preset, Site } from "./site-schema";

export interface BuildOptions {
  /** Site folder name under src/sites. */
  site: string;
  /** Overrides theme.preset and drops colour/font/radius/density overrides. */
  preset?: Preset;
  /** Strip every image from the config to exercise the no-image fallbacks. */
  noImages: boolean;
}

const IMAGE_KEYS = new Set(["image", "photo", "logo", "ogImage"]);

function stripImages(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripImages);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (IMAGE_KEYS.has(k)) continue;
      out[k] = k === "images" ? [] : stripImages(v);
    }
    return out;
  }
  return value;
}

/** Applies the PRESET / NO_IMAGES build switches to a parsed site. */
export function prepareSite(site: Site, opts: Pick<BuildOptions, "preset" | "noImages">): Site {
  let out = site;
  if (opts.preset) out = { ...out, theme: { preset: opts.preset } };
  if (opts.noImages) out = stripImages(out) as Site;
  return out;
}

/** Every image src referenced by a site config, with where it is used. */
export function collectImageRefs(site: Site): { src: string; alt: string; where: string }[] {
  const refs: { src: string; alt: string; where: string }[] = [];
  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      return value.forEach((v, i) => {
        const slug = v && typeof v === "object" && typeof (v as { slug?: unknown }).slug === "string" ? (v as { slug: string }).slug : undefined;
        walk(v, `${path}[${slug ?? i}]`);
      });
    }
    if (!value || typeof value !== "object") return;
    const obj = value as Record<string, unknown>;
    if (typeof obj.src === "string" && typeof obj.alt === "string" && !("kind" in obj && obj.kind === "iframe")) {
      refs.push({ src: obj.src, alt: obj.alt, where: path });
      if (typeof obj.srcOnDark === "string") refs.push({ src: obj.srcOnDark, alt: `${obj.alt || "logo"} (for dark backgrounds)`, where: `${path}.srcOnDark` });
      return;
    }
    for (const [k, v] of Object.entries(obj)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(site, "");
  return refs;
}

/** `[[Add: …]]` marks content still to come. Rendered as a visible prompt; blocks a live build. */
export const PLACEHOLDER = /\[\[(.+?)\]\]/g;

/** Every placeholder in a site config, with where it is. */
export function collectPlaceholders(site: Site): { text: string; where: string }[] {
  const found: { text: string; where: string }[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      for (const m of value.matchAll(PLACEHOLDER)) found.push({ text: m[1]!, where: path });
      return;
    }
    if (Array.isArray(value)) {
      return value.forEach((v, i) => {
        const slug = v && typeof v === "object" && typeof (v as { slug?: unknown }).slug === "string" ? (v as { slug: string }).slug : undefined;
        walk(v, `${path}[${slug ?? i}]`);
      });
    }
    if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(site, "");
  return found;
}
