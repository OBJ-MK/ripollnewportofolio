// netlify/functions/sitemap.js
// Génère le sitemap.xml dynamiquement en interrogeant Strapi pour la liste des articles.
// Appelé via la redirection /sitemap.xml -> /.netlify/functions/sitemap (voir netlify.toml).

const STRAPI_URL = 'https://api.ripolldarcia.com';
const SITE_URL = 'https://ripolldarcia.com';

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

exports.handler = async function () {
  let articles = [];

  try {
    const res = await fetch(
      `${STRAPI_URL}/api/blog-articles?fields[0]=slug&fields[1]=date_publication&fields[2]=updatedAt&pagination[pageSize]=200`
    );
    if (res.ok) {
      const json = await res.json();
      articles = Array.isArray(json.data) ? json.data : [];
    }
  } catch (e) {
    console.error('[sitemap] Erreur fetch blog-articles:', e.message);
    // On continue quand même avec les pages statiques si Strapi ne répond pas
  }

  const today = new Date().toISOString().slice(0, 10);

  const staticUrls = [
    { loc: `${SITE_URL}/`, lastmod: today, changefreq: 'monthly', priority: '1.0' },
    { loc: `${SITE_URL}/blog`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE_URL}/mentions-legales`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/politique-confidentialite`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
  ];

  const articleUrls = articles
    .filter(a => a && a.slug)
    .map(a => {
      const lastmod = (a.updatedAt || a.date_publication || today).slice(0, 10);
      return {
        loc: `${SITE_URL}/blog/${encodeURIComponent(a.slug)}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.7',
      };
    });

  const allUrls = [...staticUrls, ...articleUrls];

  const body = allUrls
    .map(
      u => `  <url>
    <loc>${escapeXML(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // 1h de cache, se régénère seul ensuite
      'X-Content-Type-Options': 'nosniff',
    },
    body: xml,
  };
};