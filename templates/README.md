# Market templates

**Generated. Don't edit these folders by hand.** Each market's template is its demo site with the
content swapped for `[[Add: …]]` prompts, written by `npm run templates`. To change a market's page
plan, edit its demo in `src/sites/` and regenerate, so the demo is always the filled-in version of
what `npm run new` produces.

| Market | Demo | Pages |
|---|---|---|
| `nonprofit` | `aldersprings` (Alder Springs Food Share, muted) | Home, Get food, Volunteer, Donate, About, Contact, Accessibility |
| `property` | `larkspur` (Larkspur Property Care, business) | Home, Services, For owners, About, Contact + posts |
| `trades` | `juniper` (Juniper Plumbing & Heating, bright) | Home, Services, Service area, About, Contact |
| `farm` | `highmesa` (High Mesa Orchard, warm) | Home, What's picking, Visit, Events, Our farm |
| `outdoor` | `kestrel` (Kestrel Fly & Float, bright) | Home, Trips, Plan your trip, Guides, Opener (landing) + posts |
| `school` | `puddlejump` (Puddlejump Early School, fun) | Home, Programs, Our school, Families, Visit + posts |

The mapping lives in `markets.json`.

What the generator keeps, prompts, and drops:

- **Kept:** block types, variants, tones, ids, slugs, nav and footer links, form fields, image paths, page chrome.
  Links to the demo's own phone, email, or `.example` sites (booking pages, portals) become prompts.
- **Prompted:** headings, copy, names, prices, button labels inside blocks, and so on. Short text keeps the demo's
  wording as an example; alt text always does, so `MISSING-IMAGES.md` doubles as the shot list.
- **Dropped:** `quote`, `stats`, `logos`, `embed`, and `custom` blocks, plus event entries. Proof gets added only when
  the client's real content supports it, and dates can't be prompts. Also dropped: logo, social links, announcement,
  and brand colours (the site uses its preset's defaults).

Tokens filled by `npm run new`: `{{name}}`, `{{id}}`, `{{url}}`, `{{preset}}`. The default preset is the demo's.
