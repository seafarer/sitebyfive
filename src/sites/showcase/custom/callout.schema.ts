import { z } from "zod";

/** Props for the showcase's example custom block. */
export const calloutSchema = z.object({
  icon: z.string(),
  title: z.string(),
  body: z.string(),
});

export type CalloutProps = z.infer<typeof calloutSchema>;
