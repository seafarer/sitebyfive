import type { APIRoute } from "astro";
import { absolute, site } from "../lib/site";

/** Live sites point crawlers at the sitemap; preview and draft sites stay out of search entirely. */
export const GET: APIRoute = () =>
  new Response(
    site.status === "live" ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute("/sitemap.xml")}\n` : "User-agent: *\nDisallow: /\n",
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
