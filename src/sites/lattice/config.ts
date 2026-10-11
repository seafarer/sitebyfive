import { defineSite } from "../../schema/define";
import { loadContent } from "../../schema/content";
import { specSheetSchema } from "./custom/specSheet.schema";

/** Content lives in site.yaml and pages/*.yaml. This file registers custom blocks. */
export default defineSite(loadContent(import.meta.url), { custom: { specSheet: specSheetSchema } });
