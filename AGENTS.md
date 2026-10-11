## Project

Site by Five (sitebyfive.com): an Astro starter that renders a small-org site from YAML content checked against one typed schema. Read `README.md`,
`docs/decisions.md`, and `docs/blocks.md` first.

- One site per build: `SITE=<id>` selects `src/sites/<id>/` (site.yaml, pages/*.yaml, config.ts, assets/, posts/, public/, custom/).
  Content is YAML; config.ts only loads it and registers custom blocks. The showcase builds its content in TS.
- The schema (`src/schema/site-schema.ts`) is the source of truth, and its comments are the docs. After changing
  the schema, run `npm run docs` (regenerates docs/blocks.md and the editor schemas in schemas/).
- Rules: variants are layout only; styling comes from preset tokens (`--s-*` via Tailwind colours `bg`, `fg`,
  `fg-muted`, `border`, `card`, `link`, `label`, `accent-ink`, `pill`). Never hardcode colours or fonts in components.
- Every block must work with zero images. Implement the fallback documented in the schema.
- JavaScript is enhancement only: everything must work without it. Put scripts in the component that needs them
  (Astro `<script>`), vanilla TS, no frameworks. See docs/decisions.md.
- Component CSS goes in `src/styles/components.css` inside `@layer components`, never in scoped `<style>`.
  Unlayered styles beat Tailwind utilities.
- Dynamic Tailwind classes must be full strings (see `src/lib/grid.ts`).
- New sites: `npm run new -- <id> --market <market>` (templates/). Content prompts are `[[Add: …]]`; never invent
  testimonials, stats, awards, people, or credentials. Site `status`: draft | preview | live (live is strict).
- Templates are generated from market demos (`npm run templates`); never edit templates/ by hand. After changing a
  demo's structure, regenerate and run `npm run questionnaire` (every prompt must be fed by a question or composable).
- Hosting: one Worker for all sites (`npm run build:sites`, `npm run deploy`); see README "Deploying".
- Verify with `npm run check` and `npm run fixtures`.

## Development

When starting the dev server, use background mode:

```
SITE=lattice astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Fonts](https://docs.astro.build/en/guides/fonts/)
- [Images](https://docs.astro.build/en/guides/images/)
