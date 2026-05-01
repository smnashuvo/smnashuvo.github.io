import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// 1. WRITINGS: Hardened with Tag Transformation and Image Refinement
const writings = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/writings" }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        // Gap 5: Set to optional at root to allow text-only posts
        heroAlt: z.string().optional(), 
        pillar: z.union([z.string(), z.array(z.string())]).optional(),
        // Gap 3: Automatically enforce lowercase kebab-case tags
        tags: z.array(z.string()).transform(tags => 
            tags.map(t => t.toLowerCase().trim().replace(/\s+/g, '-'))
        ).default([]),
        featured: z.number().optional(),
    }).refine((data) => {
        // Gap 5 Logic: If heroImage is present, heroAlt MUST be present
        return !(data.heroImage && !data.heroAlt);
    }, {
        message: "heroAlt is mandatory when heroImage is provided",
        path: ["heroAlt"]
    }),
});

// 2. LAB: Hardened with Tag Transformation and Image Refinement
const lab = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/lab" }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        heroAlt: z.string().optional(), 
        domain: z.union([z.string(), z.array(z.string())]).optional(),
        // Gap 3: Syncing tag logic with Writings
        tags: z.array(z.string()).transform(tags => 
            tags.map(t => t.toLowerCase().trim().replace(/\s+/g, '-'))
        ).default([]),
        featured: z.number().optional(),
    }).refine((data) => {
        return !(data.heroImage && !data.heroAlt);
    }, {
        message: "heroAlt is mandatory when heroImage is provided",
        path: ["heroAlt"]
    }),
});

// 3. SITE: Remains as is
const site = defineCollection({
    loader: glob({ pattern: '**/[^_]*.yml', base: "./src/content/site" }),
    schema: z.any(), 
});

// 4. CV: Remains as is[cite: 5]
const cv = defineCollection({
  loader: file("src/content/cv.yml"),
  schema: z.object({
    id: z.string(),
    heading: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        institution: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        datetime: z.string().optional(),
        dateLabel: z.string().optional(),
        href: z.string().optional(),
      })
    ).optional(),
  }),
});

export const collections = { writings, lab, site, cv };