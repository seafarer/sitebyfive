#!/usr/bin/env node
/**
 * Fixture matrix for the brief's "done means" checks. Builds every demo site:
 *   - as configured
 *   - with NO_IMAGES=1   (removing every image still produces a complete site)
 *   - with PRESET=<each> (swapping the preset reskins the site with no other edits)
 * plus the showcase, and every market template (scaffolded with `npm run new`, built as a preview,
 * then removed), then asserts on the output.
 *
 *   npm run fixtures            # placeholders allowed for missing images
 *   npm run fixtures -- --strict  # missing images fail the build
 *   npm run fixtures -- juniper   # one site only
 *   npm run fixtures -- templates # market templates only
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const only = args.filter((a) => !a.startsWith("--"));
// Every market demo (templates/markets.json).
const markets = JSON.parse(readFileSync("templates/markets.json", "utf8"));
const DEMOS = [...Object.entries(markets).filter(([k]) => k !== "$comment").map(([, m]) => m.demo)].filter((s) => !only.length || only.includes(s));
const PRESETS = ["muted", "business", "warm", "bright", "fun"];
const OUT = ".fixtures";

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : f.endsWith(".html") ? [p] : [];
  });

const runs = [];
for (const site of DEMOS) {
  runs.push({ site, label: "as configured", env: {} });
  runs.push({ site, label: "NO_IMAGES", env: { NO_IMAGES: "1" }, expectNoImg: true });
  for (const p of PRESETS) runs.push({ site, label: `PRESET=${p}`, env: { PRESET: p }, expectPreset: p });
}
if (!only.length || only.includes("showcase")) runs.push({ site: "showcase", label: "as configured", env: {} });
// Market templates: scaffold → build as a preview → assert prompts render → remove.
const MARKETS = !only.length || only.includes("templates") ? readdirSync("templates").filter((d) => statSync(join("templates", d)).isDirectory()) : [];
for (const market of MARKETS) runs.push({ site: `fixture-tpl-${market}`, market, label: "template", env: {}, expectPrompts: true });

rmSync(OUT, { recursive: true, force: true });
const results = [];
for (const run of runs) {
  const outDir = join(OUT, `${run.site}-${run.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
  const env = { ...process.env, SITE: run.site, OUT_DIR: outDir, ...run.env, ...(strict ? {} : { ALLOW_MISSING_IMAGES: "1" }) };
  const t0 = Date.now();
  const problems = [];
  if (run.market) {
    rmSync(`src/sites/${run.site}`, { recursive: true, force: true });
    const made = spawnSync("node", ["scripts/new-site.mjs", run.site, "--market", run.market], { encoding: "utf8" });
    if (made.status !== 0) problems.push(`scaffold failed: ${(made.stderr || made.stdout).split("\n").slice(0, 6).join(" / ")}`);
  }
  const r = problems.length ? { status: 1, stdout: "", stderr: problems[0] } : spawnSync("npx", ["astro", "build"], { env, encoding: "utf8" });
  if (run.market) rmSync(`src/sites/${run.site}`, { recursive: true, force: true });
  if (problems.length) {
    // scaffold failed; already recorded
  } else if (r.status !== 0) {
    problems.push((r.stderr || r.stdout).split("\n").filter((l) => /error|missing/i.test(l)).slice(0, 4).join(" / ") || "build failed");
  } else {
    const files = htmlFiles(outDir);
    if (!files.length) problems.push("no HTML output");
    for (const f of files) {
      const html = readFileSync(f, "utf8");
      if (run.expectNoImg && /<img\b/.test(html)) problems.push(`<img> in ${f.slice(outDir.length)}`);
      if (run.expectPreset && !html.includes(`data-preset="${run.expectPreset}"`)) problems.push(`wrong preset in ${f.slice(outDir.length)}`);
      if (/<title>[^<]*<mark/.test(html)) problems.push(`markup inside <title> in ${f.slice(outDir.length)}`);
    }
    if (run.expectPrompts && !files.some((f) => readFileSync(f, "utf8").includes('<mark class="placeholder">'))) problems.push("no [[placeholder]] prompts rendered");
    run.pages = files.length;
  }
  results.push({ ...run, ok: problems.length === 0, problems, ms: Date.now() - t0 });
  const mark = problems.length ? "✖" : "✓";
  console.log(`${mark} ${run.site.padEnd(11)} ${run.label.padEnd(16)} ${String(run.pages ?? "-").padStart(3)} pages  ${(Date.now() - t0) / 1000}s ${problems.slice(0, 2).join("; ")}`);
}

// Questionnaires must still cover every template prompt.
if (MARKETS.length) {
  const q = spawnSync("node", ["scripts/questionnaire.mjs"], { encoding: "utf8" });
  const ok = q.status === 0;
  console.log(`${ok ? "✓" : "✖"} questionnaires  ${ok ? "cover every template prompt" : `\n${q.stdout}`}`);
  results.push({ ok, problems: ok ? [] : ["questionnaire coverage"] });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} fixture builds passed${strict ? " (strict images)" : ""}. Output in ${OUT}/`);
process.exit(failed.length ? 1 : 0);
