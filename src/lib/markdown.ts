import { Marked, type Tokens } from "marked";
import { isExternal } from "./links";

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const ext = isExternal(href) ? ` target="_blank" rel="noopener noreferrer"` : "";
      const t = title ? ` title="${title}"` : "";
      return `<a href="${href}"${t}${ext}>${text}</a>`;
    },
  },
});

/** Block markdown (paragraphs, lists). Content is trusted site config. */
export const md = (src: string): string => marked.parse(src, { async: false });

/** Inline markdown (bold, italic, links, line breaks). */
export const mdInline = (src: string): string => marked.parseInline(src, { async: false });
