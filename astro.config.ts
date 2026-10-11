// @ts-check
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig, fontProviders } from "astro/config";
import type { AstroUserConfig } from "astro";
import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { Preset as PresetSchema } from "./src/schema/site-schema";
import type { DefinedSite } from "./src/schema/define";
import { lintSite, formatWarnings } from "./src/schema/lint";
import { contentFiles } from "./src/schema/content";
import { collectImageRefs, collectPlaceholders, prepareSite, type BuildOptions } from "./src/schema/prepare";
import { presets, resolveTheme, fontVar, type FontDef } from "./src/theme/presets";
import { contrastReport } from "./src/theme/tokens";

const root = fileURLToPath(new URL(".", import.meta.url));
const sitesDir = `${root}src/sites`;
const available = readdirSync(sitesDir).filter((d: string) => existsSync(`${sitesDir}/${d}/config.ts`));

const siteId = process.env.SITE ?? "lattice";
if (!available.includes(siteId)) {
  throw new Error(`SITE="${siteId}" not found. Available: ${available.join(", ")}`);
}

const opts: BuildOptions = {
  site: siteId,
  preset: process.env.PRESET ? PresetSchema.parse(process.env.PRESET) : undefined,
  noImages: process.env.NO_IMAGES === "1",
};

const isBuild = process.argv.includes("build");

const mod: { default: DefinedSite } = await import(
  `./src/sites/${siteId}/config.ts`
);
const site = prepareSite(mod.default.site, opts);
// Only a live site is strict: preview and draft builds render missing images and placeholders as prompts.
const strict = isBuild && site.status === "live";
const allowMissing = !strict || process.env.ALLOW_MISSING_IMAGES === "1";
const label = `${site.name}${opts.preset ? ` [PRESET=${opts.preset}]` : ""}${opts.noImages ? " [NO_IMAGES]" : ""}`;

// Per-site public folder (favicon, downloads), falling back to the shared one.
const sitePublic = `${sitesDir}/${siteId}/public`;
const publicDir = existsSync(sitePublic) ? sitePublic : `${root}public`;

// Lint (warnings only) and theme contrast.
const lint = lintSite(site, { publicFileExists: (p) => existsSync(`${publicDir}${decodeURI(p)}`) });
// The showcase stacks heroes on purpose; summarise instead of listing every page.
console.log(`\n${siteId === "showcase" ? `${lint.length ? "⚠" : "✓"} ${label}: ${lint.length} lint warning(s) (showcase, expected)` : formatWarnings(label, lint)}`);
const contrastIssues = contrastReport(resolveTheme(site.theme));
if (contrastIssues.length) console.log(`⚠ contrast:\n  · ${contrastIssues.join("\n  · ")}`);

// Placeholders: [[Add: …]] prompts. Summarised here, listed in TO-FILL.md; a live build refuses them.
const placeholders = collectPlaceholders(site);
writeToFill(placeholders);
if (placeholders.length) {
  const byFile = new Map<string, number>();
  for (const p of placeholders) byFile.set(fileOf(p.where), (byFile.get(fileOf(p.where)) ?? 0) + 1);
  const summary = [...byFile].map(([f, n]) => `${f} ${n}`).join(" · ");
  const msg = `${placeholders.length} placeholder(s) still to fill (${summary}). Full list: src/sites/${siteId}/TO-FILL.md`;
  if (strict && process.env.ALLOW_PLACEHOLDERS !== "1") throw new Error(`${msg}\nFill them in, or set status: preview in site.yaml.`);
  console.log(`✎ ${msg}`);
}

/** Which content file a config path lives in: pages[/about]... → pages/about.yaml (by slug), else site.yaml. */
function fileOf(where: string): string {
  const m = /^pages\[(.+?)\]/.exec(where);
  if (!m) return "site.yaml";
  const name = m[1] === "/" ? "home" : m[1]!.replace(/^\//, "").replace(/\//g, "-");
  return `pages/${name}.yaml`;
}

/** src/sites/<id>/TO-FILL.md: every prompt still in the content, grouped by file. Removed when none are left. */
function writeToFill(found: { text: string; where: string }[]) {
  const file = `${sitesDir}/${siteId}/TO-FILL.md`;
  if (opts.preset || opts.noImages || process.env.OUT_DIR) return;
  if (!found.length) return rmSync(file, { force: true });
  const groups = new Map<string, typeof found>();
  for (const p of found) groups.set(fileOf(p.where), [...(groups.get(fileOf(p.where)) ?? []), p]);
  const sections = [...groups].map(([f, items]) => `## ${f}\n\n${items.map((p) => `- [ ] ${p.text.replace(/^Add:\s*/, "")}  \n  \`${p.where}\``).join("\n")}`);
  writeFileSync(file, `# To fill: ${site.name}\n\nGenerated from the \`[[Add: …]]\` prompts in the content. Replace each prompt in the file shown; this list disappears when none are left. A live build refuses prompts.\n\n${sections.join("\n\n")}\n`);
}

// Missing images: placeholders in dev and preview; a live build fails unless ALLOW_MISSING_IMAGES=1.
const postsDir = `${sitesDir}/${siteId}/posts`;
const postImageRefs =
  site.posts?.enabled && !opts.noImages && existsSync(postsDir)
    ? readdirSync(postsDir)
        .filter((f: string) => f.endsWith(".md"))
        .flatMap((f: string) => {
          const m = /^image:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(readFileSync(`${postsDir}/${f}`, "utf8"));
          const alt = /^imageAlt:\s*["']?(.+?)["']?\s*$/m.exec(readFileSync(`${postsDir}/${f}`, "utf8"))?.[1] ?? "";
          return m?.[1] ? [{ src: m[1], alt, where: `posts/${f}` }] : [];
        })
    : [];
const missing = [...collectImageRefs(site), ...postImageRefs].filter((r) => !existsSync(`${sitesDir}/${siteId}/assets/${r.src}`));
writeMissingReport(missing);
if (missing.length) {
  const list = missing.map((m) => `  · ${m.src}  (${m.where})`).join("\n");
  const msg = `${missing.length} missing image(s) in src/sites/${siteId}/assets/:\n${list}`;
  if (!allowMissing) throw new Error(`${msg}\nAdd the files, set status: preview in site.yaml, or build with ALLOW_MISSING_IMAGES=1.`);
  console.log(`⚠ ${msg}\n  (rendering placeholders)`);
}

/** src/sites/<id>/MISSING-IMAGES.md: what to shoot or find, with sizes. Removed when complete. */
function writeMissingReport(refs: { src: string; alt: string; where: string }[]) {
  const file = `${sitesDir}/${siteId}/MISSING-IMAGES.md`;
  if (opts.preset || opts.noImages || process.env.OUT_DIR) return;
  if (!refs.length) return rmSync(file, { force: true });
  const unique = [...new Map(refs.map((r) => [r.src, r])).values()];
  const blockAt = (where: string) => {
    const m = /^pages\[(.+?)\]\.blocks\[(\d+)\]/.exec(where);
    const b = m ? site.pages.find((p) => p.slug === m[1])?.blocks[Number(m[2])] : undefined;
    return b ? `${b.type}${"variant" in b ? `:${b.variant}` : ""}` : where.startsWith("posts/") ? "post" : where.split(".")[0];
  };
  const hint = (kind: string, where: string): string => {
    if (kind.startsWith("team")) return "4:5 portrait, ≥ 900 tall, consistent backdrop";
    if (where.includes("photo")) return "square, ≥ 600×600, face centred";
    if (kind.startsWith("hero:full-bleed")) return "16:9 landscape, ≥ 2400 wide, quiet area for text lower-left";
    if (kind.startsWith("hero:split")) return "4:5 portrait, ≥ 1400 tall";
    if (kind.startsWith("hero:contained") || kind.startsWith("pageHeader")) return "21:9 panorama, ≥ 2400 wide";
    if (kind.startsWith("team")) return "4:5 portrait, ≥ 900 tall, consistent backdrop";
    if (kind.startsWith("gallery:masonry")) return "any aspect, ≥ 1200 on the long side";
    if (kind.startsWith("events")) return "16:10, ≥ 1200 wide";
    if (kind === "post" || kind === "ogImage") return "16:9, ≥ 2000 wide (also used as the share image)";
    if (kind.startsWith("logos")) return "SVG preferred, single colour";
    return "4:3 landscape, ≥ 1600 wide";
  };
  const rows = unique.map((r) => {
    const kind = blockAt(r.where) ?? "";
    return `| \`${r.src}\` | ${r.alt || "(decorative)"} | ${kind} | ${hint(kind, r.where)} |`;
  });
  writeFileSync(
    file,
    `# Missing images: ${site.name}\n\nGenerated by the build. Drop files into \`src/sites/${siteId}/assets/\` at these paths; this file disappears when nothing is missing.\nJPG or WebP for photos. Larger is fine: the build resizes and converts.\n\n| File | What it shows (alt text) | Used in | Size and crop |\n|---|---|---|---|\n${rows.join("\n")}\n`,
  );
}

// Fonts: the site's theme, or every preset's fonts for the showcase.
const families = new Map<string, FontDef>();
const addFonts = (preset: keyof typeof presets, theme = site.theme) => {
  const t = resolveTheme({ ...theme, preset });
  families.set(t.fonts.heading.name, t.fonts.heading);
  families.set(t.fonts.body.name, t.fonts.body);
};
addFonts(site.theme.preset);
if (mod.default.pagePresets) for (const p of PresetSchema.options) addFonts(p, { preset: p });

/**
 * config.ts reads its YAML from disk. Pin its `import.meta.url` (bundling moves the code) and
 * register the YAML files as its dependencies so edits reload in dev.
 */
function siteContent(): Plugin {
  const config = `${sitesDir}/${siteId}/config.ts`;
  return {
    name: "site-content",
    transform(code, id) {
      if (id.split("?")[0] !== config) return;
      for (const file of contentFiles(`${sitesDir}/${siteId}`)) this.addWatchFile(file);
      return { code: code.replaceAll("import.meta.url", JSON.stringify(pathToFileURL(config).href)), map: null };
    },
  };
}

export default defineConfig({
  site: site.url,
  outDir: process.env.OUT_DIR ?? `./dist/${siteId}`,
  publicDir,
  trailingSlash: "ignore",
  build: { format: "directory" },
  fonts: [...families.values()].map((f) => ({
    provider: fontProviders.fontsource(),
    name: f.name,
    cssVariable: fontVar(f.name) as `--${string}`,
    weights: ["400", "500", "600", "700", "800"],
    styles: ["normal", "italic"] as ("normal" | "italic")[],
    fallbacks: f.fallbacks,
  })) as unknown as AstroUserConfig["fonts"], // families are computed per site, so the literal types can't be inferred
  vite: {
    plugins: [tailwindcss(), siteContent()],
    resolve: { alias: { "@site": `${sitesDir}/${siteId}` } },
    define: { __BUILD__: JSON.stringify({ ...opts, allowMissing }) },
  },
});
