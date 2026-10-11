import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const site = process.env.SITE ?? "lattice";

/**
 * Markdown posts for the current site: src/sites/<id>/posts/*.md.
 * `image` is a path in the site's assets/ folder, same as the site config, so one
 * missing-image report covers both.
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: `./src/sites/${site}/posts` }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().default(""),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
