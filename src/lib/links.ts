import type { Link } from "../schema/site-schema";
import { site } from "./site";

const origin = new URL(site.url).host;

/** External = absolute http(s) URL on another host, unless the link says otherwise. */
export function isExternal(href: string, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).host !== origin;
  } catch {
    return false;
  }
}

/** Attributes for an <a>. External links open in a new tab with safe rel. */
export function linkAttrs(link: Pick<Link, "href" | "external">): Record<string, string> {
  return isExternal(link.href, link.external)
    ? { href: link.href, target: "_blank", rel: "noopener noreferrer" }
    : { href: link.href };
}
