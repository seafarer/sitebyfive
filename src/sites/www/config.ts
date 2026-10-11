import { defineSite } from "../../schema/define";
import { loadContent } from "../../schema/content";
import { presetSwitcherSchema } from "./custom/presetSwitcher.schema";

/**
 * The Site by Five marketing site, built with Site by Five. Content lives in site.yaml and pages/*.yaml.
 * /preview/<preset>/ pages render the same sample page under each preset for the home page switcher.
 */
export default defineSite(loadContent(import.meta.url), {
  custom: { presetSwitcher: presetSwitcherSchema },
  pagePresets: {
    "/preview/muted": "muted",
    "/preview/business": "business",
    "/preview/warm": "warm",
    "/preview/bright": "bright",
    "/preview/fun": "fun",
  },
});
