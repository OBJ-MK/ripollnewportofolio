/* components/blog.js
 * Role: blog article cards, filtering, loading articles and SPA article detail
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { escapeHTML } from '../utils/format.js';
import { mediaUrl, formatDateFR, articleTags } from '../utils/media.js';

export function buildBlogArticleCard(article, index, { featured = false } = {}) {
  const f = CONFIG.FIELDS.blogArticle;
  const titre = escapeHTML(article[f.Titre] || '');
  const resume = escapeHTML(article[f.description_courte] || '');
  const slug = encodeURIComponent(article[f.slug] || '');
  const date = formatDateFR(article[f.date_publication]);
  const tags = articleTags(article);
  const imgUrl = mediaUrl(article[f.image_couverture]?.formats?.medium)
    || mediaUrl(article[f.image_couverture]);
  const href = `#article?slug=${slug}`;

  const thumbContent = imgUrl
    ? `<img src="${imgUrl}" alt="${titre}" loading="${index === 0 ? 'eager' : 'lazy'}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="article-thumb-bg" style="background:linear-gradient(135deg,#0f1a2e,#1a2a4a)"><i class="fa-solid fa-newspaper"></i></div>`;
  const badge = featured ? `<span class="article-type-badge">À la une</span>` : '';
  const tagsHtml = tags.map(t => `<span class="article-tag">${escapeHTML(t)}</span>`).join('');

  return `<div class="article-card fade-in visible${featured ? ' featured' : ''}"
    style="transition-delay:${index * 0.1}s" data-type="article"
    data-tags="${escapeHTML(tags.join('|').toLowerCase())}"
    tabindex="0" role="link" aria-label="Lire l'article ${titre}" data-href="${href}">
    <div class="article-thumb"${featured ? '' : ' style="height:150px"'}>${thumbContent}${badge}</div>
    <div class="article-body">
      <div class="article-meta">
        <span class="article-date">${date}</span>
      </div>
      <div class="article-title">${titre}</div>
      <p class="article-excerpt">${resume}</p>
      <div class="article-footer">
        <div class="article-tags">${tagsHtml}</div>
        <a href="#article?slug=${slug}" class="read-link" onclick="event.preventDefault(); navigateTo('article', { slug: '${slug}' });">Lire →</a>
      </div>
    </div>
  </div>`;
}

export function attachArticleNavigation(card, article) {
  if (!card) return;

  const slug = article?.slug 
    || article?.attributes?.slug 
    || card.getAttribute('data-slug');

  // Intercepter le clic sur TOUTE la carte
  card.addEventListener('click', (e) => {
    e.preventDefault();
    if (slug) {
      // navigateTo is exposed globally by main.js
      navigateTo('article', { slug: slug });
    }
  });

  card.style.cursor = 'pointer';
}

export function buildTagChips(articles) {
  const chipsEl = document.getElementById('tag-chips');
  if (!chipsEl) return;
  const allTags = [...new Set(articles.flatMap(articleTags))];
  if (!allTags.length) return;

  chipsEl.innerHTML =
    `<button class="article-tag tag-chip active" data-tag="">Tous</button>` +
    allTags.map(t =>
      `<button class="article-tag tag-chip" data-tag="${escapeHTML(t.toLowerCase())}">${escapeHTML(t)}</button>`
    ).join('');
  chipsEl.hidden = false;

  chipsEl.addEventListener('click', e => {
    const btn = e.target.closest('.tag-chip');
    if (!btn) return;
    chipsEl.querySelectorAll('.tag-chip').forEach(b => b.classList.toggle('active', b === btn));
    const tag = btn.getAttribute('data-tag');
    document.querySelectorAll('.article-card[data-tags]').forEach(card => {
      const cardTags = (card.getAttribute('data-tags') || '').split('|');
      card.style.display = !tag || cardTags.includes(tag) ? '' : 'none';
    });
  });
}

export async function loadArticles() {
  try {
    const { data } = await fetchJSON('/api/blog-articles?populate=*');
    console.log('[CMS] blog-articles reçus:', data?.length ?? 0);
    if (!data?.length) return; // collection vide → fallback HTML intact
    const featured = document.getElementById('section-articles');
    if (!featured) return;
    const row2 = document.getElementById('articles-row2');
    const f = CONFIG.FIELDS.blogArticle;

    // Tri : date_publication décroissante ; mis_en_avant prioritaire en tête
    const sorted = [...data].sort((a, b) =>
      new Date(b[f.date_publication] || 0) - new Date(a[f.date_publication] || 0));
    const star = sorted.find(a => a[f.mis_en_avant]) || sorted[0];
    const rest = sorted.filter(a => a !== star);

    // Rangée vedette : article mis en avant + le suivant
    featured.innerHTML = '';
    [star, ...rest.slice(0, 1)].forEach((article, i) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildBlogArticleCard(article, i, { featured: i === 0 });
      const card = tmp.firstElementChild;
      featured.appendChild(card);
      attachArticleNavigation(card, article);
    });

    // Rangée secondaire : le reste
    if (row2) {
      row2.innerHTML = '';
      rest.slice(1).forEach((article, i) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildBlogArticleCard(article, i + 2);
        const card = tmp.firstElementChild;
        row2.appendChild(card);
        attachArticleNavigation(card, article);
      });
      row2.style.display = rest.length > 1 ? '' : 'none';
    }

    buildTagChips(sorted);
    // Le carrousel mobile (caroussel.js) se réinitialise sur resize
    window.dispatchEvent(new Event('resize'));
  } catch (e) {
    console.error('[CMS] blog-articles:', e.message);
  }finally { hideSkeleton('skeleton-view-article') }
}

export async function loadArticleDetailSPA(slug) {
  const elArticle = document.getElementById('article-detail');
  const elNotFound = document.getElementById('article-notfound');

  if (!slug) return;

  try {
    const endpoint = `/api/blog-articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`;
    const { data } = await fetchJSON(endpoint);

    if (!data || data.length === 0) {
      if (elArticle) elArticle.hidden = true;
      if (elNotFound) elNotFound.hidden = false;
      return;
    }

    const article = data[0];
    const attr = article.attributes || article;
    const f = CONFIG?.FIELDS?.blogArticle || {};

    // 1. Récupération dynamique de toutes les clés d'attributs
    const titre = attr[f.titre] || attr.titre || attr.title || attr.name || 'Article sans titre';
    const contenu = attr[f.contenu] || attr.contenu || attr.content || '';
    const dateRaw = attr[f.date_publication] || attr.date_publication || attr.publishedAt;
    const date = dateRaw ? new Date(dateRaw).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const tags = attr[f.tags] || attr.tags || [];

    // Image de couverture
    const coverData = attr.image_couverture ;
    console.log('[CMS] Structure de coverData :', coverData);
    let coverUrl = '';
    if (coverData) {
      coverUrl = coverData.url 
        || coverData.data?.attributes?.url 
        || (Array.isArray(coverData) && coverData[0]?.url)
        || '';
    }
    if (coverUrl && coverUrl.startsWith('/')) {
      coverUrl = (CONFIG?.API_URL || '') + coverUrl;
    }

    // 2. Sélection des éléments HTML du DOM
    const elTitre = document.getElementById('article-titre');
    const elDate = document.getElementById('article-date');
    const elTags = document.getElementById('article-tags');
    const elCover = document.getElementById('article-cover');
    const elContenu = document.getElementById('article-contenu');

    // 3. Injection complète des contenus
    if (elTitre) elTitre.textContent = titre;
    if (elDate) elDate.textContent = date;

    if (elTags) {
      if (Array.isArray(tags) && tags.length > 0) {
        elTags.innerHTML = tags.map(tag => `<span class="article-tag">${tag}</span>`).join('');
      } else {
        elTags.innerHTML = '';
      }
    }

    if (elCover) {
      if (coverUrl) {
        elCover.innerHTML = `<img src="${coverUrl}" alt="${titre}" style="width:100%; max-height:450px; object-fit:cover; border-radius:12px; margin: 1rem 0;">`;
        elCover.hidden = false;
      } else {
        
        elCover.hidden = true;
      }
    }

    if (elContenu) {
      if (typeof marked !== 'undefined') {
        elContenu.innerHTML = marked.parse(contenu);
      } else {
        elContenu.innerHTML = contenu;
      }
    }

    // 4. Affichage de la vue
    if (elNotFound) elNotFound.hidden = true;
    if (elArticle) elArticle.hidden = false;

  } catch (e) {
    console.error('[CMS] Erreur lors du rendu du détail de l\'article :', e);
  }
}
