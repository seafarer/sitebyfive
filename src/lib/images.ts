import type { ImageMetadata } from "astro";
import { build } from "./site";

/**
 * Site images live in src/sites/<id>/assets/ and are referenced by relative path.
 * The glob is lazy, so only images that are actually rendered get processed.
 */
const files = import.meta.glob<{ default: ImageMetadata }>("@site/assets/**/*.{jpg,jpeg,png,webp,avif,gif,svg}");
const byPath = new Map(Object.entries(files).map(([key, load]) => [key.replace(/^.*?\/assets\//, ""), load]));

/** Returns metadata, or undefined for a missing file when placeholders are allowed. */
export async function loadImage(src: string): Promise<ImageMetadata | undefined> {
  const load = byPath.get(src.replace(/^\.?\//, ""));
  if (load) return (await load()).default;
  if (build.allowMissing) return undefined;
  throw new Error(`Image not found: src/sites/${build.site}/assets/${src}`);
}

/** URL of a large rendition (lightbox). Undefined when the file is missing. */
export async function largeImageUrl(src: string, width = 2000): Promise<string | undefined> {
  const meta = await loadImage(src);
  if (!meta) return undefined;
  if (meta.format === "svg") return meta.src;
  const { getImage } = await import("astro:assets");
  return (await getImage({ src: meta, width: Math.min(meta.width, width) })).src;
}
