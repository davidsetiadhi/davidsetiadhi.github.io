import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'> & { date: Date; year: string; slug: string; url: string };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Posts keep their Jekyll URLs: _posts/YYYY-MM-DD-name.md -> /posts/YYYY/name/ */
export async function allPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts
    .map((p) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/.exec(p.id);
      const date = p.data.date ?? (m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`) : new Date(0));
      const slug = m ? m[4] : p.id;
      const year = String(date.getUTCFullYear());
      return Object.assign(p, { date, year, slug, url: `/posts/${year}/${slug}/` });
    })
    .sort((a, b) => +b.date - +a.date);
}

export { slugify };
