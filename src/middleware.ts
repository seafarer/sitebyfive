import { defineMiddleware } from "astro:middleware";

/**
 * Renders `[[Add: …]]` placeholders as visible prompts (<mark class="placeholder">) in text
 * content. Attributes and raw-text elements (script, style, title, textarea) are left alone, so
 * alt text, page titles, and JSON-LD stay valid.
 * Runs in dev and for every prerendered page at build.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const type = response.headers.get("content-type") ?? "";
  if (type && !type.includes("text/html")) return response;
  const html = await response.text();
  const body = html.includes("[[") ? markPlaceholders(html) : html;
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
});

function markPlaceholders(html: string): string {
  let raw = false; // inside a raw-text element
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        if (/^<(script|style|title|textarea)\b/i.test(part)) raw = true;
        else if (/^<\/(script|style|title|textarea)>/i.test(part)) raw = false;
        return part;
      }
      return raw ? part : part.replace(/\[\[(.+?)\]\]/g, '<mark class="placeholder">$1</mark>');
    })
    .join("");
}
