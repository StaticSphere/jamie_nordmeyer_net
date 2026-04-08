// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://jamienordmeyer.net",
  base: "/",
  integrations: [sitemap()],
  legacy: {
    collectionsBackwardsCompat: true
  },
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }]
    ]
  }
});
