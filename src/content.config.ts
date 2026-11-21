import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Content stays in the Jekyll-era folders, so bin/update_publications.py (which writes _news/)
// and the davestia-harvest skill keep working unchanged.

const looseDate = z.coerce.date();

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './_projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    importance: z.number().default(99),
    category: z.string().default('research'),
    img: z.string().optional(),
    og_image: z.string().optional(),
    related_publications: z.boolean().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './_posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: looseDate.optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    og_image: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '*.md', base: './_news' }),
  schema: z.object({
    title: z.string().optional(),
    date: looseDate,
    inline: z.boolean().default(true),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: '*.md', base: './_pages/tools' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    og_image: z.string().optional(),
  }),
});

// Single markdown pages kept as content: /id/ and /talks/.
const pages = defineCollection({
  loader: glob({ pattern: ['id.md', 'talks.md'], base: './_pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    og_image: z.string().optional(),
  }),
});

export const collections = { projects, posts, news, tools, pages };
