/**
 * The few interface strings the system writes itself (everything else is content).
 * Central so a non-English site can swap them.
 */
export const t = {
  skipToContent: "Skip to content",
  home: "Home",
  breadcrumb: "Breadcrumb",
  menu: "Menu",
  closeMenu: "Close menu",
  mainNav: "Main",
  dismiss: "Dismiss announcement",
  opensNewTab: "(opens in a new tab)",
  address: "Address",
  phone: "Phone",
  email: "Email",
  hours: "Hours",
  directions: "Get directions",
  chooseOne: "Choose one",
  required: "required",
  footerNav: "Footer",
  social: "Social media",
  featured: "Featured",
  readMore: "Read more",
  allPosts: "All posts",
  recentPosts: "Recent posts",
  published: "Published",
  noPosts: "Nothing published yet. Check back soon.",
  notFoundTitle: "Page not found",
  sending: "Sending…",
  sendFailed: "Your message wasn't sent. Please try again, or contact us directly.",
  fieldRequired: "Please fill this in.",
  fieldEmail: "Enter an email address like name@example.com.",
  fieldChoose: "Please choose one.",
  fixFields: "Please fix the highlighted field above.",
  fixFieldsCount: "Please fix the {n} highlighted fields above.",
  closeImage: "Close",
  previousImage: "Previous image",
  nextImage: "Next image",
  viewImage: "View larger",
  notFoundBody: "The page you were looking for has moved or never existed.",
} as const;

/** Format a YYYY-MM-DD date in the site locale without timezone drift. */
export function formatDate(iso: string | Date, locale: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "long" }): string {
  const d = typeof iso === "string" ? new Date(`${iso}T00:00:00Z`) : iso;
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(d);
}
