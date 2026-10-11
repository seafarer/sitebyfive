/**
 * Site discovery shared by the build, fixtures, and scaffold scripts.
 * A site is any folder in src/sites/ with a config.ts. Configs load through jiti, so they're
 * validated by the same defineSite() the Astro build uses.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createJiti } from "jiti";

export const root = new URL("..", import.meta.url).pathname;
export const sitesDir = `${root}src/sites`;
export const platform = JSON.parse(readFileSync(`${root}platform.json`, "utf8"));

/** Folder names of every site, sorted. */
export function siteIds() {
  return readdirSync(sitesDir)
    .filter((d) => existsSync(`${sitesDir}/${d}/config.ts`))
    .sort();
}

const jiti = createJiti(import.meta.url, { moduleCache: false });

/** The parsed site (after defineSite validation). */
export async function loadSite(id) {
  const mod = await jiti.import(`${sitesDir}/${id}/config.ts`);
  return (mod.default ?? mod).site;
}

/** Hostnames a site answers to: <id>.<baseDomain>, <id>.localhost (local dev), and its url's host. */
export function hostsFor(id, site) {
  const own = new URL(site.url).hostname;
  return [...new Set([`${id}.${platform.baseDomain}`, `${id}.localhost`, own])];
}
