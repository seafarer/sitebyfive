 # Brief: schema-driven site builder (greenfield)

  ## Goal
  An Astro starter that renders a complete 5-page marketing marketing site from a single
  typed config file. Built for small orgs with thin content: few images, little copy.
  A new site should go from config to deploy in hours, not days.

  A site = theme + global chrome (announcement, nav, footer) + pages made of typed blocks, all in one
  validated config. Content is forced into the schema; escape hatches cover genuine one-offs.

  There are three different demo sites in demo-sites.ts that will provide the content. I want to show three different sites that show off dfferent vartions of this schema site builder in terms of both theme, and block usage. The demo sites content may not fully demonstrate this, so I want to update the demo content to fulfill the goal, rather than the other way around. When the job is complete, there should be images in place everywhere an image is suggested, so flag missing images after the first run and I will add the images. 

  ## Reference material
  - Starting schema: site-schema.ts (Zod). 
  - demo-sites.ts

  ## Stack
  Astro (latest), TypeScript strict, Tailwind v4, zero client JS by default.
  Static output. No CMS, no React unless a block genuinely needs it.

  ## Deliverables
  1. **Block components**: one `.astro` component per block type, every variant implemented.
  2. **Renderer**: `pages/[...slug].astro` reads the config, validates with Zod at build, renders blocks in order. Build fails on invalid config.
  3. **Theme system**: 5 presets (muted, business, warm, bright, fun) as CSS custom properties. Config overrides for colors, fonts, radius, density patch on top. Section `tone` maps to tokens. Components never hardcode colors or fonts.
  4. **Global chrome**: announcement (bar + marquee), nav (all layout/style combos, mobile menu), footer.
  5. **Posts**: Astro content collection for markdown posts, index + detail templates per the `posts` config.
  6. **Demo pages**: one route per block showing every variant, with and without images.

  ## Rules
  1. Variants are layout decisions, never styling options. Styling comes from the theme.
  2. Classify every new requirement before adding anything:
     content → schema field | layout → variant | look → theme preset | one-off → custom block.
  3. The theme preset owns: accent style, CTA treatment, surface tones (default/muted/raised/
     inverse/accent), button-to-background mapping, radius, density, fonts.
  4. No hidden syntax in text fields (no *accent*, no splitting on separators). Use explicit fields.
  5. Every block works with zero images and documents its fallback.
  6. Parse failures only for real breakage. Opinionated limits (e.g. nav ≤ 6) are lint warnings.
  7. Every block renders well with zero images and minimal copy. Fallbacks are documented in the schema comments; implement them exactly.
  8. Variants change layout only. Styling comes from theme tokens.
  9. Accessible by default: semantic HTML, focus states, reduced-motion respected (marquees stop).
  10. Native `<details>` for FAQ. FAQ emits FAQPage JSON-LD.
  11. Images via `astro:assets`. Meta and OG tags from page config.
  12. Lighthouse 95+ on all four categories.


  ## Settle these first
  - Astro content collection with image() for images (recommended) vs a TS file
    with string paths (bundles every image).
  - Custom block contract: { type: "custom", component, props } plus a per-site component
    registry; decide whether each component validates its own props with Zod.
  - Heading accent model (e.g. heading: string | { text, accent }).

  ## Schema additions already identified
  organization (for structured data) · flexible analytics · footer logo, linkable legal lines and
  {year} · image wordmark · per-page chrome overrides · linkList split variant · cta.details in all
  variants · card tag sublabel · logo items with year/source · "raised" tone.

  ## Built-in behaviour
  FAQ structured data · prefers-reduced-motion on marquees · aria-hidden on duplicated loops ·
  external links open in a new tab · build error on unknown block types · config validated at build.

  ## Done means
  - The demo site builds entirely from config. Pages are made of blocks, no hand-written page markup.
  - Two fixtures pass: a thin-content site (no photos) and a photo-rich site, with only the theme
    preset changed.
  - Every block and variant appears on a showcase page.
  - The schema has docs: each block's purpose, variants and no-image fallback.
  - Swapping `theme.preset` changes the whole site's look with no other edits.
  - Removing every image from the config still produces a site you'd show a client.
  - A second config for a different business type (e.g. a local cinema) builds without touching component code.
