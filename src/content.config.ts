import { defineCollection } from "astro:content";
import { z } from "zod";

const taxonomySchema = z.object({
  name: z.string(),
  slug: z.string()
});

const posts = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      date: z.coerce.date(),
      author: z.string().default("Jamie Nordmeyer"),
      featuredImage: image().nullable().optional(),
      featuredImageAlt: z.string().optional().default(""),
      wpLink: z.string(),
      categories: z.array(taxonomySchema).default([]),
      tags: z.array(taxonomySchema).default([])
    })
});

const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    wpLink: z.string()
  })
});

export const collections = {
  posts,
  pages
};
