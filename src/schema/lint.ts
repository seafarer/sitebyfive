import type { Block, Site } from "./site-schema";
import { presets, resolveTheme } from "../theme/presets";
import { surfaces } from "../theme/tokens";
import { isDark } from "../theme/color";

/**
 * Opinionated checks. These never fail the build (rule 6); they print as warnings.
 * Real breakage is caught by the Zod schema instead.
 */
export interface LintWarning {
  where: string;
  message: string;
}

const FILE_EXT = /\.[a-z0-9]{2,5}$/i;

export function lintSite(site: Site, opts: { publicFileExists?: (path: string) => boolean } = {}): LintWarning[] {
  const out: LintWarning[] = [];
  const warn = (where: string, message: string) => out.push({ where, message });

  if (site.nav.items.length > 6) warn("nav.items", `${site.nav.items.length} items; more than 6 means the IA is wrong, not the nav.`);
  if ((site.footer.columns?.length ?? 0) > 4) warn("footer.columns", "more than 4 columns.");

  // A wordmark is usually dark lettering; on a dark footer it disappears without a light version.
  const footerLogo = site.footer.logo ?? site.nav.logo;
  const theme = resolveTheme(site.theme);
  if (footerLogo?.kind === "wordmark" && !footerLogo.srcOnDark && isDark(surfaces(theme)[presets[theme.preset].footerTone].bg)) {
    warn(site.footer.logo ? "footer.logo" : "nav.logo", "wordmark on a dark footer with no srcOnDark; add a light version so it stays readable.");
  }

  const routes = new Set(site.pages.map((p) => p.slug));
  const postsBase = site.posts?.enabled ? site.posts.basePath : undefined;
  const anchorsBySlug = new Map(site.pages.map((p) => [p.slug, new Set(p.blocks.map((b) => b.id).filter(Boolean))]));

  const checkHref = (where: string, href: string, fromSlug?: string) => {
    if (/^(https?:|mailto:|tel:|sms:)/.test(href)) return;
    const [path, hash] = href.split("#") as [string, string | undefined];
    const target = path === "" ? fromSlug : path.replace(/\/$/, "") || "/";
    if (path !== "" && FILE_EXT.test(path)) {
      // Downloads live in the site's public/ folder.
      if (opts.publicFileExists && !opts.publicFileExists(path)) warn(where, `links to "${path}" but the file is not in public/.`);
      return;
    }
    if (!target) return;
    const isPost = postsBase && (target === postsBase || target.startsWith(`${postsBase}/`));
    if (!routes.has(target) && !isPost) {
      warn(where, `links to "${href}" but no page has slug "${target}".`);
      return;
    }
    if (hash && !isPost && !anchorsBySlug.get(target)?.has(hash)) {
      warn(where, `links to "${href}" but no block on "${target}" has id "${hash}".`);
    }
  };

  // Chrome links resolve from any page, so in-page anchors must name a page explicitly.
  site.nav.items.forEach((l, i) => checkHref(`nav.items[${i}]`, l.href, "/"));
  if (site.nav.cta) checkHref("nav.cta", site.nav.cta.href, "/");
  if (site.announcement?.variant === "bar" && site.announcement.link) checkHref("announcement.link", site.announcement.link.href, "/");
  site.footer.columns?.forEach((c, ci) =>
    c.lines.forEach((l, li) => typeof l !== "string" && checkHref(`footer.columns[${ci}].lines[${li}]`, l.href, "/")),
  );

  for (const page of site.pages) {
    const at = (i: number, b: Block) => `${page.slug} › blocks[${i}] (${b.type}${"variant" in b ? `:${b.variant}` : ""})`;
    const ids = new Set<string>();
    const openers = page.blocks.filter((b) => b.type === "hero" || b.type === "pageHeader");

    if (openers.length > 1) warn(page.slug, "more than one hero/pageHeader; each renders an h1.");
    const first = page.blocks[0];
    if (first && first.type !== "hero" && first.type !== "pageHeader") {
      warn(page.slug, "does not start with a hero or pageHeader; a visually hidden h1 is added from the page title.");
    }

    const navStyle = page.chrome && page.chrome.nav ? page.chrome.nav.style : undefined;
    if ((navStyle ?? site.nav.style) === "transparent") {
      const ok = first && ((first.type === "hero" && first.variant === "full-bleed" && first.image) || first.tone === "inverse" || first.tone === "accent");
      if (!ok) warn(page.slug, "transparent nav needs a full-bleed hero with an image or an inverse/accent first block; rendering solid.");
    }

    page.blocks.forEach((b, i) => {
      const where = at(i, b);
      if (b.id) {
        if (ids.has(b.id)) warn(where, `duplicate id "${b.id}" on this page.`);
        ids.add(b.id);
      }
      if (b.link) checkHref(`${where}.link`, b.link.href, page.slug);

      switch (b.type) {
        case "hero":
          if ((b.ctas?.length ?? 0) > 2) warn(where, "more than 2 CTAs dilutes the ask.");
          b.ctas?.forEach((c, j) => checkHref(`${where}.ctas[${j}]`, c.href, page.slug));
          if (b.variant !== "text-only" && !b.image) warn(where, `"${b.variant}" has no image; renders as text-only.`);
          break;
        case "pageHeader":
          if (b.variant === "with-image" && !b.image) warn(where, "with-image has no image; renders as simple.");
          break;
        case "cards":
          if (b.variant === "image" && b.items.some((it) => !it.image)) warn(where, "an item lacks an image; renders as numbered.");
          if (b.variant === "icon" && b.items.some((it) => !it.icon)) warn(where, "an item lacks an icon; renders as numbered.");
          b.items.forEach((it, j) => it.link && checkHref(`${where}.items[${j}].link`, it.link.href, page.slug));
          break;
        case "featureRows":
          if (b.items.length > 4) warn(where, `${b.items.length} rows; feature rows are for 2–4 things.`);
          b.items.forEach((it, j) => it.link && checkHref(`${where}.items[${j}].link`, it.link.href, page.slug));
          break;
        case "features":
          if (b.items.length > 12) warn(where, `${b.items.length} points; more than 12 stops being scannable.`);
          if (b.variant !== "grid" && b.columns !== 3) warn(where, `columns only applies to the grid variant.`);
          break;
        case "quote":
          if (b.variant === "single" && b.items.length > 1) warn(where, "single shows only the first quote.");
          if (b.variant === "grid" && b.items.length > 3) warn(where, "grid is for 2–3 testimonials.");
          break;
        case "stats":
          if (b.items.length < 2 || b.items.length > 4) warn(where, `${b.items.length} stats; 2–4 reads best.`);
          break;
        case "pricing":
          if (b.variant === "tiers" && b.items.length > 3) warn(where, "tiers is for 2–3 options; consider list.");
          if (b.variant === "list" && b.items.some((it) => it.features?.length)) warn(where, "features are ignored in list.");
          break;
        case "gallery":
          if (b.variant === "cluster" && b.images.length !== 3) warn(where, `cluster expects 3 images, got ${b.images.length}; ${b.images.length < 3 ? "renders as grid" : "extra images are ignored"}.`);
          if (b.images.length === 0) warn(where, "no images; the block is omitted.");
          break;
        case "cta":
          if ((b.ctas?.length ?? 0) > 2) warn(where, "more than 2 CTAs dilutes the ask.");
          if ((b.images?.length ?? 0) > 3) warn(where, "only the first 3 images render.");
          if (b.variant === "with-images" && !b.images?.length) warn(where, "with-images has no images; renders as simple.");
          b.ctas?.forEach((c, j) => checkHref(`${where}.ctas[${j}]`, c.href, page.slug));
          break;
        case "linkList":
          b.items.forEach((it, j) => checkHref(`${where}.items[${j}]`, it.href, page.slug));
          break;
        case "contact":
          if (b.form?.action === "/api/contact" && !b.id) warn(where, "add an id so the form can return to this section after sending.");
          break;
      }
    });
  }

  return out;
}

export function formatWarnings(siteName: string, warnings: LintWarning[]): string {
  if (!warnings.length) return `✓ ${siteName}: no lint warnings`;
  return [`⚠ ${siteName}: ${warnings.length} lint warning(s)`, ...warnings.map((w) => `  · ${w.where}: ${w.message}`)].join("\n");
}
