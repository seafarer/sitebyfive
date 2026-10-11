#!/usr/bin/env node
/**
 * Generates JSON Schemas from src/schema/site-schema.ts for editor support in the YAML content
 * files (autocomplete, hover docs, inline errors). Wired up in .vscode/settings.json.
 * The Zod schema stays the source of truth and still validates at build. Run: npm run docs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";

const { Site, Page } = await import("../src/schema/site-schema.ts");

// Block descriptions from the schema's doc comments (same source as docs/blocks.md).
const src = readFileSync("src/schema/site-schema.ts", "utf8");
const re = /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*export const \w+ = Section\.extend\(\{\s*type: z\.literal\("(\w+)"\)/g;
const blockDocs = new Map(
  [...src.matchAll(re)].map(([, doc, type]) => [
    type,
    doc.split("\n").map((l) => l.replace(/^\s*\* ?/, "")).join("\n").trim(),
  ]),
);

function describeBlocks(node) {
  if (Array.isArray(node)) return node.forEach(describeBlocks);
  if (!node || typeof node !== "object") return;
  const type = node.properties?.type?.const;
  if (typeof type === "string" && blockDocs.has(type) && !node.description) {
    node.description = blockDocs.get(type);
    node.markdownDescription = blockDocs.get(type);
  }
  Object.values(node).forEach(describeBlocks);
}

// Zod drops unknown keys silently; in the editor, flag them so a typo like `heding:` shows up.
function closeObjects(node) {
  if (Array.isArray(node)) return node.forEach(closeObjects);
  if (!node || typeof node !== "object") return;
  if (node.type === "object" && node.properties && !("additionalProperties" in node)) node.additionalProperties = false;
  Object.values(node).forEach(closeObjects);
}

const opts = { io: "input", unrepresentable: "any", target: "draft-2020-12" };

const page = z.toJSONSchema(Page, opts);
describeBlocks(page);
closeObjects(page);
page.title = "Page (src/sites/<id>/pages/<name>.yaml)";

const siteFile = Site.omit({ pages: true }).extend({
  pages: z
    .array(z.string().regex(/^[a-z0-9-]+$/))
    .min(1)
    .describe("Page files to build, in order: names from pages/ without .yaml, e.g. [home, about, contact]."),
});
const site = z.toJSONSchema(siteFile, opts);
closeObjects(site);
site.title = "Site (src/sites/<id>/site.yaml)";

mkdirSync("schemas", { recursive: true });
writeFileSync("schemas/page.schema.json", `${JSON.stringify(page, null, 2)}\n`);
writeFileSync("schemas/site.schema.json", `${JSON.stringify(site, null, 2)}\n`);
console.log(`Wrote schemas/page.schema.json and schemas/site.schema.json (${blockDocs.size} block descriptions)`);
