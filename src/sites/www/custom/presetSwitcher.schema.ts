import { z } from "zod";

/** Props for the www site's live preset switcher. */
export const presetSwitcherSchema = z.object({
  /** Each tab loads `${base}/${preset}/` into the frame. The first is shown initially. */
  presets: z.array(z.object({ preset: z.string(), label: z.string(), note: z.string() })).min(2),
  base: z.string().default("/preview"),
  /** Caption under the frame. */
  caption: z.string().optional(),
});
export type PresetSwitcherProps = z.infer<typeof presetSwitcherSchema>;
