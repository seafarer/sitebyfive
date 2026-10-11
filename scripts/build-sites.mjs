#!/usr/bin/env node
/**
 * Builds every deployable site for the one-Worker setup (wrangler.jsonc):
 *   dist/sites/<id>/               each site whose status isn't draft
 *   worker/sites.generated.json    hostname → site, read by worker/index.ts
 *
 *   npm run build:sites                    # all sites
 *   npm run build:sites -- acme lattice    # rebuild just these (others keep their last build)
 * Then: npx wrangler deploy
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostsFor, loadSite, platform, root, siteIds } from "./sites.mjs";

const only = process.argv.slice(2);
const entries = [];
const failed = [];

for (const id of siteIds()) {
  const site = await loadSite(id);
  if (site.status === "draft") {
    console.log(`· ${id.padEnd(14)} draft, skipped`);
    continue;
  }
  entries.push({ slug: id, name: site.name, status: site.status, hosts: hostsFor(id, site), ...(site.redirects ? { redirects: site.redirects } : {}), ...(site.formsTo ? { formsTo: site.formsTo } : {}) });
  const outDir = `${root}dist/sites/${id}`;
  if (only.length && !only.includes(id)) {
    if (!existsSync(outDir)) console.log(`⚠ ${id} has never been built; run without arguments to include it.`);
    continue;
  }
  rmSync(outDir, { recursive: true, force: true });
  const started = Date.now();
  const r = spawnSync("npx", ["astro", "build"], { cwd: root, env: { ...process.env, SITE: id, OUT_DIR: outDir }, encoding: "utf8" });
  if (r.status !== 0) {
    failed.push(id);
    console.log(`✖ ${id}\n${(r.stderr || r.stdout).split("\n").slice(-25).join("\n")}`);
    continue;
  }
  console.log(`✓ ${id.padEnd(14)} ${site.status.padEnd(8)} ${hostsFor(id, site)[0]}  ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

// A site at www.<host> also gets its bare domain, redirected to www. Retired sites (retired.json:
// old id → URL) send their whole subdomain to one URL.
const retired = JSON.parse(readFileSync(`${root}scripts/retired.json`, "utf8"));
delete retired.$comment;
const redirects = {
  ...Object.fromEntries(Object.entries(retired).map(([id, to]) => [`${id}.${platform.baseDomain}`, to])),
  ...Object.fromEntries(
    entries.flatMap((e) => e.hosts.filter((h) => h.startsWith("www.") && !h.endsWith(".localhost")).map((h) => [h.slice(4), h])),
  ),
};
mkdirSync(`${root}worker`, { recursive: true });
writeFileSync(`${root}worker/sites.generated.json`, `${JSON.stringify({ sites: entries, redirects }, null, 2)}\n`);
console.log(`\nworker/sites.generated.json: ${entries.length} site(s)`);
if (failed.length) {
  console.log(`\n${failed.length} site(s) failed: ${failed.join(", ")}`);
  process.exit(1);
}
