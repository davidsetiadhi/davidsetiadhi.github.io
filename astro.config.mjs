// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { fileURLToPath } from 'node:url';

// Data readers (src/lib) resolve _data/ and _bibliography/ from here, whatever the working directory.
process.env.SITE_ROOT = fileURLToPath(new URL('.', import.meta.url));

// SITE_URL switches the canonical host when the custom domain goes live (e.g. https://davestia.com).
const site = process.env.SITE_URL || 'https://davidsetiadhi.github.io';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    // Math in tool pages and posts is rendered to static HTML at build time (no MathJax at runtime).
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
