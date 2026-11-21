import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { allPosts } from '../lib/posts';
import { SITE } from '../lib/data';

// Same address as the Jekyll feed (/feed.xml), so existing subscribers keep receiving posts and news.
export async function GET(context) {
  const posts = (await allPosts()).map((p) => ({
    title: p.data.title,
    description: p.data.description ?? '',
    pubDate: p.date,
    link: p.url,
  }));
  const news = (await getCollection('news')).map((n) => ({
    title: n.data.title ?? `News: ${n.body?.replace(/\s+/g, ' ').replace(/[*_#>\[\]]/g, '').slice(0, 90).trim()}`,
    pubDate: n.data.date,
    link: `/news/${n.id}/`,
  }));
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: [...posts, ...news].sort((a, b) => +b.pubDate - +a.pubDate),
  });
}
