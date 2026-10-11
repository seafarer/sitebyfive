import { defineSite } from "../../schema/define";
import { loadContent } from "../../schema/content";

/** Content lives in site.yaml and pages/*.yaml. */
export default defineSite(loadContent(import.meta.url));
