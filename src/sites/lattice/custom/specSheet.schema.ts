import { z } from "zod";

/** Props for the specSheet custom block: grouped label/value rows, plus an optional download. */
export const specSheetSchema = z.object({
  groups: z
    .array(
      z.object({
        title: z.string(),
        rows: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
      }),
    )
    .min(1),
  footnote: z.string().optional(),
  download: z.object({ label: z.string(), href: z.string() }).optional(),
});

export type SpecSheetProps = z.infer<typeof specSheetSchema>;
