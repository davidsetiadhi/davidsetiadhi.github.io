// The Jekyll site published /sitemap.xml. Keep that address as a sitemap index pointing to the
// file @astrojs/sitemap writes, so a sitemap already submitted to search engines keeps working.
export function GET(context) {
  const loc = new URL('/sitemap-0.xml', context.site).href;
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${loc}</loc></sitemap></sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
