import { z } from "zod";
import { Site, type Preset, type SiteInput, type Site as SiteT } from "./site-schema";

export type CustomSchemas = Record<string, z.ZodType>;

export interface DefinedSite {
  site: SiteT;
  /** Prop schemas for this site's custom blocks, keyed by component name. */
  custom: CustomSchemas;
  /** Render specific pages under a different preset (showcase pages, preset preview frames). */
  pagePresets?: Record<string, Preset>;
}

export class SiteConfigError extends Error {
  constructor(siteName: string, detail: string) {
    super(`Invalid site config for "${siteName}":\n${detail}`);
    this.name = "SiteConfigError";
  }
}

/**
 * Use in `src/sites/<id>/config.ts` for autocomplete and validation.
 * Parses at module load, so an invalid config fails the dev server and the build.
 *
 *   export default defineSite({ ... }, { custom: { specSheet: specSheetSchema } });
 */
export function defineSite(
  input: SiteInput,
  options: { custom?: CustomSchemas; pagePresets?: Record<string, Preset> } = {},
): DefinedSite {
  const custom = options.custom ?? {};
  const result = Site.safeParse(input);
  if (!result.success) {
    throw new SiteConfigError(input.name ?? "unknown", z.prettifyError(result.error));
  }
  const site = result.data;

  const problems: string[] = [];
  for (const page of site.pages) {
    page.blocks.forEach((block, i) => {
      if (block.type !== "custom") return;
      const schema = custom[block.component];
      const where = `pages[${page.slug}].blocks[${i}] (custom "${block.component}")`;
      if (!schema) {
        problems.push(`✖ ${where}: no prop schema registered. Pass it via defineSite(…, { custom: { ${block.component}: schema } }).`);
        return;
      }
      const parsed = schema.safeParse(block.props);
      if (parsed.success) block.props = parsed.data as Record<string, unknown>;
      else problems.push(`✖ ${where}:\n${z.prettifyError(parsed.error)}`);
    });
  }

  const slugs = new Set<string>();
  for (const page of site.pages) {
    if (slugs.has(page.slug)) problems.push(`✖ duplicate page slug "${page.slug}"`);
    slugs.add(page.slug);
  }

  if (problems.length) throw new SiteConfigError(site.name, problems.join("\n"));
  return { site, custom, pagePresets: options.pagePresets };
}
