#!/usr/bin/env node
/**
 * Scaffolds a new site from a market template.
 *
 *   npm run new -- <id> --market <market> [--preset <preset>] [--name "Display Name"] [--url https://…]
 *
 * Creates src/sites/<id>/ (site.yaml, pages/, config.ts, assets/, public/favicon.svg) with
 * status: preview and [[Add: …]] prompts, then validates it against the schema. The site is served
 * at <id>.<baseDomain> after the next `npm run build:sites` and deploy. No Cloudflare changes needed.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createJiti } from "jiti";
import { loadSite, platform, root, sitesDir } from "./sites.mjs";

// Default preset: whatever the market's demo uses (templates/markets.json).
const marketInfo = JSON.parse(readFileSync(`${root}templates/markets.json`, "utf8"));
const demoPreset = (market) => {
  const demo = marketInfo[market]?.demo;
  const file = demo && `${sitesDir}/${demo}/site.yaml`;
  return file && existsSync(file) ? /^\s+preset:\s*(\w+)/m.exec(readFileSync(file, "utf8"))?.[1] : undefined;
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const id = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const markets = readdirSync(`${root}templates`).filter((d) => statSync(`${root}templates/${d}`).isDirectory());

function fail(message) {
  console.error(`✖ ${message}\n\nUsage: npm run new -- <id> --market <${markets.join("|")}> [--preset <preset>] [--name "Name"] [--url https://…]`);
  process.exit(1);
}

if (!id) fail("Missing site id (the folder name and subdomain), e.g. acme-school.");
if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(id)) fail(`"${id}" isn't a valid id: lowercase letters, numbers, and hyphens.`);
if (existsSync(`${sitesDir}/${id}`)) fail(`src/sites/${id} already exists.`);
const market = flag("market");
if (!market || !markets.includes(market)) fail(`--market must be one of: ${markets.join(", ")}.`);

const jiti = createJiti(import.meta.url);
const { presets, resolveTheme } = await jiti.import(`${root}src/theme/presets.ts`);
const preset = flag("preset") ?? demoPreset(market) ?? "muted";
if (!(preset in presets)) fail(`--preset must be one of: ${Object.keys(presets).join(", ")}.`);
const name = flag("name") ?? id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const url = flag("url") ?? `https://${id}.${platform.baseDomain}`;

// Tokens appear inside double-quoted YAML strings, so escape for that context.
const yamlSafe = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const tokens = { name: yamlSafe(name), id, url, preset };
const fill = (text) => text.replace(/\{\{(\w+)\}\}/g, (m, k) => tokens[k] ?? m);

const dir = `${sitesDir}/${id}`;
cpSync(`${root}templates/${market}`, dir, { recursive: true });
for (const file of [`${dir}/site.yaml`, ...readdirSync(`${dir}/pages`).map((f) => `${dir}/pages/${f}`)]) {
  writeFileSync(file, fill(readFileSync(file, "utf8")));
}
writeFileSync(
  `${dir}/config.ts`,
  `import { defineSite } from "../../schema/define";
import { loadContent } from "../../schema/content";

/** Content lives in site.yaml and pages/*.yaml. */
export default defineSite(loadContent(import.meta.url));
`,
);
mkdirSync(`${dir}/assets`, { recursive: true });
writeFileSync(`${dir}/assets/.gitkeep`, "");
mkdirSync(`${dir}/public`, { recursive: true });
const color = resolveTheme({ preset }).colors.primary;
const initial = name.trim()[0]?.toUpperCase() ?? "S";
writeFileSync(
  `${dir}/public/favicon.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${color}"/><text x="16" y="22.5" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#fff">${initial}</text></svg>\n`,
);
if (existsSync(`${root}templates/${market}/posts`)) mkdirSync(`${dir}/posts`, { recursive: true });

// Validate with the same defineSite() the build uses.
let site;
try {
  site = await loadSite(id);
} catch (error) {
  rmSync(dir, { recursive: true, force: true });
  fail(`The ${market} template doesn't pass the schema (nothing was created):\n${error.message}`);
}

const pages = site.pages.map((p) => p.slug);
console.log(`✓ Created src/sites/${id}/  (${market}, ${preset} preset, status: preview)

  Pages:    ${pages.join(", ")}
  Preview:  https://${id}.${platform.baseDomain} after \`npm run deploy\`

Next:
  1. SITE=${id} npm run dev            prompts show as highlighted [[Add: …]] marks
  2. Fill in site.yaml and pages/*.yaml; the startup log lists every prompt left
  3. Add photos to assets/ (MISSING-IMAGES.md is the shot list) and a logo (nav.logo)
  4. Set formsTo in site.yaml (verify it in Cloudflare Email Routing)
  5. When nothing is left: status: live, then npm run deploy`);
