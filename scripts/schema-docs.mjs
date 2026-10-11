#!/usr/bin/env node
/**
 * Generates docs/blocks.md from the JSDoc comments in src/schema/site-schema.ts,
 * so the block reference can't drift from the schema. Run: npm run docs
 */
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("src/schema/site-schema.ts", "utf8");
const re = /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*export const (\w+) = Section\.extend\(\{\s*type: z\.literal\("(\w+)"\),([\s\S]*?)\n\}\)/g;
const clean = (doc) =>
  doc
    .split("\n")
    .map((l) => l.replace(/^\s*\* ?/, ""))
    .join("\n")
    .trim();

const blocks = [];
for (const m of src.matchAll(re)) {
  const [, doc, name, type, body] = m;
  const variants = /variant: z\.enum\(\[([^\]]+)\]/.exec(body)?.[1]?.match(/"([^"]+)"/g)?.map((v) => v.slice(1, -1)) ?? [];
  const text = clean(doc);
  const lines = text.split("\n");
  // The fallback sentence, plus any continuation lines that follow it.
  const start = lines.findIndex((l) => /No-image fallback|Never uses images/i.test(l));
  const tail = start < 0 ? [] : [lines[start], ...lines.slice(start + 1).filter((_, i, rest) => rest.slice(0, i + 1).every((x) => x.startsWith("`") || /^[a-z(]/.test(x)))];
  const fallback = tail.join(" ").replace(/No-image fallback(?: \(per row\))?:\s*/i, "").trim();
  blocks.push({ name, type, variants, text, fallback });
}

const toc = blocks.map((b) => `- [\`${b.type}\`](#${b.type.toLowerCase()}): ${b.text.split("\n")[0].replace(/^[\w /]+ — /, "")}`).join("\n");
const sections = blocks
  .map(
    (b) => `## \`${b.type}\`

\`\`\`text
${b.text}
\`\`\`

| | |
|---|---|
| Variants | ${b.variants.length ? b.variants.map((v) => `\`${v}\``).join(", ") : "none"} |
| No-image fallback | ${b.fallback || "See above."} |
`,
  )
  .join("\n");

writeFileSync(
  "docs/blocks.md",
  `# Block reference

Generated from the comments in \`src/schema/site-schema.ts\` by \`npm run docs\`. Edit the schema, not this file.

Every block also accepts the shared section fields: \`id\`, \`tone\` (default, muted, tint, inverse, accent), \`eyebrow\`, \`heading\` (string or \`{ text, accent }\`), \`intro\` (markdown), and \`link\` (a CTA under the block).

${toc}

${sections}`,
);
console.log(`docs/blocks.md: ${blocks.length} blocks`);
