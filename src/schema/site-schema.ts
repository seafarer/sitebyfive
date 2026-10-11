/**
 * Site by Five — schema v2
 *
 * A site is: theme + global chrome (announcement, nav, footer) + pages of blocks.
 *
 * Rules this schema enforces (see docs/decisions.md):
 *  - Variants are layout decisions, never styling knobs. Styling comes from the theme preset.
 *  - Every block works with zero images and minimal copy. Each block documents its
 *    no-image fallback below, and the components implement exactly that.
 *  - No hidden syntax in text fields. Accents, lists, and links are explicit fields.
 *    The single template token in the system is `{year}` in footer legal lines.
 *  - Parse failures are reserved for real breakage. Opinionated limits ("nav has at
 *    most 6 items") are lint warnings — see `src/schema/lint.ts`.
 *
 * Fields typed `Markdown` accept inline markdown (bold, italic, links, line breaks
 * with two trailing spaces). Fields documented as "markdown, block" also accept
 * paragraphs and lists.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/** Markdown string. Kept as a named alias so the docs read clearly. */
export const Markdown = z.string();

export const Link = z.object({
  label: z.string(),
  href: z.string(),
  /**
   * Open in a new tab. Optional: absolute URLs to another host are treated as
   * external automatically. Set explicitly to override (e.g. a PDF on your own site).
   */
  external: z.boolean().optional(),
});

/** A link styled as a button. `style` is hierarchy, not appearance: the preset decides how each looks. */
export const Cta = Link.extend({
  style: z.enum(["primary", "secondary", "text"]).default("primary"),
});

/**
 * Image path relative to the site's `assets/` folder, e.g. "hero-garden.webp".
 * A missing file fails the build with a list of every missing image.
 */
export const Image = z.object({
  src: z.string().min(1),
  /** Required. Use "" for purely decorative images. */
  alt: z.string(),
  /** CSS object-position, e.g. "50% 30%". Thin-content clients have bad crops. */
  focal: z.string().optional(),
});

/**
 * A logo. `kind` decides whether the typed site name is shown beside it:
 *  - mark:     a symbol. The name is still set in type next to it.
 *  - wordmark: the image *is* the name. The typed name is hidden (kept for screen readers).
 */
export const Logo = Image.extend({
  kind: z.enum(["mark", "wordmark"]).default("mark"),
  /**
   * The logo for dark backgrounds (e.g. white lettering), used wherever the logo sits on a dark
   * surface such as a dark footer. Lint warns when a wordmark is on a dark footer without one.
   */
  srcOnDark: z.string().optional(),
});

/**
 * Heading with an optional accent. The preset decides what an accent looks like
 * (colour, italic serif, marker highlight, squiggle…).
 *
 *   heading: "Small classes. Good days."
 *   heading: { text: "Small classes. Good days.", accent: "Good" }
 *
 * `accent` must be an exact, case-sensitive substring of `text`; the first match is
 * wrapped. It can sit anywhere, including mid-sentence.
 */
export const Heading = z.union([
  z.string().min(1),
  z
    .object({ text: z.string().min(1), accent: z.string().min(1) })
    .refine((h) => h.text.includes(h.accent), {
      message: "heading.accent must be an exact substring of heading.text",
    }),
]);

/**
 * Section background treatment, resolved by theme tokens.
 *  default: page background.  muted: quiet neutral tint.  tint: pale wash of the brand colour.
 *  inverse: dark band.        accent: the theme accent colour.
 * Vary backgrounds between sections rather than boxing content in shadows.
 */
export const Tone = z.enum(["default", "muted", "tint", "inverse", "accent"]);

/** Shared section chrome. Every block gets these. */
const Section = z.object({
  /** Anchor target, e.g. "contact" → "#contact". */
  id: z.string().optional(),
  tone: Tone.default("default"),
  /** Small label above the heading: "Programs", "Our values". */
  eyebrow: z.string().optional(),
  heading: Heading.optional(),
  intro: Markdown.optional(),
  /** Optional section-level link, rendered under the block. */
  link: Cta.optional(),
});

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

export const Preset = z.enum(["muted", "business", "warm", "bright", "fun"]);

/**
 * The preset owns: accent style, CTA treatment, surface tones, button-to-background
 * mapping, eyebrow style, radius, density, and fonts. The overrides below patch on top.
 * Text colours are always derived for contrast; you never set them directly.
 */
export const Theme = z.object({
  preset: Preset,
  colors: z
    .object({
      /** Buttons, links, focus rings. */
      primary: z.string(),
      /** Accent tone backgrounds and heading accents. */
      accent: z.string(),
      /** Base for text, borders, muted and inverse surfaces. */
      neutral: z.string(),
    })
    .partial()
    .optional(),
  /** Font family names as listed on Fontsource, e.g. "Space Grotesk". Fallbacks come from the preset. */
  fonts: z.object({ heading: z.string(), body: z.string() }).partial().optional(),
  radius: z.enum(["none", "soft", "round"]).optional(),
  density: z.enum(["airy", "standard", "compact"]).optional(),
  /**
   * subtle: section content fades up as it scrolls into view (tiny inline script; skipped under
   * prefers-reduced-motion and for the first section). none: everything renders static.
   * Default: subtle.
   */
  motion: z.enum(["subtle", "none"]).optional(),
});

/* -------------------------------------------------------------------------- */
/* Organization (structured data)                                             */
/* -------------------------------------------------------------------------- */

/** Emitted as JSON-LD on every page. `sameAs` is taken from `footer.social`. */
export const Organization = z.object({
  type: z
    .enum([
      "Organization",
      "Corporation",
      "NGO",
      "GovernmentOrganization",
      "LocalBusiness",
      "ProfessionalService",
      "FinancialService",
      "School",
      "Preschool",
      "ChildCare",
      "EducationalOrganization",
      "Plumber",
      "Electrician",
      "HVACBusiness",
      "RoofingContractor",
      "GeneralContractor",
      "HousePainter",
      "Locksmith",
      "HomeAndConstructionBusiness",
      "RealEstateAgent",
      "Store",
      "Winery",
      "FoodEstablishment",
      "SportsActivityLocation",
      "TravelAgency",
      "MovieTheater",
    ])
    .default("Organization"),
  legalName: z.string().optional(),
  description: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string(),
      locality: z.string(),
      region: z.string(),
      postalCode: z.string(),
      country: z.string().default("US"),
    })
    .optional(),
  /**
   * Towns, counties, or regions you serve: ["Grand Junction", "Fruita", "Palisade"]. Emitted as
   * `areaServed` for local search, and shown as a "Serving …" line in the footer.
   */
  areaServed: z.array(z.string()).optional(),
  /** schema.org format: ["Mo-Fr 07:45-17:15"]. */
  openingHours: z.array(z.string()).optional(),
  foundingYear: z.string().optional(),
  /** Defaults to nav.logo. */
  logo: Image.optional(),
});

/* -------------------------------------------------------------------------- */
/* Global chrome                                                              */
/* -------------------------------------------------------------------------- */

const AnnouncementTone = z.enum(["accent", "inverse", "muted"]).default("accent");

/**
 * Hello bar above the nav.
 *  bar:     one line, optional link, optionally dismissible (remembered per visitor;
 *           the only chrome that ships JS, a few hundred bytes, and only when dismissible).
 *  marquee: scrolling items. Stops and wraps under prefers-reduced-motion;
 *           the duplicated loop is aria-hidden and inert.
 */
export const Announcement = z.discriminatedUnion("variant", [
  z.object({
    variant: z.literal("bar"),
    text: z.string(),
    link: Link.optional(),
    dismissible: z.boolean().default(false),
    tone: AnnouncementTone,
  }),
  z.object({
    variant: z.literal("marquee"),
    items: z.array(z.string().min(1)).min(1),
    tone: AnnouncementTone,
  }),
]);

export const NavStyle = z.enum(["solid", "floating", "transparent"]);

/**
 * Nav
 *  layout logo-left:   logo, links, CTA in one row.
 *  layout logo-center: links split either side of a centred logo.
 *  style solid:        own background.  floating: inset card.
 *  style transparent:  over the first block, solid once scrolled (CSS scroll-driven,
 *                      no JS). Only valid over a full-bleed hero or an inverse/accent
 *                      first block; otherwise it renders solid and lint warns.
 * Mobile: a native popover menu (no JS). No logo: the site name is the wordmark.
 */
export const Nav = z.object({
  layout: z.enum(["logo-left", "logo-center"]),
  style: NavStyle.default("solid"),
  sticky: z.boolean().default(true),
  logo: Logo.optional(),
  /** Typed name. Defaults to site.name. Hidden when logo.kind is "wordmark". */
  wordmark: z.string().optional(),
  /** Lint: more than 6 means the IA is wrong, not the nav. */
  items: z.array(Link),
  cta: Cta.optional(),
  /**
   * Show `organization.phone` as a call link: beside the CTA on wider screens, and as a
   * "Call" bar fixed to the bottom of phone screens. For businesses whose goal is the phone
   * ringing. Ignored without `organization.phone`.
   */
  call: z.boolean().default(false),
});

export const SocialNetwork = z.enum([
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "tiktok",
  "x",
  "bluesky",
]);

/** A line in the footer: plain text (address, hours) or a link. */
const FooterLine = z.union([z.string(), Link]);

/**
 * Footer
 *  columns: brand + blurb + social on one side, up to 4 link columns on the other.
 *  simple:  one compact band: brand, flattened links, social, legal.
 * No logo: the site name as wordmark.
 */
export const Footer = z.object({
  variant: z.enum(["columns", "simple"]),
  /** Defaults to nav.logo. */
  logo: Logo.optional(),
  blurb: z.string().optional(),
  /** Lint: more than 4 columns. */
  columns: z
    .array(z.object({ heading: z.string(), lines: z.array(FooterLine) }))
    .optional(),
  social: z.array(z.object({ network: SocialNetwork, href: z.string() })).optional(),
  /** Legal lines. `{year}` is replaced with the build year. */
  legal: z.array(FooterLine).optional(),
});

/* -------------------------------------------------------------------------- */
/* Blocks                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Hero — the opening statement of a page. Renders the page's h1.
 *  full-bleed: image fills the viewport width, text overlaid on a scrim.
 *  contained:  image in a framed panel inside the grid, text above.
 *  split:      text one side, image the other (`imageSide`).
 *  text-only:  big type, no image.
 * No-image fallback: every variant renders as text-only.
 */
export const Hero = Section.extend({
  type: z.literal("hero"),
  variant: z.enum(["full-bleed", "contained", "split", "text-only"]),
  heading: Heading,
  body: Markdown.optional(),
  image: Image.optional(),
  /** split only. */
  imageSide: z.enum(["left", "right"]).default("right"),
  /** Lint: more than 2. */
  ctas: z.array(Cta).optional(),
  /** Small print under the CTAs: "51 Fir Ave, Crawford, CO". */
  meta: z.string().optional(),
});

/**
 * Page header — the quieter hero for interior pages. Renders the page's h1.
 *  simple:     eyebrow, heading, intro.
 *  with-image: the same, plus a wide image band below.
 * No-image fallback: simple.
 */
export const PageHeader = Section.extend({
  type: z.literal("pageHeader"),
  variant: z.enum(["simple", "with-image"]),
  heading: Heading,
  image: Image.optional(),
  /** Home › Parent › This page, derived from the slug and page labels. */
  breadcrumbs: z.boolean().default(false),
});

/**
 * Intro — the main statement of a section.
 *  centered:   short statement, centred.
 *  two-column: heading left, body right.
 * Never uses images.
 */
export const Intro = Section.extend({
  type: z.literal("intro"),
  variant: z.enum(["centered", "two-column"]),
  /** Markdown, block. */
  body: Markdown,
});

export const CardItem = z.object({
  /** Small label above the title: "Level 01", "Ages 2–3". In `numbered`, defaults to 01, 02… */
  label: z.string().optional(),
  /** Pill on the card: "Waitlist", "New". */
  tag: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  /** Markdown. */
  body: Markdown.optional(),
  image: Image.optional(),
  /** Lucide icon name, e.g. "shield-check". Unknown names fail the build. */
  icon: z.string().optional(),
  link: Link.optional(),
});

/**
 * Cards — a grid of parallel things.
 *  image:    photo on top.
 *  icon:     small icon, good for services.
 *  numbered: big "01" style label, no media. The thin-content workhorse.
 *  text:     plain, for dense lists.
 * `tags` is an optional pill row under the grid: "Spanish, Art, Music, PE".
 * No-image fallback: `image` renders as `numbered` if any item lacks an image (mixed media looks broken);
 * `icon` renders as `numbered` if any item lacks an icon.
 */
export const Cards = Section.extend({
  type: z.literal("cards"),
  variant: z.enum(["image", "icon", "numbered", "text"]),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  items: z.array(CardItem).min(1),
  tags: z
    .object({ label: z.string().optional(), items: z.array(z.string()).min(1) })
    .optional(),
});

/**
 * Feature rows — alternating image/text rows, for 2–4 things that each need a paragraph.
 * `startSide` is the image side of the first row.
 * No-image fallback: each row becomes a two-column intro (label + title left, body right).
 * Rows with and without images can mix; each row falls back on its own.
 */
export const FeatureRows = Section.extend({
  type: z.literal("featureRows"),
  startSide: z.enum(["left", "right"]).default("left"),
  /** Lint: more than 4. */
  items: z
    .array(
      z.object({
        label: z.string().optional(),
        title: z.string(),
        /** Markdown, block. */
        body: Markdown,
        image: Image.optional(),
        link: Cta.optional(),
      }),
    )
    .min(1),
});

/**
 * Features — short, bullet-style selling points: icon, title, a line or two. No boxes.
 *  grid:  icon above the title, 2–4 columns.
 *  split: heading and intro on the left, the points stacked on the right.
 *  list:  compact two-column list, small icon beside each point. Good for 6–12 points.
 * Use cards for things that need a box or a link, feature rows for things that need a paragraph.
 * Items without an icon get a check mark. Never uses images.
 */
export const Features = Section.extend({
  type: z.literal("features"),
  variant: z.enum(["grid", "split", "list"]).default("grid"),
  /** grid only. */
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  /** Lint: more than 12. */
  items: z
    .array(
      z.object({
        /** Lucide icon name, e.g. "zap". Defaults to a check mark. */
        icon: z.string().optional(),
        title: z.string(),
        /** Markdown, one or two sentences. */
        body: Markdown.optional(),
      }),
    )
    .min(1),
});

/**
 * Quote — a pull quote or a set of testimonials.
 *  single: one big pull quote. Works for a mission statement too.
 *  grid:   2–3 short testimonials.
 * No-image fallback: no avatar. Deliberately not initials.
 */
export const Quote = Section.extend({
  type: z.literal("quote"),
  variant: z.enum(["single", "grid"]),
  items: z
    .array(
      z.object({
        text: z.string(),
        name: z.string(),
        role: z.string().optional(),
        photo: Image.optional(),
      }),
    )
    .min(1),
});

/**
 * Stats — 2–4 big numbers. Cheap credibility for orgs with no photos.
 * Never uses images.
 */
export const Stats = Section.extend({
  type: z.literal("stats"),
  /** Lint: fewer than 2 or more than 4. */
  items: z.array(z.object({ value: z.string(), label: z.string() })).min(1),
});

/**
 * Logos — a recognition strip: partners, press, awards.
 *  grid:    static grid.
 *  marquee: scrolling row. Stops under prefers-reduced-motion; the loop copy is aria-hidden.
 * No-image fallback: each item without a logo renders as a text badge (icon · year · name · source).
 * When every item is text, grid puts the header beside the badges on wide screens.
 */
export const Logos = Section.extend({
  type: z.literal("logos"),
  variant: z.enum(["grid", "marquee"]),
  items: z
    .array(
      z.object({
        name: z.string(),
        logo: Image.optional(),
        year: z.string().optional(),
        /** Awarding body or publication: "Colorado Dept. of Education". */
        source: z.string().optional(),
        href: z.string().optional(),
        /** Lucide icon name for a text badge (no logo): "award", "handshake". Ignored with a logo. */
        icon: z.string().optional(),
      }),
    )
    .min(1),
});

/**
 * Team — the people.
 *  grid: headshot, name, role.
 *  list: name, role, short bio. For when there are no headshots.
 * No-image fallback: grid shows a neutral tile with initials.
 */
export const Team = Section.extend({
  type: z.literal("team"),
  variant: z.enum(["grid", "list"]),
  columns: z.union([z.literal(3), z.literal(4)]).default(4),
  people: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        /** Markdown. */
        bio: Markdown.optional(),
        photo: Image.optional(),
        email: z.string().optional(),
      }),
    )
    .min(1),
});

/**
 * FAQ — native <details>, no JS. Emits FAQPage JSON-LD.
 *  stacked: header above, questions below.
 *  split:   header left (sticky), questions right.
 * Never uses images.
 */
export const Faq = Section.extend({
  type: z.literal("faq"),
  variant: z.enum(["stacked", "split"]),
  /** `a` is markdown, block. */
  items: z.array(z.object({ q: z.string(), a: Markdown })).min(1),
});

/**
 * Pricing — prices, plans, and rate sheets.
 *  tiers: 2–3 columns with features. Services, memberships.
 *  list:  name / price rows. Menus, ticket prices, rate sheets.
 * Never uses images.
 */
export const Pricing = Section.extend({
  type: z.literal("pricing"),
  variant: z.enum(["tiers", "list"]),
  items: z
    .array(
      z.object({
        name: z.string(),
        /** String on purpose: "$12", "Free", "Sliding scale". */
        price: z.string(),
        /** Shown after the price, smaller: "/mo", "per seat". */
        unit: z.string().optional(),
        description: z.string().optional(),
        /** Pill beside the name: "In season", "Sold out", "Booking 2027". */
        tag: z.string().optional(),
        /** tiers only. */
        features: z.array(z.string()).optional(),
        featured: z.boolean().default(false),
        cta: Cta.optional(),
      }),
    )
    .min(1),
  /** Fine print. Markdown. */
  note: Markdown.optional(),
});

/**
 * Events — schedules, showtimes, nonprofit events, seasonal hours.
 *  list:  date column + details. Dense, scannable.
 *  cards: image cards with a date badge.
 * Events that ended before the build date are hidden; pair with a scheduled rebuild.
 * No upcoming events renders `emptyText`.
 * No-image fallback: cards show a large date tile instead of the photo.
 */
export const Events = Section.extend({
  type: z.literal("events"),
  variant: z.enum(["list", "cards"]),
  items: z.array(
    z.object({
      title: z.string(),
      /** YYYY-MM-DD. */
      date: z.iso.date(),
      endDate: z.iso.date().optional(),
      /** Free text: "7:00 & 9:30 pm". */
      time: z.string().optional(),
      location: z.string().optional(),
      /** Markdown. */
      body: Markdown.optional(),
      image: Image.optional(),
      link: Link.optional(),
    }),
  ),
  emptyText: z.string().default("No upcoming events. Check back soon."),
});

/**
 * Gallery — for clients whose only good asset is a folder of photos.
 *  grid:    even tiles.
 *  masonry: natural aspect ratios in columns.
 *  cluster: 3 overlapping photos. Fewer than 3 renders as grid.
 * No-image fallback: the block is omitted entirely (a gallery of nothing is nothing).
 */
export const Gallery = Section.extend({
  type: z.literal("gallery"),
  variant: z.enum(["grid", "masonry", "cluster"]),
  images: z.array(Image),
});

/**
 * CTA banner — a call-to-action band.
 *  simple:      heading + buttons on a toned band.
 *  with-images: text + photo cluster beside it.
 *  split:       text left, details (contact info, hours) right.
 * `details` renders in every variant: beside the text in split, under the buttons otherwise.
 * No-image fallback: with-images renders as simple.
 */
export const CtaBanner = Section.extend({
  type: z.literal("cta"),
  variant: z.enum(["simple", "with-images", "split"]),
  heading: Heading,
  body: Markdown.optional(),
  /** Lint: more than 2. */
  ctas: z.array(Cta).optional(),
  /** Lint: more than 3 (only the first 3 render). */
  images: z.array(Image).optional(),
  /** Markdown, block. */
  details: Markdown.optional(),
});

/**
 * Link list — resources, forms, external portals.
 *  grid:  link cards in 2–3 columns.
 *  split: section header left, a stacked list of links right.
 * Never uses images.
 */
export const LinkList = Section.extend({
  type: z.literal("linkList"),
  variant: z.enum(["grid", "split"]).default("grid"),
  columns: z.union([z.literal(2), z.literal(3)]).default(3),
  items: z.array(Link.extend({ description: z.string().optional() })).min(1),
});

export const FormField = z.object({
  name: z.string().regex(/^[A-Za-z][\w-]*$/, "field names must be identifiers"),
  label: z.string(),
  kind: z.enum(["text", "email", "tel", "textarea", "select"]),
  required: z.boolean().default(false),
  /** A line of guidance under the label (linked with aria-describedby). */
  help: z.string().optional(),
  /** select only. */
  options: z.array(z.string()).optional(),
});

/**
 * Contact — a form, contact details, or both.
 *  form:         form only.
 *  form-details: form + address/hours/phone sidebar.
 *  details:      no form. Address, hours, phone, map link.
 * The form posts to `action` with no JS. On success the endpoint redirects back to
 * `#<id>-sent`, which reveals `successText` via CSS :target.
 * Never uses images.
 */
export const Contact = Section.extend({
  type: z.literal("contact"),
  variant: z.enum(["form", "form-details", "details"]),
  form: z
    .object({
      /**
       * Endpoint — the adapter boundary. "/api/contact" is the bundled Cloudflare
       * Worker (Email Service). Formspree, Web3Forms, etc. work too.
       */
      action: z.string().default("/api/contact"),
      /** Shown in the notification email's subject. */
      subject: z.string().optional(),
      fields: z
        .array(FormField)
        .min(1)
        .default([
          { name: "name", label: "Name", kind: "text", required: true },
          { name: "email", label: "Email", kind: "email", required: true },
          { name: "message", label: "Message", kind: "textarea", required: true },
        ]),
      submitLabel: z.string().default("Send"),
      successText: z.string().default("Thanks! We'll be in touch."),
    })
    .optional(),
  details: z
    .object({
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      /** ["Mon–Fri 8:15–3:11"]. Seasonal: one line per season, "Summer (June–Oct): daily 9–6". */
      hours: z.array(z.string()).optional(),
      /** Link out, not an embed. Use an embed block for a map. */
      mapHref: z.string().optional(),
    })
    .optional(),
}).superRefine((c, ctx) => {
  if (c.variant !== "details" && !c.form) {
    ctx.addIssue({ code: "custom", message: `contact variant "${c.variant}" needs a form`, path: ["form"] });
  }
  if (c.variant !== "form" && !c.details) {
    ctx.addIssue({ code: "custom", message: `contact variant "${c.variant}" needs details`, path: ["details"] });
  }
});

/**
 * Rich text — markdown body for interior pages. The default content block.
 *  width prose: ~68ch reading column.  wide: full container.
 * Never uses images (put photos in a gallery or feature rows).
 */
export const RichText = Section.extend({
  type: z.literal("richText"),
  width: z.enum(["prose", "wide"]).default("prose"),
  /** Markdown, block. */
  body: Markdown,
});

/**
 * Embed — escape hatch for third-party widgets: video, map, booking, donation form.
 * Third-party embeds cost Lighthouse points; iframes are lazy-loaded.
 * Never uses images.
 */
export const Embed = Section.extend({
  type: z.literal("embed"),
  kind: z.enum(["iframe", "html"]),
  src: z.string().optional(),
  /** Required for iframes: the accessible name. */
  title: z.string().optional(),
  html: z.string().optional(),
  aspect: z.enum(["16/9", "4/3", "1/1", "auto"]).default("auto"),
}).superRefine((e, ctx) => {
  if (e.kind === "iframe" && (!e.src || !e.title)) {
    ctx.addIssue({ code: "custom", message: "iframe embeds need src and title", path: ["src"] });
  }
  if (e.kind === "html" && !e.html) {
    ctx.addIssue({ code: "custom", message: "html embeds need html", path: ["html"] });
  }
});

/**
 * Custom — escape hatch for genuine one-offs.
 * `component` names a file in `src/sites/<id>/custom/<component>.astro`, which
 * exports a Zod `schema` for its props. Props are validated against it at build.
 * Gets the shared section chrome (tone, eyebrow, heading…) like any block.
 * No-image fallback: up to the component; document it in the component.
 */
export const Custom = Section.extend({
  type: z.literal("custom"),
  component: z.string().regex(/^[A-Za-z][\w-]*$/),
  props: z.record(z.string(), z.unknown()).default({}),
});

export const Block = z.discriminatedUnion("type", [
  Hero,
  PageHeader,
  Intro,
  Cards,
  FeatureRows,
  Features,
  Quote,
  Stats,
  Logos,
  Team,
  Faq,
  Pricing,
  Events,
  Gallery,
  CtaBanner,
  LinkList,
  Contact,
  RichText,
  Embed,
  Custom,
]);

/* -------------------------------------------------------------------------- */
/* Pages and site                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Per-page chrome. `false` hides all chrome.
 * Object form overrides pieces: hide the announcement, switch the nav to
 * transparent over this page's hero, or drop the footer.
 * Landing pages: `nav: { minimal: true }` shows only the logo (linking home) and one
 * CTA, so visitors stay focused but are never stranded. `cta` replaces the site CTA
 * on this page (e.g. jump to the page's own form); `false` hides it.
 */
export const PageChrome = z.union([
  z.literal(false),
  z.object({
    announcement: z.boolean().default(true),
    nav: z
      .union([
        z.literal(false),
        z.object({
          style: NavStyle.optional(),
          sticky: z.boolean().optional(),
          minimal: z.boolean().optional(),
          cta: z.union([z.literal(false), Cta]).optional(),
        }),
      ])
      .optional(),
    footer: z.boolean().default(true),
  }),
]);

export const Page = z.object({
  /** "/", "/programs", "/programs/acorn-room". */
  slug: z.string().regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, 'slugs look like "/" or "/about/team"'),
  /** <title>. Used as-is. */
  title: z.string(),
  /** Short name for breadcrumbs. Defaults to the hero/page header heading. */
  label: z.string().optional(),
  description: z.string().optional(),
  /** Defaults to site.ogImage, then the first image on the page. */
  ogImage: Image.optional(),
  chrome: PageChrome.optional(),
  /** Keep this page out of search engines (e.g. preview frames). */
  noindex: z.boolean().optional(),
  blocks: z.array(Block),
});

/**
 * Posts (blog, news) live in an Astro content collection as markdown in
 * `src/sites/<id>/posts/`, not in this config. This sets how they render.
 */
export const Posts = z.object({
  enabled: z.boolean().default(false),
  basePath: z.string().default("/news"),
  label: z.string().default("News"),
  /** Index page intro. */
  intro: z.string().optional(),
  /** article: single column.  article-sidebar: article + recent posts aside. */
  layout: z.enum(["article", "article-sidebar"]).default("article"),
  /** Index layout. cards reuses the Cards block (image cards, numbered fallback). */
  index: z.enum(["cards", "list"]).default("cards"),
});

export const Analytics = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("ga4"), id: z.string() }),
  z.object({ provider: z.literal("plausible"), domain: z.string(), src: z.string().default("https://plausible.io/js/script.js") }),
  z.object({ provider: z.literal("fathom"), site: z.string() }),
  z.object({ provider: z.literal("umami"), websiteId: z.string(), src: z.string() }),
  z.object({ provider: z.literal("cloudflare"), token: z.string() }),
  z.object({ provider: z.literal("custom"), src: z.string(), attrs: z.record(z.string(), z.string()).default({}) }),
]);

export const Site = z.object({
  name: z.string(),
  /**
   * draft:   not deployed.
   * preview: deployed at <folder>.<baseDomain>, hidden from search engines. [[placeholders]] and
   *          missing images render as visible prompts.
   * live:    strict. The build fails while any placeholder or image is missing.
   */
  status: z.enum(["draft", "preview", "live"]).default("live"),
  /**
   * Inbox for contact-form submissions. Must be a verified destination address in Cloudflare
   * Email Routing. Defaults to the studio inbox (CONTACT_TO in wrangler.jsonc).
   */
  formsTo: z.email().optional(),
  /** Production origin, no trailing slash. Used for canonical URLs and external-link detection. */
  url: z.url(),
  locale: z.string().default("en-US"),
  theme: Theme,
  organization: Organization.optional(),
  /** Default social share image. */
  ogImage: Image.optional(),
  announcement: Announcement.optional(),
  nav: Nav,
  footer: Footer,
  pages: z.array(Page).min(1),
  /**
   * Old paths that moved: { "/for/energy": "/for" }. A path, or a full URL for another site.
   * Answered with a 301 by the Worker; `npm run dev` doesn't apply them.
   */
  redirects: z.record(z.string().regex(/^\/[^?#]*$/, 'redirect sources are paths like "/old-page"'), z.string()).optional(),
  posts: Posts.optional(),
  analytics: z.array(Analytics).optional(),
});

export type Site = z.infer<typeof Site>;
export type SiteInput = z.input<typeof Site>;
export type Page = z.infer<typeof Page>;
export type Block = z.infer<typeof Block>;
export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;
export type Image = z.infer<typeof Image>;
export type Logo = z.infer<typeof Logo>;
export type Link = z.infer<typeof Link>;
export type Cta = z.infer<typeof Cta>;
export type Heading = z.infer<typeof Heading>;
export type Tone = z.infer<typeof Tone>;
export type Theme = z.infer<typeof Theme>;
export type Preset = z.infer<typeof Preset>;
