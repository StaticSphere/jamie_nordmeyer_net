// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://staticsphere.github.io",
  base: "/jamie_nordmeyer_net/",
  legacy: {
    collectionsBackwardsCompat: true
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
