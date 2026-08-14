// netlify/edge-functions/og-article.js
//
// Problème : le site est une SPA (un seul index.html). Les robots de preview
// (Facebook, WhatsApp, LinkedIn, Twitter/X, Slack, Discord...) n'exécutent
// JAMAIS le JavaScript de la page — ils lisent le HTML brut renvoyé par le
// serveur. Résultat : ils voient toujours les balises og:title/og:image
// statiques de la page d'accueil, quel que soit l'article partagé.
//
// Solution : on intercepte uniquement les requêtes venant de ces robots
// (détectés via le User-Agent) sur /blog/:slug, on va chercher le vrai
// article dans Strapi, et on réécrit les balises meta dans le HTML avant
// de le renvoyer. Les vrais visiteurs humains ne passent jamais par ce
// chemin de code : ils reçoivent la page normale, inchangée.

const STRAPI_URL = 'https://api.ripolldarcia.com';
const SITE_URL = 'https://ripolldarcia.com';
const DEFAULT_IMAGE = `${SITE_URL}/assets/image/og-cover.jpg`;

// User-Agents des principaux robots de preview / partage
const BOT_UA_REGEX =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|vkShare|redditbot|SkypeUriPreview|Applebot|Google-InspectionTool/i;

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceMeta(html, { title, description, image, url }) {
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHTML(title)}</title>`)
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${escapeHTML(title)}$2`
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${escapeHTML(description)}$2`
    )
    .replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      `$1${escapeHTML(image)}$2`
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      `$1${escapeHTML(url)}$2`
    )
    .replace(
      /(<meta property="og:type" content=")[^"]*(")/,
      `$1article$2`
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${escapeHTML(title)}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${escapeHTML(description)}$2`
    )
    .replace(
      /(<meta name="twitter:image" content=")[^"]*(")/,
      `$1${escapeHTML(image)}$2`
    );
}

export default async (request, context) => {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/blog\/([^/]+)\/?$/);

  // Pas une page d'article -> on laisse passer normalement
  if (!match) return context.next();

  const ua = request.headers.get('user-agent') || '';

  // Un vrai visiteur -> page normale, la SPA gère tout côté client
  if (!BOT_UA_REGEX.test(ua)) return context.next();

  const slug = decodeURIComponent(match[1]);

  let article = null;
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/blog-articles?filters[slug][$eq]=${encodeURIComponent(slug)}` +
        `&populate[image_couverture]=true` +
        `&fields[0]=Titre&fields[1]=description_courte&fields[2]=slug`
    );
    if (res.ok) {
      const json = await res.json();
      article = Array.isArray(json.data) ? json.data[0] : null;
    }
  } catch (e) {
    // Si Strapi ne répond pas, on retombe sur la page normale plus bas
  }

  // Important : les robots de preview (Facebook en tête) envoient souvent un
  // header "Range" pour ne récupérer qu'un morceau de la page. Si on laisse
  // passer ce header vers l'origine, celle-ci répond en 206 Partial Content
  // avec un corps tronqué. On finissait alors par renvoyer un statut 206
  // incohérent avec un corps HTML complet réécrit -> réponse invalide que
  // Facebook rejette silencieusement (et retombe sur les tags par défaut).
  // On retire donc Range/If-Range avant de transmettre la requête.
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete('range');
  forwardHeaders.delete('if-range');
  const forwardRequest = new Request(request.url, {
    method: request.method,
    headers: forwardHeaders,
  });

  const originResponse = await context.next(forwardRequest);

  if (!article) return originResponse;

  const html = await originResponse.text();

  let image = DEFAULT_IMAGE;
  const cover = article.image_couverture;
  if (cover && cover.url) {
    image = cover.url.startsWith('http') ? cover.url : STRAPI_URL + cover.url;
  }

  const rewritten = replaceMeta(html, {
    title: `${article.Titre} — Ripoll Darcia`,
    description: article.description_courte || '',
    image,
    url: `${SITE_URL}/blog/${encodeURIComponent(article.slug)}`,
  });

  const headers = new Headers(originResponse.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.delete('content-length');   // la taille du body a changé
  headers.delete('content-range');    // on renvoie toujours le document complet
  headers.delete('accept-ranges');
  // Cette réponse est spécifique au User-Agent (bot) : on interdit toute
  // mise en cache partagée pour éviter qu'un vrai visiteur ne la reçoive.
  headers.set('cache-control', 'private, no-store');
  headers.set('vary', 'User-Agent');

  return new Response(rewritten, {
    status: 200, // toujours un document complet, jamais un 206
    headers,
  });
};

export const config = { path: '/blog/*' };