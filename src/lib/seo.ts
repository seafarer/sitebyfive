import { getImage } from "astro:assets";
import type { Image, Page } from "../schema/site-schema";
import { collectImageRefs } from "../schema/prepare";
import { loadImage } from "./images";
import { site, absolute } from "./site";


/** 1200×630 share image URL: page.ogImage → site.ogImage → first image on the page. */
export async function ogImageUrl(page: Pick<Page, "ogImage" | "blocks"> | undefined): Promise<string | undefined> {
  const firstOnPage = page ? collectImageRefs({ ...site, pages: [page as Page] } as typeof site).find((r) => r.where.startsWith("pages")) : undefined;
  const image: Image | undefined = page?.ogImage ?? site.ogImage ?? (firstOnPage ? { src: firstOnPage.src, alt: "" } : undefined);
  const meta = image ? await loadImage(image.src) : undefined;
  if (!meta) return undefined;
  if (meta.format === "svg") return undefined; // social cards need a raster image
  const out = await getImage({ src: meta, width: 1200, height: 630, fit: "cover", format: "jpg" });
  return absolute(out.src);
}

/** Organization / LocalBusiness JSON-LD. */
export function organizationJsonLd(logoUrl?: string): Record<string, unknown> | undefined {
  const o = site.organization;
  if (!o) return undefined;
  const sameAs = site.footer.social?.map((s) => s.href);
  return {
    "@context": "https://schema.org",
    "@type": o.type,
    name: site.name,
    legalName: o.legalName,
    description: o.description,
    url: site.url,
    email: o.email,
    telephone: o.phone,
    logo: logoUrl,
    foundingDate: o.foundingYear,
    openingHours: o.openingHours,
    areaServed: o.areaServed,
    sameAs: sameAs?.length ? sameAs : undefined,
    address: o.address && {
      "@type": "PostalAddress",
      streetAddress: o.address.street,
      addressLocality: o.address.locality,
      addressRegion: o.address.region,
      postalCode: o.address.postalCode,
      addressCountry: o.address.country,
    },
  };
}
