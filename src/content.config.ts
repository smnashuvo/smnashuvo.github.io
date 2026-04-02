import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// 1. WRITINGS: Hardened with 'pillar' field
const writings = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/writings" }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        // UPDATED: Added pillar. Supports single string or array.
        pillar: z.union([z.string(), z.array(z.string())]).optional(),
        tags: z.array(z.string()).optional(),
    }),
});

// 2. LAB: Hardened with 'domain' field
const lab = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/lab" }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        heroImage: image().optional(),
        // UPDATED: Added domain. Supports single string or array.
        domain: z.union([z.string(), z.array(z.string())]).optional(),
        tags: z.array(z.string()).optional(),
    }),
});

// 3. SITE: Flexible data loader
const site = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{yml,yaml}', base: "./src/content/site" }),
    schema: z.any(), 
});

// 4. CV: Data loader
const cv = defineCollection({
  loader: file("src/content/cv.yml"),
  schema: z.object({
    id: z.string(),
    heading: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        datetime: z.string().optional(),
        href: z.string().optional(),
      })
    ).optional(),
  }),
});

export const collections = { writings, lab, site, cv };