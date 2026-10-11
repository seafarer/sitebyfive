import { defineSite } from "../../schema/define";
import type { SiteInput, Preset } from "../../schema/site-schema";
import { calloutSchema } from "./custom/callout.schema";

/**
 * Showcase — every block and variant, with and without images, under every preset.
 * Pages are generated: /<preset>/<block> for each preset and block type, plus a
 * preset overview at /<preset> and an index at /. Tones cycle through each page so
 * every surface is exercised. Built from blocks like any other site.
 */

type Blocks = SiteInput["pages"][number]["blocks"];
type Block = Blocks[number];

const PRESETS: Preset[] = ["muted", "business", "warm", "bright", "fun"];
const TONES = ["default", "muted", "tint", "inverse", "accent"] as const;

const img = (n: number, alt = `Abstract sample artwork ${n}`) => ({ src: `sample/${String(n).padStart(2, "0")}.svg`, alt });
const avatar = (n: number, name: string) => ({ src: `sample/avatar-${n}.svg`, alt: name });
const logo = (name: string) => ({ src: `logos/${name.toLowerCase()}.svg`, alt: name });

const people = [
  { name: "Alex Rivera", role: "Director", bio: "Alex leads the team and still answers the phone on Fridays." },
  { name: "Jordan Kim", role: "Program lead", bio: "Jordan designs programs and keeps everyone on schedule." },
  { name: "Sam Patel", role: "Operations", bio: "Sam makes sure the lights stay on and the forms get filed." },
  { name: "Riley Chen", role: "Community", bio: "Riley runs events, newsletters, and the occasional bake sale." },
];

const cardItems = (withImages: boolean) => [
  { label: "Level 01", title: "First thing", subtitle: "A short subtitle", body: "One or two sentences that explain the thing clearly.", icon: "sparkles", image: withImages ? img(1) : undefined, link: { label: "Learn more about the first thing", href: "#" } },
  { label: "Level 02", tag: "Popular", title: "Second thing", subtitle: "A short subtitle", body: "One or two sentences that explain the thing clearly.", icon: "compass", image: withImages ? img(2) : undefined, link: { label: "Learn more about the second thing", href: "#" } },
  { label: "Level 03", title: "Third thing", subtitle: "A short subtitle", body: "One or two sentences that explain the thing clearly.", icon: "leaf", image: withImages ? img(3) : undefined, link: { label: "Learn more about the third thing", href: "#" } },
];

const future = (days: number) => new Date(Date.UTC(2027, 0, 1) + days * 864e5).toISOString().slice(0, 10);

/** Every variant of every block. `label` becomes the eyebrow so each example is identified. */
const examples: Record<string, { purpose: string; fallback: string; blocks: Block[] }> = {
  hero: {
    purpose: "The opening statement of a page. Renders the page's h1.",
    fallback: "Without an image, every variant renders as text-only.",
    blocks: [
      { type: "hero", variant: "full-bleed", eyebrow: "full-bleed · with image", heading: { text: "Big idea, full-bleed backdrop.", accent: "full-bleed" }, body: "Text sits on a scrim over the image.", image: img(5), ctas: [{ label: "Primary action", href: "#" }, { label: "Secondary", href: "#", style: "secondary" }], meta: "Meta line · small print" },
      { type: "hero", variant: "contained", eyebrow: "contained · with image", heading: "Image in a framed panel.", body: "Heading left, body and actions right, image below.", image: img(1), ctas: [{ label: "Primary action", href: "#" }] },
      { type: "hero", variant: "split", imageSide: "right", eyebrow: "split · image right", heading: "Text on one side, image on the other.", body: "Use imageSide to flip it.", image: img(2), ctas: [{ label: "Primary action", href: "#" }, { label: "Text link", href: "#", style: "text" }] },
      { type: "hero", variant: "split", imageSide: "left", tone: "muted", eyebrow: "split · image left · muted tone", heading: "The same, mirrored.", image: img(6), ctas: [{ label: "Primary action", href: "#" }] },
      { type: "hero", variant: "split", eyebrow: "split · no image → text-only", heading: { text: "No image? Still a strong opener.", accent: "Still" }, body: "Every hero variant falls back to text-only.", ctas: [{ label: "Primary action", href: "#" }] },
      { type: "hero", variant: "text-only", tone: "inverse", eyebrow: "text-only · inverse tone", heading: "Big type does the work.", body: "The thin-content workhorse.", ctas: [{ label: "Primary action", href: "#" }, { label: "Secondary", href: "#", style: "secondary" }] },
    ],
  },
  pageHeader: {
    purpose: "The quieter opener for interior pages. Renders the page's h1.",
    fallback: "with-image without an image renders as simple.",
    blocks: [
      { type: "pageHeader", variant: "simple", breadcrumbs: true, eyebrow: "simple · breadcrumbs", heading: "Page header", intro: "Eyebrow, heading, and a short intro." },
      { type: "pageHeader", variant: "with-image", tone: "muted", eyebrow: "with-image", heading: { text: "With a wide image band", accent: "wide" }, intro: "The image runs the width of the container.", image: img(7) },
      { type: "pageHeader", variant: "with-image", eyebrow: "with-image · no image → simple", heading: "Falls back gracefully" },
    ],
  },
  intro: {
    purpose: "The main statement of a section.",
    fallback: "Never uses images.",
    blocks: [
      { type: "intro", variant: "centered", eyebrow: "centered", heading: { text: "A short statement, centered.", accent: "centered" }, body: "Good for mission statements and the paragraph after the hero. Supports **markdown**." },
      { type: "intro", variant: "two-column", tone: "muted", eyebrow: "two-column", heading: "Heading left, body right.", body: "For a meatier paragraph. The body can run to two or three paragraphs.\n\nLike this one.", link: { label: "Section link", href: "#", style: "text" } },
    ],
  },
  cards: {
    purpose: "A grid of parallel things: programs, services, steps.",
    fallback: "image renders as numbered if any item lacks an image; icon renders as numbered if any item lacks an icon.",
    blocks: [
      { type: "cards", variant: "image", columns: 3, eyebrow: "image · 3 columns", heading: "Image cards", items: cardItems(true), tags: { label: "Tags row", items: ["Spanish", "Art", "Music", "PE"] } },
      { type: "cards", variant: "image", columns: 3, eyebrow: "image · missing images → numbered", heading: "Image cards without images", items: cardItems(false) },
      { type: "cards", variant: "icon", columns: 3, eyebrow: "icon", heading: "Icon cards", items: cardItems(false).map(({ image: _i, ...c }) => c) },
      { type: "cards", variant: "numbered", columns: 4, eyebrow: "numbered · 4 columns · auto labels", heading: "Numbered cards", items: [...cardItems(false).map(({ label: _l, ...c }) => c), { title: "Fourth thing", body: "Labels default to 01, 02…" }] },
      { type: "cards", variant: "text", columns: 2, eyebrow: "text · 2 columns", heading: "Text cards", items: cardItems(false).slice(0, 2) },
    ],
  },
  featureRows: {
    purpose: "Alternating image/text rows for 2–4 things that each need a paragraph.",
    fallback: "Each row without an image becomes a two-column intro. Rows fall back individually.",
    blocks: [
      { type: "featureRows", startSide: "left", eyebrow: "with images · startSide left", heading: "Feature rows", items: [
        { label: "One", title: "The first feature", body: "A paragraph about it.", image: img(8), link: { label: "Learn more", href: "#", style: "text" } },
        { label: "Two", title: "The second feature", body: "A paragraph about it.", image: img(9) },
      ] },
      { type: "featureRows", startSide: "right", eyebrow: "startSide right · mixed (last row has no image)", heading: "Mixed rows", items: [
        { label: "One", title: "With an image", body: "A paragraph about it.", image: img(10) },
        { label: "Two", title: "Without an image", body: "This row falls back to the two-column layout." },
      ] },
      { type: "featureRows", eyebrow: "no images", heading: "Text-only rows", items: [
        { label: "One", title: "First", body: "A paragraph about it." },
        { label: "Two", title: "Second", body: "A paragraph about it." },
        { label: "Three", title: "Third", body: "A paragraph about it." },
      ] },
    ],
  },
  features: {
    purpose: "Short, bullet-style selling points: icon, title, a line or two. No boxes, no links.",
    fallback: "Never uses images. Items without an icon get a check mark.",
    blocks: [
      { type: "features", variant: "grid", columns: 3, eyebrow: "grid · 3 columns", heading: "Everything you need", intro: "Icon above the title, no boxes.", items: [
        { icon: "zap", title: "Fast setup", body: "Up and running in an afternoon, not a quarter." },
        { icon: "shield-check", title: "Secure by default", body: "Sensible defaults at every layer, nothing to configure." },
        { icon: "sliders-horizontal", title: "Configurable", body: "Adapt the details to how your team already works." },
        { icon: "chart-line", title: "Clear reporting", body: "The numbers that matter, without the dashboard sprawl." },
        { icon: "users", title: "Built for teams", body: "Share work across the whole organisation." },
        { icon: "plug", title: "Connects", body: "Works with the tools you already use." },
      ] },
      { type: "features", variant: "split", eyebrow: "split", heading: "Why teams switch", intro: "Heading on the left, points stacked on the right.", items: [
        { icon: "clock", title: "Saves hours every week", body: "Routine work happens on its own, so people can do the rest." },
        { icon: "message-circle", title: "Real support", body: "A named person who knows your account answers within a day." },
        { title: "No icon", body: "Items without an icon get a check mark." },
      ] },
      { type: "features", variant: "list", eyebrow: "list · no icons", heading: "What's included", items: [
        { title: "Unlimited projects" },
        { title: "Priority support", body: "Answers within one business day." },
        { title: "Single sign-on" },
        { title: "Audit log", body: "Every change, who made it, and when." },
        { title: "Custom domains" },
        { title: "Data export", body: "CSV or JSON, any time." },
      ] },
    ],
  },
  quote: {
    purpose: "A pull quote or a set of testimonials.",
    fallback: "No photo means no avatar (deliberately not initials).",
    blocks: [
      { type: "quote", variant: "single", eyebrow: "single · with photo", items: [{ text: "A single, memorable sentence from someone who means it.", name: "Alex Rivera", role: "Director", photo: avatar(1, "Alex Rivera") }] },
      { type: "quote", variant: "single", eyebrow: "single · no photo", items: [{ text: "Works just as well for a mission statement.", name: "The team" }] },
      { type: "quote", variant: "grid", eyebrow: "grid · with photos", heading: "Testimonials", items: people.slice(0, 3).map((p, i) => ({ text: "Short, specific, and believable praise.", name: p.name, role: p.role, photo: avatar(i + 1, p.name) })) },
      { type: "quote", variant: "grid", eyebrow: "grid · no photos", heading: "Testimonials without photos", items: people.slice(0, 2).map((p) => ({ text: "Short, specific, and believable praise.", name: p.name, role: p.role })) },
    ],
  },
  stats: {
    purpose: "2–4 big numbers. Cheap credibility for orgs with no photos.",
    fallback: "Never uses images.",
    blocks: [
      { type: "stats", eyebrow: "4 stats", heading: "By the numbers", items: [{ value: "1:7", label: "ratio" }, { value: "14", label: "per class" }, { value: "2 acres", label: "outdoors" }, { value: "15+", label: "years" }] },
      { type: "stats", eyebrow: "3 stats", items: [{ value: "100%", label: "fee-only" }, { value: "12 mo.", label: "planning calendar" }, { value: "60", label: "families per adviser" }] },
      { type: "stats", eyebrow: "2 stats", items: [{ value: "80 kWh", label: "storage" }, { value: "30 min", label: "to deploy" }] },
    ],
  },
  logos: {
    purpose: "A recognition strip: partners, press, awards.",
    fallback: "Items without a logo render as text badges: year · name · source.",
    blocks: [
      { type: "logos", variant: "grid", eyebrow: "grid · logos", items: ["Acme", "Northwind", "Globex", "Initech", "Umbrella", "Hooli"].map((n) => ({ name: n, logo: logo(n) })) },
      { type: "logos", variant: "grid", eyebrow: "grid · text badges", items: [
        { name: "Best Small Business", year: "2026", source: "City Paper" },
        { name: "Four-star rating", year: "2025", source: "State Quality Board" },
        { name: "Community Partner", year: "2024", source: "Local Foundation" },
      ] },
      { type: "logos", variant: "marquee", eyebrow: "marquee · logos (stops under reduced motion)", items: ["Acme", "Northwind", "Globex", "Initech", "Umbrella", "Hooli"].map((n) => ({ name: n, logo: logo(n) })) },
      { type: "logos", variant: "marquee", eyebrow: "marquee · text badges", items: [
        { name: "Best Small Business", year: "2026", source: "City Paper" },
        { name: "Four-star rating", year: "2025", source: "State Quality Board" },
        { name: "Community Partner", year: "2024", source: "Local Foundation" },
        { name: "Readers' Choice", year: "2023", source: "Weekly Gazette" },
      ] },
    ],
  },
  team: {
    purpose: "The people.",
    fallback: "Grid without photos shows a neutral tile with initials.",
    blocks: [
      { type: "team", variant: "grid", columns: 4, eyebrow: "grid · with photos", heading: "Team", people: people.map((p, i) => ({ ...p, bio: undefined, photo: i < 3 ? avatar(i + 1, p.name) : undefined })) },
      { type: "team", variant: "grid", columns: 3, eyebrow: "grid · no photos → initials", heading: "Team without photos", people: people.slice(0, 3).map((p) => ({ name: p.name, role: p.role })) },
      { type: "team", variant: "list", eyebrow: "list", heading: "Team with bios", people: people.map((p) => ({ ...p, email: `${p.name.split(" ")[0]!.toLowerCase()}@example.com` })) },
    ],
  },
  faq: {
    purpose: "Native <details>, no JS. Emits FAQPage JSON-LD.",
    fallback: "Never uses images.",
    blocks: [
      { type: "faq", variant: "stacked", eyebrow: "stacked", heading: "Questions", items: [
        { q: "Does this need JavaScript?", a: "No. It's a native `<details>` element." },
        { q: "Can answers use markdown?", a: "Yes: **bold**, _italic_, [links](#), and lists." },
      ] },
      { type: "faq", variant: "split", eyebrow: "split", heading: "Questions, split", intro: "Header left, questions right.", items: [
        { q: "What's the difference?", a: "Only the layout." },
        { q: "Is the header sticky?", a: "On large screens, yes." },
        { q: "One more?", a: "Sure." },
      ] },
    ],
  },
  pricing: {
    purpose: "Tiers for services and memberships; a list for menus, tickets, and rate sheets.",
    fallback: "Never uses images.",
    blocks: [
      { type: "pricing", variant: "tiers", eyebrow: "tiers", heading: "Plans", items: [
        { name: "Basic", price: "Free", description: "For getting started.", features: ["One thing", "Another thing"], cta: { label: "Start free", href: "#", style: "secondary" } },
        { name: "Standard", price: "$12", unit: "/ mo", description: "For most people.", features: ["Everything in Basic", "More things", "Even more"], featured: true, cta: { label: "Choose Standard", href: "#" } },
        { name: "Custom", price: "Let's talk", features: ["Anything you need"], cta: { label: "Contact us", href: "#", style: "secondary" } },
      ], note: "Fine print goes here." },
      { type: "pricing", variant: "list", eyebrow: "list", heading: "Price list", items: [
        { name: "Adult", price: "$12" },
        { name: "Child", price: "$8", description: "Under 12" },
        { name: "Member", price: "$5", featured: true },
      ] },
    ],
  },
  events: {
    purpose: "Schedules, showtimes, and events. Past events hide at build time.",
    fallback: "Cards without an image show a large date tile.",
    blocks: [
      { type: "events", variant: "list", eyebrow: "list", heading: "Upcoming", items: [
        { title: "Opening night", date: future(10), time: "7:00 pm", location: "Main hall", body: "With **live music**.", link: { label: "Tickets", href: "#" } },
        { title: "Weekend workshop", date: future(20), endDate: future(21), location: "Studio B" },
      ] },
      { type: "events", variant: "cards", eyebrow: "cards · with and without images", heading: "Events as cards", items: [
        { title: "With an image", date: future(5), time: "6:00 pm", image: img(11), link: { label: "Details", href: "#" } },
        { title: "Without an image", date: future(12), location: "Online" },
        { title: "Multi-day", date: future(30), endDate: future(32), image: img(12) },
      ] },
      { type: "events", variant: "list", eyebrow: "empty state (only past events)", heading: "Past events are hidden", items: [{ title: "Last year", date: "2020-01-01" }], emptyText: "No upcoming events. Check back soon." },
    ],
  },
  gallery: {
    purpose: "For clients whose best asset is a folder of photos.",
    fallback: "With no images, the block is omitted entirely. Cluster with fewer than 3 renders as grid.",
    blocks: [
      { type: "gallery", variant: "grid", eyebrow: "grid", heading: "Grid", images: [1, 2, 3, 4, 5, 6].map((n) => img(n)) },
      { type: "gallery", variant: "masonry", eyebrow: "masonry", heading: "Masonry", images: [2, 6, 1, 10, 4, 7, 3].map((n) => img(n)) },
      { type: "gallery", variant: "cluster", eyebrow: "cluster", heading: "Cluster", intro: "Three overlapping photos with a header beside them.", images: [8, 9, 4].map((n) => img(n)) },
      { type: "gallery", variant: "cluster", eyebrow: "cluster · 2 images → grid", images: [11, 12].map((n) => img(n)) },
    ],
  },
  cta: {
    purpose: "A call to action band.",
    fallback: "with-images without images renders as simple. details render in every variant.",
    blocks: [
      { type: "cta", variant: "simple", eyebrow: "simple", heading: { text: "Ready when you are.", accent: "you" }, body: "One sentence of reassurance.", ctas: [{ label: "Primary", href: "#" }, { label: "Secondary", href: "#", style: "secondary" }], details: "Details line: hours, phone, or fine print." },
      { type: "cta", variant: "with-images", eyebrow: "with-images", heading: "Text with a photo cluster", body: "Up to three images.", ctas: [{ label: "Primary", href: "#" }], images: [3, 5, 9].map((n) => img(n)) },
      { type: "cta", variant: "with-images", eyebrow: "with-images · no images → simple", heading: "No images, no problem", ctas: [{ label: "Primary", href: "#" }] },
      { type: "cta", variant: "split", eyebrow: "split", heading: "Text left, details right", body: "Good for contact info.", ctas: [{ label: "Primary", href: "#" }], details: "**Office**  \n123 Main Street  \nMon–Fri, 9–5" },
    ],
  },
  linkList: {
    purpose: "Resources, forms, external portals.",
    fallback: "Never uses images.",
    blocks: [
      { type: "linkList", variant: "grid", columns: 3, eyebrow: "grid · 3 columns", heading: "Resources", items: [
        { label: "Handbook", href: "#", description: "Policies and routines." },
        { label: "External portal", href: "https://example.com", description: "Opens in a new tab." },
        { label: "Forms", href: "#", description: "Everything we need." },
      ] },
      { type: "linkList", variant: "grid", columns: 2, eyebrow: "grid · 2 columns", items: [
        { label: "First link", href: "#" },
        { label: "Second link", href: "#", description: "With a description." },
      ] },
      { type: "linkList", variant: "split", eyebrow: "split", heading: "Links, split", intro: "Header left, links right.", items: [
        { label: "Client portal", href: "https://example.com", description: "Statements and messages." },
        { label: "Disclosures", href: "#", description: "The fine print." },
        { label: "Privacy", href: "#" },
      ] },
    ],
  },
  contact: {
    purpose: "A no-JS form that posts to an endpoint, contact details, or both.",
    fallback: "Never uses images.",
    blocks: [
      { type: "contact", variant: "form", id: "form-only", eyebrow: "form", heading: "Send a message", form: { action: "/api/contact" } },
      { type: "contact", variant: "form-details", id: "form-details", eyebrow: "form-details", heading: "Get in touch", intro: "Form plus a details sidebar.", form: { action: "/api/contact", fields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "email", label: "Email", kind: "email", required: true },
        { name: "topic", label: "Topic", kind: "select", options: ["General", "Support"] },
        { name: "message", label: "Message", kind: "textarea", required: true },
      ] }, details: { address: "123 Main Street, Springfield", phone: "+1 555 010 0100", email: "hello@example.com", hours: ["Mon–Fri · 9–5"], mapHref: "https://www.openstreetmap.org" } },
      { type: "contact", variant: "details", id: "details-only", eyebrow: "details", heading: "Visit us", details: { address: "123 Main Street, Springfield", phone: "+1 555 010 0100", email: "hello@example.com", hours: ["Mon–Fri · 9–5", "Sat · 10–2"] } },
    ],
  },
  richText: {
    purpose: "Markdown body for interior pages.",
    fallback: "Never uses images.",
    blocks: [
      { type: "richText", width: "prose", eyebrow: "prose", heading: "Reading column", body: "A comfortable measure for long text.\n\n## A subheading\n\nParagraphs, **bold**, _italic_, [links](#), and lists:\n\n- One\n- Two\n- Three\n\n> A blockquote, for good measure." },
      { type: "richText", width: "wide", eyebrow: "wide", heading: "Wide", body: "Wide text flows into two columns on large screens.\n\nUseful for disclosures and fine print that nobody reads closely but everybody needs.\n\nA third paragraph to balance the columns." },
    ],
  },
  embed: {
    purpose: "Escape hatch for third-party widgets. Iframes are lazy-loaded.",
    fallback: "Never uses images.",
    blocks: [
      { type: "embed", kind: "iframe", eyebrow: "iframe · 16/9", heading: "A map", title: "OpenStreetMap example", src: "https://www.openstreetmap.org/export/embed.html?bbox=-0.13%2C51.50%2C-0.11%2C51.51&layer=mapnik", aspect: "16/9" },
      { type: "embed", kind: "html", eyebrow: "html", heading: "Raw HTML", html: "<div style=\"padding:2rem;text-align:center\"><p><strong>Third-party widget</strong> markup renders here.</p></div>" },
    ],
  },
  custom: {
    purpose: "Escape hatch for genuine one-offs. Per-site component, props validated by its own Zod schema.",
    fallback: "Up to the component.",
    blocks: [
      { type: "custom", component: "callout", eyebrow: "custom · callout", heading: "A one-off component", props: { icon: "lightbulb", title: "This is src/sites/showcase/custom/callout.astro", body: "Its props are validated against callout.schema.ts at build time." } },
    ],
  },
};

const blockTypes = Object.keys(examples);
const nice = (t: string) => t.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const presetName = (p: Preset) => p[0]!.toUpperCase() + p.slice(1);

const pagePresets: Record<string, Preset> = {};
const pages: SiteInput["pages"] = [];

for (const preset of PRESETS) {
  pagePresets[`/${preset}`] = preset;
  pages.push({
    slug: `/${preset}`,
    title: `${presetName(preset)} preset | Showcase`,
    label: presetName(preset),
    chrome: { nav: { style: "floating" } },
    blocks: [
      { type: "pageHeader", variant: "simple", breadcrumbs: true, eyebrow: "Preset", heading: { text: `The ${preset} preset`, accent: preset }, intro: "Every block below renders under this preset. The tones cycle so every surface appears." },
      { type: "linkList", variant: "grid", columns: 3, tone: "muted", heading: "Blocks", items: blockTypes.map((b) => ({ label: nice(b), href: `/${preset}/${b.toLowerCase()}`, description: examples[b]!.purpose })) },
      { type: "intro", variant: "centered", tone: "accent", heading: { text: "Accent tone, with an accented heading.", accent: "accented" }, body: "The accent style, eyebrow, buttons, and surfaces all come from the preset." },
      { type: "cta", variant: "simple", tone: "inverse", heading: "Inverse tone", ctas: [{ label: "Primary", href: "#" }, { label: "Secondary", href: "#", style: "secondary" }, { label: "Text", href: "#", style: "text" }] },
    ],
  });
  for (const type of blockTypes) {
    const ex = examples[type]!;
    const slug = `/${preset}/${type.toLowerCase()}`;
    pagePresets[slug] = preset;
    pages.push({
      slug,
      title: `${nice(type)} · ${presetName(preset)} | Showcase`,
      label: nice(type),
      description: ex.purpose,
      chrome: { nav: { style: type === "hero" ? "solid" : "floating" } },
      blocks: [
        ...(type === "hero" || type === "pageHeader"
          ? []
          : [{ type: "pageHeader", variant: "simple", breadcrumbs: true, eyebrow: `${presetName(preset)} preset`, heading: nice(type), intro: `${ex.purpose} **No-image fallback:** ${ex.fallback}` } as Block]),
        ...ex.blocks.map((b, i) => (b.type === "hero" || b.type === "pageHeader" || "tone" in b ? b : ({ ...b, tone: TONES[i % TONES.length] } as Block))),
        { type: "linkList", variant: "grid", columns: 3, tone: "muted", eyebrow: "Same block, other presets", items: PRESETS.filter((p) => p !== preset).map((p) => ({ label: `${nice(type)} · ${presetName(p)}`, href: `/${p}/${type.toLowerCase()}` })) },
      ],
    });
  }
}

export default defineSite(
  {
    name: "Site by Five System",
    url: "https://showcase.sitebyfive.com",
    theme: { preset: "bright" },
    announcement: { variant: "marquee", items: ["20 block types", "5 presets", "5 tones", "Works without JavaScript", "Every block works without images"], tone: "inverse" },
    nav: {
      layout: "logo-center",
      style: "floating",
      wordmark: "Site by Five System",
      items: [
        { label: "Blocks", href: "/" },
        ...PRESETS.map((p) => ({ label: presetName(p), href: `/${p}` })),
      ],
    },
    footer: {
      variant: "simple",
      blurb: "Every block, every variant, every preset. Generated from src/sites/showcase/config.ts.",
      legal: ["© {year} Site by Five", { label: "sitebyfive.com", href: "https://www.sitebyfive.com" }],
    },
    pages: [
      {
        slug: "/",
        title: "Showcase | Site by Five System",
        description: "Every block and variant of the Site by Five system, under every theme preset.",
        chrome: { nav: { style: "transparent" } },
        blocks: [
          { type: "hero", variant: "full-bleed", eyebrow: "Showcase", heading: { text: "Every block. Every variant. Every preset.", accent: "Every preset." }, body: "Pick a preset, then a block. Each page shows every variant with and without images.", image: img(5), ctas: [{ label: "Start with Bright", href: "/bright" }, { label: "Browse blocks", href: "#blocks", style: "secondary" }] },
          { type: "cards", variant: "text", columns: 3, id: "presets", eyebrow: "Presets", heading: "Five looks, one schema", items: PRESETS.map((p) => ({ title: presetName(p), body: `Every block under the ${p} preset.`, link: { label: `Open the ${p} preset`, href: `/${p}` } })) },
          { type: "linkList", variant: "split", id: "blocks", tone: "muted", eyebrow: "Blocks", heading: "Jump to a block", intro: "Under the bright preset. Each block page links to the same block under the other presets.", items: blockTypes.map((b) => ({ label: nice(b), href: `/bright/${b.toLowerCase()}`, description: examples[b]!.purpose })) },
        ],
      },
      ...pages,
    ],
  },
  { custom: { callout: calloutSchema }, pagePresets },
);
