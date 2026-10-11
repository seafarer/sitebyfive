#!/usr/bin/env node
/**
 * Market questionnaires: the intake questions for each market, checked against its template.
 *
 *   npm run questionnaire              # check every market, write docs/questionnaires/<market>.md
 *   npm run questionnaire -- school    # one market
 *
 * questionnaires/_common.yaml holds the questions every market asks (basics, contact, hours, tone,
 * photos) and the `compose` patterns: copy written from the answers (headings, eyebrows, button
 * labels, page descriptions). questionnaires/<market>.yaml adds that market's questions.
 *
 * Every [[Add: …]] prompt in templates/<market>/ must be either fed by a question or composed.
 * Facts (names, prices, hours, people, contact details, FAQ answers) must come from a question:
 * the fill step never invents them. Patterns are `<file>:<path>` where file is `site` or a page
 * name; `*` matches within one path segment, `**` matches anything.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import { z } from "zod";
import { root } from "./sites.mjs";

const Question = z.object({
  id: z.string(),
  ask: z.string(),
  help: z.string().optional(),
  kind: z.enum(["text", "longtext", "list", "people", "choice", "contact", "hours", "files"]),
  /** Columns for list/people answers. */
  fields: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  /** Common questions only: ask after the market's questions (practical details go at the end). */
  last: z.boolean().default(false),
  feeds: z.array(z.string()).default([]),
});
const QuestionFile = z.object({
  /** _common.yaml only: where clients upload photos (e.g. a Dropbox file request). Empty: "we'll email a link". */
  uploadUrl: z.string().optional(),
  market: z.string().optional(),
  title: z.string().optional(),
  intro: z.string().optional(),
  questions: z.array(Question),
  compose: z.array(z.string()).default([]),
});

/** Prompt fields that hold facts. They must be fed by a question, never composed. */
const FACTS = new Set([
  "name", "role", "bio", "price", "unit", "features", "phone", "email", "address", "street", "locality", "region",
  "postalCode", "country", "openingHours", "hours", "a", "lines", "legalName", "value",
]);

const toRegex = (pattern) =>
  new RegExp(
    `^${pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "\u0000")
      .replace(/\*/g, "[^.\\[\\]]*")
      .replace(/\u0000/g, ".*")}$`,
  );

/** Every prompt in a template, as `<file>:<path>` plus the field key it sits in. */
function templatePrompts(market) {
  const dir = `${root}templates/${market}`;
  const site = parse(readFileSync(`${dir}/site.yaml`, "utf8"));
  const found = [];
  const walk = (file, value, path, key) => {
    if (typeof value === "string") {
      if (value.includes("[[")) found.push({ at: `${file}:${path}`, key });
      return;
    }
    if (Array.isArray(value)) return value.forEach((v, i) => walk(file, v, `${path}[${i}]`, key));
    if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(file, v, path ? `${path}.${k}` : k, k);
  };
  walk("site", site, "", "");
  for (const page of site.pages) walk(page, parse(readFileSync(`${dir}/pages/${page}.yaml`, "utf8")), "", "");
  return { prompts: found, pages: site.pages };
}

function render(market, common, q) {
  const questions = [...common.questions.filter((x) => !x.last), ...q.questions, ...common.questions.filter((x) => x.last)];
  const lines = [`# ${q.title ?? `${market} questionnaire`}`, "", (q.intro ?? common.intro ?? "").trim(), ""];
  questions.forEach((question, i) => {
    lines.push(`## ${i + 1}. ${question.ask}${question.required ? "" : " *(optional)*"}`, "");
    if (question.help) lines.push(question.help, "");
    if (question.fields) lines.push(`For each one: ${question.fields.join(" · ")}`, "");
    if (question.options) lines.push(question.options.map((o) => `- [ ] ${o}`).join("\n"), "");
    lines.push(question.kind === "files" ? "_Attach files or share a folder link._" : "_Your answer:_", "", "&nbsp;", "");
  });
  return `${lines.join("\n").trim()}\n`;
}

/**
 * The questionnaire as a page on the marketing site (src/sites/www/pages/questionnaire-<market>.yaml):
 * a form that emails the answers, plus upload instructions. Files questions become the upload section.
 */
function wwwPage(market, label, common, q) {
  const questions = [...common.questions.filter((x) => !x.last), ...q.questions, ...common.questions.filter((x) => x.last)];
  const helpFor = (x) =>
    [x.help, x.fields && `For each: ${x.fields.join(" · ")}.`, x.options && `For example: ${x.options.join(", ")}.`].filter(Boolean).join(" ");
  const fields = [
    { name: "your_name", label: "Your name", kind: "text", required: true },
    { name: "email", label: "Email", kind: "email", required: true },
    { name: "organization", label: "Organization", kind: "text", required: true },
    ...questions
      .filter((x) => x.kind !== "files")
      .map((x) => ({ name: x.id, label: x.ask, kind: x.kind === "choice" || x.kind === "text" ? "text" : "textarea", required: x.required, ...(helpFor(x) ? { help: helpFor(x) } : {}) })),
  ];
  const upload = common.uploadUrl
    ? { body: "Upload your logo, photos, and any documents you listed (reports, forms, menus) to our shared folder. Name them however you like; we'll sort them.", link: { label: "Upload files", href: common.uploadUrl, style: "primary" } }
    : { body: "After you send your answers, we'll email you a private link to upload your logo, photos, and any documents you listed (reports, forms, menus). Real photos of your people, place, and work beat stock photos every time." };
  const page = {
    slug: `/start/${market}`,
    title: `${label} questionnaire | Site by Five`,
    description: `${q.title ?? label}: the questions we use to write your site.`,
    noindex: true,
    chrome: { announcement: false, nav: { minimal: true, cta: false } },
    blocks: [
      { type: "pageHeader", variant: "simple", eyebrow: `Start your site · ${label}`, heading: q.title ?? `${label} questionnaire`, intro: (q.intro ?? common.intro ?? "").trim() },
      {
        type: "contact",
        variant: "form",
        id: "questionnaire",
        form: {
          subject: `Questionnaire: ${label}`,
          fields,
          submitLabel: "Send my answers",
          successText: "Thanks! We have your answers. You'll hear from us by 5pm the next business day with your preview, or a note about anything missing.",
        },
      },
      { type: "intro", variant: "two-column", tone: "tint", id: "photos", eyebrow: "Next step", heading: "Send your photos and files", ...upload },
    ],
  };
  return `# Generated from questionnaires/${market}.yaml by \`npm run questionnaire\`. Edit the questionnaire, not this file.
${stringify(page, { lineWidth: 0 })}`;
}

const marketLabels = JSON.parse(readFileSync(`${root}templates/markets.json`, "utf8"));
const wwwDir = `${root}src/sites/www`;

const common = QuestionFile.parse(parse(readFileSync(`${root}questionnaires/_common.yaml`, "utf8")));
const markets = readdirSync(`${root}questionnaires`)
  .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .filter((m) => !process.argv.slice(2).length || process.argv.slice(2).includes(m));

let failed = false;
mkdirSync(`${root}docs/questionnaires`, { recursive: true });
for (const market of markets) {
  const q = QuestionFile.parse(parse(readFileSync(`${root}questionnaires/${market}.yaml`, "utf8")));
  const { prompts } = templatePrompts(market);
  const fed = [...common.questions, ...q.questions].flatMap((question) => question.feeds.map((p) => ({ re: toRegex(p), id: question.id })));
  const composed = [...common.compose, ...q.compose].map(toRegex);
  const uncovered = [];
  const factsComposed = [];
  for (const p of prompts) {
    if (fed.some((f) => f.re.test(p.at))) continue;
    if (composed.some((re) => re.test(p.at))) {
      if (FACTS.has(p.key)) factsComposed.push(p.at);
      continue;
    }
    uncovered.push(p.at);
  }
  const count = common.questions.length + q.questions.length;
  if (uncovered.length || factsComposed.length) {
    failed = true;
    console.log(`✖ ${market}: ${count} questions, ${prompts.length} prompts`);
    if (uncovered.length) console.log(`  not covered by any question or compose pattern:\n    ${uncovered.join("\n    ")}`);
    if (factsComposed.length) console.log(`  facts that only a compose pattern covers (need a question):\n    ${factsComposed.join("\n    ")}`);
  } else {
    console.log(`✓ ${market}: ${count} questions cover all ${prompts.length} prompts`);
  }
  writeFileSync(`${root}docs/questionnaires/${market}.md`, render(market, common, q));
  if (existsSync(`${wwwDir}/pages`)) {
    const name = `questionnaire-${market}`;
    writeFileSync(`${wwwDir}/pages/${name}.yaml`, wwwPage(market, marketLabels[market]?.label ?? market, common, q));
    if (!readFileSync(`${wwwDir}/site.yaml`, "utf8").includes(`- ${name}\n`)) console.log(`  ⚠ add "${name}" to src/sites/www/site.yaml pages`);
  }
}
if (failed) process.exit(1);
