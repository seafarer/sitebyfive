import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { z } from "zod";
import type { SocialNetwork } from "../schema/site-schema";

const lucideDir = join(process.cwd(), "node_modules/lucide-static/icons");

/** Inline SVG for a Lucide icon name. Unknown names fail the build. */
export function lucide(name: string): string {
  const file = join(lucideDir, `${name}.svg`);
  if (!existsSync(file)) throw new Error(`Unknown icon "${name}". Browse names at https://lucide.dev/icons`);
  return readFileSync(file, "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sclass="[^"]*"/, "")
    .replace("<svg", '<svg aria-hidden="true" focusable="false"')
    .trim();
}

const LINKEDIN =
  '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

/** Brand glyph for a social network (Simple Icons; LinkedIn inlined). */
export function socialIcon(network: z.infer<typeof SocialNetwork>): string {
  const raw =
    network === "linkedin"
      ? LINKEDIN
      : readFileSync(join(process.cwd(), "node_modules/simple-icons/icons", `${network}.svg`), "utf8");
  return raw
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/\srole="img"/, "")
    .replace("<svg", '<svg aria-hidden="true" focusable="false" fill="currentColor"');
}

export const SOCIAL_LABEL: Record<z.infer<typeof SocialNetwork>, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  bluesky: "Bluesky",
};
