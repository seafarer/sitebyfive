import { getCollection, type CollectionEntry } from "astro:content";
import { build, site } from "./site";

export type Post = CollectionEntry<"posts">;

/** Published posts, newest first. Empty when posts are disabled. */
export async function getPosts(): Promise<Post[]> {
  if (!site.posts?.enabled) return [];
  const all = await getCollection("posts", (p) => !p.data.draft);
  return all
    .map((p) => (build.noImages ? { ...p, data: { ...p.data, image: undefined } } : p))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const postHref = (p: Post) => `${site.posts!.basePath}/${p.id}`;
