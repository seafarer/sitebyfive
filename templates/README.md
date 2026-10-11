# Market templates

**Generated. Don't edit these folders by hand.** Each market's template is its demo site with the
content swapped for `[[Add: …]]` prompts, written by `npm run templates`. To change a market's page
plan, edit its demo in `src/sites/` and regenerate, so the demo is always the filled-in version of
what `npm run new` produces.

| Market | Demo | Pages |
|---|---|---|
| `school` | `puddlejump` (Puddlejump Early School, fun) | Home, Programs, Our school, Families, Visit + posts |
| `financial` | `ellsworth` (Ellsworth & Pine, business) | Home, Services, Team, Resources, Contact + posts |
| `startup` | `lattice` (Lattice Current, bright) | Home, Platform, Applications, Pilot (landing), Company + posts |
| `nonprofit` | `aldersprings` (Alder Springs Food Share, muted) | Home, Get food, Volunteer, Donate, About, Contact |
| `energy` | `mesaridge` (Mesa Ridge Solar, bright) | Home, Residential, Commercial, About, Incentives, Contact |

The mapping lives in `markets.json`. Cinema (`src/sites/cinema`) is a one-off with no template.

What the generator keeps, prompts, and drops:

- **Kept:** block types, variants, tones, ids, slugs, nav and footer links, form fields, image paths, page chrome.
- **Prompted:** headings, copy, names, prices, button labels inside blocks, and so on. Short text keeps the demo's
  wording as an example; alt text always does, so `MISSING-IMAGES.md` doubles as the shot list.
- **Dropped:** `quote`, `stats`, `logos`, `embed`, and `custom` blocks, plus event entries. Proof gets added only when
  the client's real content supports it, and dates can't be prompts. Also dropped: logo, social links, announcement,
  and brand colours (the site uses its preset's defaults).

Tokens filled by `npm run new`: `{{name}}`, `{{id}}`, `{{url}}`, `{{preset}}`. The default preset is the demo's.
