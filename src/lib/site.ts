import defined from "@site/config";
import type { Page, Preset } from "../schema/site-schema";
import { prepareSite } from "../schema/prepare";
import { resolveTheme, type ResolvedTheme } from "../theme/presets";

/** Build switches injected by astro.config.ts (SITE, PRESET, NO_IMAGES). */
export const build = __BUILD__;

/** The current site, parsed and with build switches applied. */
export const site = prepareSite(defined.site, build);

/** Custom block prop schemas registered by the site. */
export const customSchemas = defined.custom;

/** Showcase only: per-page preset, so one build can show every preset. */
const pagePresets: Record<string, Preset> = defined.pagePresets ?? {};

export function themeForPage(slug: string): ResolvedTheme {
  const preset = pagePresets[slug];
  return resolveTheme(preset ? { preset } : site.theme);
}

export function findPage(slug: string): Page | undefined {
  return site.pages.find((p) => p.slug === slug);
}

/** Absolute URL for a path on this site. */
export const absolute = (path: string) => new URL(path, site.url).toString();

/** localStorage key for a dismissible announcement, tied to its text so a new one reappears. */
export function announcementKey(): string | undefined {
  const a = site.announcement;
  if (a?.variant !== "bar" || !a.dismissible) return undefined;
  return `ann:${[...a.text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)}`;
}
