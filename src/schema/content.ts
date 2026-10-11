import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";
import { Page, type SiteInput } from "./site-schema";
import { SiteConfigError } from "./define";

/** Every YAML file a site's content is read from: site.yaml plus its listed pages. */
export function contentFiles(dir: string): string[] {
  const sitePath = join(dir, "site.yaml");
  if (!existsSync(sitePath)) return [];
  const raw = parse(readFileSync(sitePath, "utf8")) as { pages?: unknown };
  const names = Array.isArray(raw?.pages) ? raw.pages.filter((p): p is string => typeof p === "string") : [];
  return [sitePath, ...names.map((n) => join(dir, "pages", `${n}.yaml`))];
}

function readYaml(dir: string, file: string, label: string): unknown {
  const path = join(dir, file);
  if (!existsSync(path)) throw new SiteConfigError(label, `✖ ${file}: file not found (listed in site.yaml → pages)`);
  let data: unknown;
  try {
    data = parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new SiteConfigError(label, `✖ ${file}: ${(e as Error).message}`);
  }
  const split = splitValues(data);
  if (split.length) {
    throw new SiteConfigError(
      label,
      split.map((s) => `✖ ${file} → ${s}: an unquoted comma split this text. In a one-line { … } item, put text containing commas in quotes.`).join("\n"),
    );
  }
  return data;
}

/**
 * `{ title: 412 Mill Street, alley entrance }` parses as title "412 Mill Street" plus a key
 * "alley entrance" with no value, and the schema would silently drop it. No real field name has
 * a space in it, so a key with a space means a value was split.
 */
function splitValues(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => splitValues(v, `${path}[${i}]`));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([k, v]) =>
    /\s/.test(k) && (v === null || v === undefined) ? [`${path}${path ? "." : ""}"${k}"`] : splitValues(v, `${path}${path ? "." : ""}${k}`),
  );
}

/**
 * Reads a site's content from YAML, for `defineSite()`:
 *
 *   src/sites/<id>/site.yaml         everything except pages, plus `pages: [home, about, …]`
 *   src/sites/<id>/pages/<name>.yaml one page each, in the order site.yaml lists them
 *
 * Each page is checked against the Page schema first so errors name their file; the whole
 * site is then checked again by `defineSite()`. Page files not listed in site.yaml are ignored
 * (handy for drafts).
 *
 *   export default defineSite(loadContent(import.meta.url), { custom: { … } });
 */
export function loadContent(configUrl: string): SiteInput {
  const dir = fileURLToPath(new URL(".", configUrl));
  const id = dir.split("/").filter(Boolean).at(-1) ?? "site";
  const site = readYaml(dir, "site.yaml", id) as Record<string, unknown> | null;
  if (!site || typeof site !== "object") throw new SiteConfigError(id, "✖ site.yaml: expected a mapping");
  if (!Array.isArray(site.pages) || !site.pages.every((p) => typeof p === "string")) {
    throw new SiteConfigError(id, "✖ site.yaml → pages: expected a list of page file names, e.g. [home, about]");
  }

  const problems: string[] = [];
  const pages = (site.pages as string[]).map((name) => {
    const file = `pages/${name}.yaml`;
    const page = readYaml(dir, file, id);
    const result = Page.safeParse(page);
    if (!result.success) problems.push(`${file}\n${z.prettifyError(result.error)}`);
    return page;
  });
  if (problems.length) throw new SiteConfigError(String(site.name ?? id), problems.join("\n\n"));

  return { ...site, pages } as SiteInput;
}
