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
        // pillar: Supports single string or array.
        pillar: z.union([z.string(), z.array(z.string())]).optional(),
        tags: z.array(z.string()).optional(),
        featured: z.number().optional(),
    }),
});

// 2. LAB: Hardened with 'domain' field
const lab = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/lab" }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        // domain: Supports single string or array.
        domain: z.union([z.string(), z.array(z.string())]).optional(),
        tags: z.array(z.string()).optional(),
        featured: z.number().optional(),
    }),
});

// 3. SITE: Flexible data loader for general configurations
const site = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{yml,yaml}', base: "./src/content/site" }),
    schema: z.any(), 
});

// 4. CV: Hardened Data Loader (Synchronized with SectionList.astro)
const cv = defineCollection({
  loader: file("src/content/cv.yml"),
  schema: z.object({
    id: z.string(),
    heading: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        institution: z.string().optional(), // Required for WorldQuant/University data
        role: z.string().optional(),        // Required for Recommender positions
        description: z.string().optional(),
        datetime: z.string().optional(),
        dateLabel: z.string().optional(),   // Syncs with SectionList time formatting
        href: z.string().optional(),
      })
    ).optional(),
  }),
});

export const collections = { writings, lab, site, cv };