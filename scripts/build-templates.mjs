#!/usr/bin/env node
/**
 * Generates templates/<market>/ from each market's demo site (templates/markets.json), so a
 * template is always the demo's structure with the content swapped for [[Add: …]] prompts.
 *
 *   npm run templates              # every market
 *   npm run templates -- school    # one market
 *
 * Kept as-is: block types, variants, tones, ids, slugs, links and their labels, nav, form fields,
 * image paths, page chrome. Links that are the client's own details (tel:, mailto:, and demo-only
 * `.example` hosts such as a booking page) become prompts, so a demo's phone number never ships. Becomes a prompt (with the demo's wording as an example when short):
 * headings, body copy, names, prices, alt text, and other content. Dropped: quote, stats, logos,
 * embed, and custom blocks (proof and one-offs are added only when real content supports them),
 * event entries (dates can't be prompts), logo, social links, announcement, brand colours.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Document, isScalar, isCollection, visit } from "yaml";
import { parse } from "yaml";
import { root, sitesDir } from "./sites.mjs";

const markets = JSON.parse(readFileSync(`${root}templates/markets.json`, "utf8"));
delete markets.$comment;
const only = process.argv.slice(2);

const DROP_BLOCKS = new Set(["quote", "stats", "logos", "embed", "custom"]);
/** Values that are structure, not content. */
const KEEP = new Set([
  "type", "variant", "columns", "tone", "id", "slug", "href", "style", "icon", "imageSide", "startSide", "kind",
  "required", "featured", "layout", "sticky", "width", "breadcrumbs", "src", "focal", "external", "align", "action",
  "enabled", "basePath", "index", "minimal", "announcement", "footer", "submitLabel",
]);
const HINT = {
  heading: "heading", body: "body text", intro: "intro", eyebrow: "eyebrow", title: "title", subtitle: "subtitle",
  alt: "describe the photo", q: "question", a: "answer", role: "role", bio: "bio", description: "description",
  price: "price", unit: "unit", meta: "short supporting line", note: "note", details: "details", successText: "thank-you message",
  emptyText: "text shown when nothing is listed", lines: "footer line", openingHours: "opening hours, e.g. Mo-Fr 09:00-17:00", blurb: "one or two sentences about the organisation", label: "label",
  text: "text", hours: "hours", address: "address", phone: "phone", email: "public email", street: "street",
  locality: "town", region: "state", postalCode: "postal code", country: "country code", legalName: "legal name",
  areaServed: "town or area you serve", tag: "short status", href: "link (phone, email, or booking page)",
};

/** A link to the demo's own contact details or a demo-only site: the client must supply their own. */
const clientHref = (href) => /^(tel:|mailto:)/.test(href) || /^https?:\/\/[^/]*\.example(\/|$)/.test(href);

const words = (s) => s.trim().split(/\s+/).length;
function prompt(key, value) {
  const hint = HINT[key] ?? key;
  const flat = value.replace(/\s+/g, " ").trim();
  // Alt text is the shot list, so it always keeps the demo's full description.
  if ((flat.length <= 70 || key === "alt") && !flat.includes("[[")) return `[[Add: ${hint}, e.g. "${flat.replace(/"/g, "'")}"]]`;
  return `[[Add: ${hint}, about ${Math.max(5, Math.round(words(flat) / 5) * 5)} words]]`;
}

/** Content → prompts, recursively. `key` is the property holding `value`. */
let demoId = "";
function strip(value, key, ctx = {}) {
  if (typeof value === "string") {
    if (key === "href" && clientHref(value)) return prompt("href", value);
    // Structure stays; anchors named after the demo (#why-puddlejump) take the new site's id.
    if (KEEP.has(key)) return demoId ? value.replaceAll(demoId, "{{id}}") : value;
    // Form-field labels are UI; nav and footer link labels are structure. Labels inside blocks are content.
    if (key === "label" && (ctx.field || (ctx.linkish && ctx.chrome))) return value;
    if (key === "name" && ctx.field) return value;
    return prompt(key, value);
  }
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) {
    if (key === "options") return value.map((v) => prompt("option", String(v)));
    return value.map((v) => strip(v, key, ctx));
  }
  // Headings: { text, accent } collapses to one prompt (the accent must match the final text).
  if ((key === "heading" || key === "title") && "text" in value) return prompt(key, value.text);
  // Phone, email, and off-site links in footer lines are the client's details: make them a plain prompt line.
  if (ctx.chrome && key === "lines" && typeof value.href === "string" && /^(tel:|mailto:|https?:)/.test(value.href)) return prompt("lines", value.label ?? value.href);
  const linkish = typeof value.href === "string";
  const field = typeof value.kind === "string" && typeof value.name === "string";
  const chrome = ctx.chrome || key === "nav" || key === "footer";
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "photo" || k === "image" || k === "logo") {
      if (k === "logo") continue;
      out[k] = { src: v.src, alt: prompt("alt", v.alt || "the subject"), ...(v.focal ? { focal: v.focal } : {}) };
      continue;
    }
    out[k] = strip(v, k, { linkish, field, chrome });
  }
  return out;
}

function templatePage(page, siteName) {
  const blocks = page.blocks
    .filter((b) => !DROP_BLOCKS.has(b.type))
    .map((b) => (b.type === "events" ? { ...strip({ ...b, items: [] }, "block"), items: [] } : strip(b, "block")));
  const label = page.slug === "/" ? null : page.title.split(" | ")[0];
  return {
    slug: page.slug,
    title: label ? `${label} | {{name}}` : "{{name}} | [[Add: short tagline]]",
    ...(page.description ? { description: prompt("description", page.description) } : {}),
    ...(page.chrome !== undefined ? { chrome: strip(page.chrome, "chrome", { chrome: true }) } : {}),
    blocks,
  };
}

function templateSite(site, pageNames) {
  const nav = { ...site.nav };
  delete nav.logo;
  delete nav.wordmark;
  if (nav.cta) nav.cta = strip(nav.cta, "cta", { chrome: true });
  const footer = strip({ ...site.footer, social: undefined, logo: undefined }, "footer");
  delete footer.social;
  delete footer.logo;
  footer.legal = ["© {year} {{name}}."];
  const org = site.organization ? strip({ ...site.organization, foundingYear: undefined }, "organization") : undefined;
  if (org) delete org.foundingYear;
  if (org && site.organization.type) org.type = site.organization.type;
  return {
    name: "{{name}}",
    status: "preview",
    url: "{{url}}",
    locale: site.locale ?? "en-US",
    theme: { preset: "{{preset}}" },
    ...(org ? { organization: org } : {}),
    nav,
    footer,
    ...(site.posts ? { posts: { ...strip(site.posts, "posts"), label: site.posts.label } } : {}),
    pages: pageNames,
  };
}

// Small all-scalar link maps read best on one line (same style as the demos).
const LINKISH = new Set(["label", "href", "style", "external", "network", "name", "kind", "required"]);
function stringify(data, header) {
  const doc = new Document(data);
  visit(doc, {
    Map(_, node) {
      const keys = node.items.map((p) => p.key.value);
      const len = node.items.reduce((n, p) => n + String(p.key.value).length + String(p.value?.value ?? "").length + 4, 0);
      if (node.items.every((p) => isScalar(p.value)) && keys.every((k) => LINKISH.has(k)) && len <= 100) node.flow = true;
    },
  });
  doc.get("blocks")?.items?.forEach((n, i) => { if (i) n.spaceBefore = true; });
  if (doc.contents.items && !doc.get("blocks")) doc.contents.items.forEach((p, i) => { if (i && isCollection(p.value)) p.key.spaceBefore = true; });
  // Anything holding {{name}} is double-quoted so names with ':' or '#' stay valid YAML.
  visit(doc, {
    Scalar(_, node) {
      if (typeof node.value === "string" && node.value.includes("{{name}}")) node.type = "QUOTE_DOUBLE";
    },
  });
  doc.commentBefore = header;
  return doc.toString({ lineWidth: 0, minContentWidth: 0 });
}

for (const [market, { demo, label }] of Object.entries(markets)) {
  if (only.length && !only.includes(market)) continue;
  const src = `${sitesDir}/${demo}`;
  demoId = demo;
  const site = parse(readFileSync(`${src}/site.yaml`, "utf8"));
  const dir = `${root}templates/${market}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(`${dir}/pages`, { recursive: true });
  const header = ` ${label} template. Generated from src/sites/${demo} by \`npm run templates\`; edit the demo, not this file.`;
  writeFileSync(`${dir}/site.yaml`, stringify(templateSite(site, site.pages), header));
  for (const name of site.pages) {
    const page = parse(readFileSync(`${src}/pages/${name}.yaml`, "utf8"));
    writeFileSync(`${dir}/pages/${name}.yaml`, stringify(templatePage(page, site.name), header));
  }
  if (site.posts?.enabled) {
    mkdirSync(`${dir}/posts`, { recursive: true });
    writeFileSync(`${dir}/posts/.gitkeep`, "");
  }
  console.log(`✓ templates/${market}/  from ${demo}  (${site.pages.length} pages)`);
}
