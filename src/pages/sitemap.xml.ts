import type { APIRoute } from "astro";
import { absolute, site } from "../lib/site";
import { getPosts, postHref } from "../lib/posts";

/** Every indexable page and post. Pages with `noindex: true` are left out. */
export const GET: APIRoute = async () => {
  const paths = site.pages.filter((p) => !p.noindex).map((p) => p.slug);
  if (site.posts?.enabled) {
    paths.push(site.posts.basePath);
    for (const post of await getPosts()) paths.push(postHref(post));
  }
  const urls = paths.map((p) => `  <url><loc>${absolute(p === "/" ? "/" : `${p}/`)}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
