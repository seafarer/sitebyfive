/// <reference types="astro/client" />

declare const __BUILD__: {
  site: string;
  preset?: import("./schema/site-schema").Preset;
  noImages: boolean;
  allowMissing: boolean;
};
