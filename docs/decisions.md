# Decisions

Settled while reconciling `schema-site-brief.md`, `site-schema.ts`, and `demo-sites.ts` (Oct 2026).

## Architecture
- **One site per build.** Each site lives in `src/sites/<id>/` (`site.yaml`, `pages/*.yaml`, `config.ts`, `assets/`, `posts/`, optional `custom/`).
  Select with `SITE=<id>` (default `lattice`). The showcase is its own site (`SITE=showcase`).
- **Content is YAML** (`site.yaml` plus one file per page), read by `loadContent()` and validated by `defineSite()`
  with Zod when the module loads. Build fails on invalid content, naming the file and field. It was TypeScript at first; it moved to
  YAML because it's easier to read and edit by hand (no quoting, comments allowed, one file per page). `config.ts` remains for
  custom-block registration, and a site can still build its content in TS (the showcase generates its pages).
- **Editor schemas** (`schemas/*.json`) are generated from the Zod schema (`npm run docs`) and mapped in
  `.vscode/settings.json`. They reject unknown keys, which Zod drops silently. The Zod check at load is authoritative.
- **Images are string paths** relative to `src/sites/<id>/assets/`, resolved through a lazy `import.meta.glob`
  so only images actually rendered are processed by `astro:assets`. In dev, missing files render as labelled
  placeholders; `astro build` fails with the full list unless `ALLOW_MISSING_IMAGES=1`. Either way the build writes
  `src/sites/<id>/MISSING-IMAGES.md`.
- **Posts** are an Astro content collection (`src/sites/<id>/posts/*.md`). Cover images use the same
  `assets/` paths as the config rather than `image()`. With `image()`, a missing file hard-fails the content
  layer. With paths, posts get the same placeholders and the same missing-image report as everything else.
- **Fonts** use Astro's Fonts API (Fontsource provider), self-hosted at build. Config names a family only;
  presets own fallbacks.
- **Deploy:** one Cloudflare Worker serves every site on `*.sitebyfive.com`, routed by hostname
  (`worker/sites.generated.json`, written by `npm run build:sites`). Chosen over a Worker per site because a new site
  needs no Cloudflare changes, and it's the shape the product needs anyway: the multi-tenant preview app and
  Cloudflare for SaaS custom hostnames both route one app by hostname. Cost: every request runs the Worker; one
  deploy rebuilds every site (fine for dozens); static-asset file limits per Worker. Contact mail goes to each site's
  `formsTo` through Cloudflare Email Service. `form.action` remains the adapter boundary for Formspree and similar.
- **Site status:** `draft` (not deployed) · `preview` (deployed, noindex, prompts and missing images shown) ·
  `live` (strict build). Mirrors the product's preview → QA → publish flow.
- **Placeholders:** `[[Add: …]]` anywhere in content. Middleware renders them as `<mark class="placeholder">` in
  text (not attributes, title, scripts); the build lists them in `TO-FILL.md`; a live build refuses them. The AI fill
  step can emit the same markers for "add this later".
- **Market templates** are generated from each market's demo (`npm run templates`, `templates/markets.json`): structure
  kept, content turned into prompts (short text keeps the demo's wording as an example), proof blocks (quote, stats,
  logos), embeds, custom blocks, and event entries dropped. The demo is always the filled-in version of the template,
  so "pick a site like this one" is literally true and they can't drift. School → Puddlejump, financial → Ellsworth,
  startup → Lattice, nonprofit → Alder Springs (modelled on a community food pantry), energy → Mesa Ridge (a local
  solar installer). Cinema stays a one-off.
- **Marketing site** (`src/sites/www`) is built with the system itself. The look switcher frames `/preview/<preset>/`
  pages rather than rendering presets side by side, because preset treatments cascade from `<html data-preset>`
  and would bleed into each other on one page. Tabs are links targeting a named iframe (no JS needed). A site at
  `www.<host>` gets its bare domain redirected to www by the Worker. Pages can set `noindex: true`.
- **Questionnaires are hand-written, coverage is checked.** Generating questions from 60–100 template prompts reads
  badly, so each market's questions are written by hand, and each declares which template sections it feeds. Every
  prompt must be fed by a question or be composable copy (headings, eyebrows, labels, page descriptions), and facts
  can never be composed only: that enforces "the AI never invents" at the data level. The same YAML renders the
  printable questionnaire now and the web intake later; `feeds` tells the fill step what to write from which answer.
- **Comma-split values fail the load.** In a one-line `{ … }` YAML item, an unquoted comma splits the text into a
  stray key that the schema would silently drop. The content loader rejects any key containing a space, which is the
  signature of that mistake.
- **Contrast is computed, never configured.** `src/theme/tokens.ts` derives every surface's text, link, button, and
  label colours to WCAG targets (4.5:1 text, 3:1 large accents and UI edges). If neither white nor ink reads on a
  brand fill, the fill shifts until it does. Lattice's lime is a good example: on white it would be invisible, so
  primary buttons on light surfaces render in ink and the lime appears on dark surfaces.
- **Light brand colours as text:** if a brand colour is far too light for a surface (contrast under 1.6:1, e.g. lime
  or yellow on white), links and eyebrows try the other brand colour, then the text colour, rather than a darkened
  olive/mustard version. Labels use the accent or the text colour. On dark surfaces, accent text prefers a brand colour
  that already reads clearly (Lattice: lime). The light colour stays for fills, buttons, and highlights.
- **Bright highlighter** uses `--s-highlight`: the lighter brand colour, softened until body text reads at 4.5:1 over it.
- **Button-to-background mapping:** each surface picks the first of primary → accent → text colour that stands off
  it at 3:1.
- **Footer tone** is preset-owned (muted for muted, inverse for the rest).
- **JavaScript is enhancement only** (changed Oct 2026; the original spec was zero-JS). Everything works without it.
  Scripts live in the component that needs them (Astro `<script>`), so a page only ships what it renders. No framework.
  - Mobile menu: native popover; a script closes it when any link in it is tapped. CSS locks page scroll while open.
  - Transparent nav: CSS scroll-driven animation (fades to the hero's surface, then flips to the default surface in one
    step, because blending text and fill together makes both unreadable midway). Where unsupported (Firefox today), a
    scroll listener keeps it pinned and swaps it to the default surface. Without JS there it scrolls away with the hero.
  - Contact form: posts with `Accept: application/json` and shows sending / sent / error in place. Without JS: a
    normal post, then the endpoint redirects to `<page>#<id>-sent`, and `:target` shows the same success message.
  - Gallery lightbox: each photo links to a large rendition; a native `<dialog>` adds next/prev, keys, swipe.
  - Reveal on scroll (`theme.motion`, default subtle): one inline script, skipped under reduced motion and for the
    first section. Section backgrounds stay put; only their content fades up.
  - Dismissible announcement: inline localStorage check.
- **Landing pages** use `chrome: { nav: { minimal: true }, footer: false }`: logo (home) + one CTA, no menu.
  `chrome: false` (nothing at all) still exists, but reads as broken; prefer minimal.
- **UI strings** the system writes itself live in `src/lib/strings.ts`.

## Open questions
- "Card tag sublabel" is implemented as a per-card pill (`tag`). Revisit after visual review.
- Turnstile is not wired into the Worker yet. The honeypot plus same-origin checks are the only spam defence.

## Build switches
- `SITE=<id>` selects the site.
- `PRESET=<preset>` overrides `theme.preset` (and clears colour/font overrides) to prove a preset reskins the site.
- `NO_IMAGES=1` strips every image from the config to prove the no-image fallbacks.
