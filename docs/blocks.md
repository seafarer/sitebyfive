# Block reference

Generated from the comments in `src/schema/site-schema.ts` by `npm run docs`. Edit the schema, not this file.

Every block also accepts the shared section fields: `id`, `tone` (default, muted, tint, inverse, accent), `eyebrow`, `heading` (string or `{ text, accent }`), `intro` (markdown), and `link` (a CTA under the block).

- [`hero`](#hero): the opening statement of a page. Renders the page's h1.
- [`pageHeader`](#pageheader): the quieter hero for interior pages. Renders the page's h1.
- [`intro`](#intro): the main statement of a section.
- [`cards`](#cards): a grid of parallel things.
- [`featureRows`](#featurerows): alternating image/text rows, for 2–4 things that each need a paragraph.
- [`features`](#features): short, bullet-style selling points: icon, title, a line or two. No boxes.
- [`quote`](#quote): a pull quote or a set of testimonials.
- [`stats`](#stats): 2–4 big numbers. Cheap credibility for orgs with no photos.
- [`logos`](#logos): a recognition strip: partners, press, awards.
- [`team`](#team): the people.
- [`faq`](#faq): native <details>, no JS. Emits FAQPage JSON-LD.
- [`pricing`](#pricing): prices, plans, and rate sheets.
- [`events`](#events): schedules, showtimes, nonprofit events, seasonal hours.
- [`gallery`](#gallery): for clients whose only good asset is a folder of photos.
- [`cta`](#cta): a call-to-action band.
- [`linkList`](#linklist): resources, forms, external portals.
- [`contact`](#contact): a form, contact details, or both.
- [`richText`](#richtext): markdown body for interior pages. The default content block.
- [`embed`](#embed): escape hatch for third-party widgets: video, map, booking, donation form.
- [`custom`](#custom): escape hatch for genuine one-offs.

## `hero`

```text
Hero — the opening statement of a page. Renders the page's h1.
 full-bleed: image fills the viewport width, text overlaid on a scrim.
 contained:  image in a framed panel inside the grid, text above.
 split:      text one side, image the other (`imageSide`).
 text-only:  big type, no image.
No-image fallback: every variant renders as text-only.
```

| | |
|---|---|
| Variants | `full-bleed`, `contained`, `split`, `text-only` |
| No-image fallback | every variant renders as text-only. |

## `pageHeader`

```text
Page header — the quieter hero for interior pages. Renders the page's h1.
 simple:     eyebrow, heading, intro.
 with-image: the same, plus a wide image band below.
No-image fallback: simple.
```

| | |
|---|---|
| Variants | `simple`, `with-image` |
| No-image fallback | simple. |

## `intro`

```text
Intro — the main statement of a section.
 centered:   short statement, centred.
 two-column: heading left, body right.
Never uses images.
```

| | |
|---|---|
| Variants | `centered`, `two-column` |
| No-image fallback | Never uses images. |

## `cards`

```text
Cards — a grid of parallel things.
 image:    photo on top.
 icon:     small icon, good for services.
 numbered: big "01" style label, no media. The thin-content workhorse.
 text:     plain, for dense lists.
`tags` is an optional pill row under the grid: "Spanish, Art, Music, PE".
No-image fallback: `image` renders as `numbered` if any item lacks an image (mixed media looks broken);
`icon` renders as `numbered` if any item lacks an icon.
```

| | |
|---|---|
| Variants | `image`, `icon`, `numbered`, `text` |
| No-image fallback | `image` renders as `numbered` if any item lacks an image (mixed media looks broken); `icon` renders as `numbered` if any item lacks an icon. |

## `featureRows`

```text
Feature rows — alternating image/text rows, for 2–4 things that each need a paragraph.
`startSide` is the image side of the first row.
No-image fallback: each row becomes a two-column intro (label + title left, body right).
Rows with and without images can mix; each row falls back on its own.
```

| | |
|---|---|
| Variants | none |
| No-image fallback | each row becomes a two-column intro (label + title left, body right). |

## `features`

```text
Features — short, bullet-style selling points: icon, title, a line or two. No boxes.
 grid:  icon above the title, 2–4 columns.
 split: heading and intro on the left, the points stacked on the right.
 list:  compact two-column list, small icon beside each point. Good for 6–12 points.
Use cards for things that need a box or a link, feature rows for things that need a paragraph.
Items without an icon get a check mark. Never uses images.
```

| | |
|---|---|
| Variants | `grid`, `split`, `list` |
| No-image fallback | Items without an icon get a check mark. Never uses images. |

## `quote`

```text
Quote — a pull quote or a set of testimonials.
 single: one big pull quote. Works for a mission statement too.
 grid:   2–3 short testimonials.
No-image fallback: no avatar. Deliberately not initials.
```

| | |
|---|---|
| Variants | `single`, `grid` |
| No-image fallback | no avatar. Deliberately not initials. |

## `stats`

```text
Stats — 2–4 big numbers. Cheap credibility for orgs with no photos.
Never uses images.
```

| | |
|---|---|
| Variants | none |
| No-image fallback | Never uses images. |

## `logos`

```text
Logos — a recognition strip: partners, press, awards.
 grid:    static grid.
 marquee: scrolling row. Stops under prefers-reduced-motion; the loop copy is aria-hidden.
No-image fallback: each item without a logo renders as a text badge (year · name · source).
```

| | |
|---|---|
| Variants | `grid`, `marquee` |
| No-image fallback | each item without a logo renders as a text badge (year · name · source). |

## `team`

```text
Team — the people.
 grid: headshot, name, role.
 list: name, role, short bio. For when there are no headshots.
No-image fallback: grid shows a neutral tile with initials.
```

| | |
|---|---|
| Variants | `grid`, `list` |
| No-image fallback | grid shows a neutral tile with initials. |

## `faq`

```text
FAQ — native <details>, no JS. Emits FAQPage JSON-LD.
 stacked: header above, questions below.
 split:   header left (sticky), questions right.
Never uses images.
```

| | |
|---|---|
| Variants | `stacked`, `split` |
| No-image fallback | Never uses images. |

## `pricing`

```text
Pricing — prices, plans, and rate sheets.
 tiers: 2–3 columns with features. Services, memberships.
 list:  name / price rows. Menus, ticket prices, rate sheets.
Never uses images.
```

| | |
|---|---|
| Variants | `tiers`, `list` |
| No-image fallback | Never uses images. |

## `events`

```text
Events — schedules, showtimes, nonprofit events, seasonal hours.
 list:  date column + details. Dense, scannable.
 cards: image cards with a date badge.
Events that ended before the build date are hidden; pair with a scheduled rebuild.
No upcoming events renders `emptyText`.
No-image fallback: cards show a large date tile instead of the photo.
```

| | |
|---|---|
| Variants | `list`, `cards` |
| No-image fallback | cards show a large date tile instead of the photo. |

## `gallery`

```text
Gallery — for clients whose only good asset is a folder of photos.
 grid:    even tiles.
 masonry: natural aspect ratios in columns.
 cluster: 3 overlapping photos. Fewer than 3 renders as grid.
No-image fallback: the block is omitted entirely (a gallery of nothing is nothing).
```

| | |
|---|---|
| Variants | `grid`, `masonry`, `cluster` |
| No-image fallback | the block is omitted entirely (a gallery of nothing is nothing). |

## `cta`

```text
CTA banner — a call-to-action band.
 simple:      heading + buttons on a toned band.
 with-images: text + photo cluster beside it.
 split:       text left, details (contact info, hours) right.
`details` renders in every variant: beside the text in split, under the buttons otherwise.
No-image fallback: with-images renders as simple.
```

| | |
|---|---|
| Variants | `simple`, `with-images`, `split` |
| No-image fallback | with-images renders as simple. |

## `linkList`

```text
Link list — resources, forms, external portals.
 grid:  link cards in 2–3 columns.
 split: section header left, a stacked list of links right.
Never uses images.
```

| | |
|---|---|
| Variants | `grid`, `split` |
| No-image fallback | Never uses images. |

## `contact`

```text
Contact — a form, contact details, or both.
 form:         form only.
 form-details: form + address/hours/phone sidebar.
 details:      no form. Address, hours, phone, map link.
The form posts to `action` with no JS. On success the endpoint redirects back to
`#<id>-sent`, which reveals `successText` via CSS :target.
Never uses images.
```

| | |
|---|---|
| Variants | `form`, `form-details`, `details` |
| No-image fallback | Never uses images. |

## `richText`

```text
Rich text — markdown body for interior pages. The default content block.
 width prose: ~68ch reading column.  wide: full container.
Never uses images (put photos in a gallery or feature rows).
```

| | |
|---|---|
| Variants | none |
| No-image fallback | Never uses images (put photos in a gallery or feature rows). |

## `embed`

```text
Embed — escape hatch for third-party widgets: video, map, booking, donation form.
Third-party embeds cost Lighthouse points; iframes are lazy-loaded.
Never uses images.
```

| | |
|---|---|
| Variants | none |
| No-image fallback | Never uses images. |

## `custom`

```text
Custom — escape hatch for genuine one-offs.
`component` names a file in `src/sites/<id>/custom/<component>.astro`, which
exports a Zod `schema` for its props. Props are validated against it at build.
Gets the shared section chrome (tone, eyebrow, heading…) like any block.
No-image fallback: up to the component; document it in the component.
```

| | |
|---|---|
| Variants | none |
| No-image fallback | up to the component; document it in the component. |
