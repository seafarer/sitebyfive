import type { Heading } from "../schema/site-schema";

export interface HeadingParts {
  before: string;
  accent?: string;
  after: string;
}

/** Splits a heading at its accent (first exact match). Plain strings have no accent. */
export function headingParts(h: Heading): HeadingParts {
  if (typeof h === "string") return { before: h, after: "" };
  const i = h.text.indexOf(h.accent);
  return { before: h.text.slice(0, i), accent: h.accent, after: h.text.slice(i + h.accent.length) };
}

export const headingText = (h: Heading | undefined): string => (h === undefined ? "" : typeof h === "string" ? h : h.text);

/** id of a section's h2, shared by Section (aria-labelledby) and the block's header. */
export const sectionHeadingId = (block: { id?: string }, index: number) => `${block.id ?? `s${index}`}-heading`;
