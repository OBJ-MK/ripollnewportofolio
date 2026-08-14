/* components/blog.js
* Role: blog article cards, filtering, loading articles and SPA article detail
*/

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { escapeHTML } from '../utils/format.js';
import { mediaUrl, formatDateFR, articleTags } from '../utils/media.js';
import { getCached, setCached } from '../utils/cache.js';

import { initShareButtons } from './share.js';
import { revealGrid, animateCounters, refreshScrollTrigger, fadeInView } from '../utils/animations.js';

export function buildBlogArticleCard(article, index, { featured = false } = {}) {
  const f = CONFIG.FIELDS.blogArticle;
  const titre = escapeHTML(article[f.Titre] || '');
  const resume = escapeHTML(article[f.description_courte] || '');
  const slug = encodeURIComponent(article[f.slug] || '');
  const date = formatDateFR(article[f.date_publication]);
  const tags = articleTags(article);
  const imgUrl = mediaUrl(article[f.image_couverture]?.formats?.medium, { width: 500 })
    || mediaUrl(article[f.image_couverture], { width: 500 });
  const href = `/blog/${slug}`;

  const thumbContent = imgUrl
    ? `<img src="${imgUrl}" alt="${titre}" loading="${index === 0 ? 'eager' : 'lazy'}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="article-thumb-bg" style="background:linear-gradient(135deg,#0f1a2e,#1a2a4a)"><i class="fa-solid fa-newspaper"></i></div>`;
  const badge = featured ? `<span class="article-type-badge">À la une</span>` : '';
  // trier par ordre alphabétique pour un affichage cohérent
  tags.sort((a, b) => a.localeCompare(b));
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
          <a href="/blog/${slug}" class="read-link" onclick="event.preventDefault(); navigateTo('article', { slug: '${slug}' });">Lire →</a>        </div>
      </div>
    </div>`;
}


function setFilter(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const secArticles = document.getElementById('section-articles');
  const secArticlesRow2 = document.getElementById('articles-row2');
  const secSocial = document.getElementById('section-social');
  const lblArticles = document.getElementById('lbl-articles');
  const lblSocial = document.getElementById('lbl-social');
  const tagChips = document.getElementById('tag-chips'); // ← ajouter

  const showArticles = type === 'all' || type === 'article';
  const showSocial = type === 'all' || type === 'linkedin' || type === 'twitter';

  const toggleVisibility = (el, show) => {
    if (!el) return;
    el.style.display = show ? '' : 'none';
    // Cache aussi les points de navigation du carrousel s'ils existent (voisin direct)
    const next = el.nextElementSibling;
    if (next && next.classList.contains('carousel-dots')) {
      next.style.display = show ? '' : 'none';
    }
  };

  toggleVisibility(secArticles, showArticles);
  toggleVisibility(secArticlesRow2, showArticles);
  toggleVisibility(lblArticles, showArticles);
  toggleVisibility(secSocial, showSocial);
  toggleVisibility(lblSocial, showSocial);
  toggleVisibility(tagChips, showArticles); // ← ajouter

  if (type === 'linkedin' || type === 'instagram' || type === 'twitter') {
    document.querySelectorAll('.social-card').forEach(card => {
      card.style.display = card.classList.contains(type) ? 'block' : 'none';
    });
  } else {
    document.querySelectorAll('.social-card').forEach(card => {
      card.style.display = 'block';
    });
  }
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

  if (chipsEl.dataset.bound) return; // évite l'accumulation de listeners
  chipsEl.dataset.bound = 'true';


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

/* ── Fetch & hydratation : Page blog (en-tête) ─────────────
* Réintégré depuis l'ancien legacy/cms.js (monolithique), adapté aux
* imports du système en composants — logique inchangée. */
export async function loadPageBlog() {
  try {
    const { data } = await fetchJSON('/api/page-blog?populate[image]=true');
    const attrs = data || {};
    const f = CONFIG.FIELDS.pageBlog;

    // titre_principal : string — **gras** → <span> (accent or), saut de ligne → <br>
    if (attrs[f.titre_principal]) {
      const el = document.querySelector('[data-cms="pageBlog.titre_principal"]');
      if (el) {
        el.innerHTML = escapeHTML(attrs[f.titre_principal])
          .replace(/\*\*([\s\S]*?)\*\*/g, '<span>$1</span>')
          .replace(/\n/g, '<br>');
      }
    }

    const sousTitre = document.querySelector('[data-cms="pageBlog.sous_titre"]');
    if (sousTitre && attrs[f.sous_titre]) {
      sousTitre.innerHTML = escapeHTML(attrs[f.sous_titre]);
    }

    // Strapi v5 : média plat { url, formats }, pas { data: { attributes: { url } } }
    const blogHero = document.querySelector('.blog-hero');
    const imageUrl = mediaUrl(attrs[f.image]);
    if (imageUrl && blogHero) {
      blogHero.style.backgroundImage = `url(${imageUrl})`;
    }

    // Stats : nombre d'articles en parcourant les articles récupérés (Strapi v5 : collection dans data)
    const { data: articles } = await fetchJSON('/api/blog-articles');
    const numArticles = Array.isArray(articles) ? articles.length : 0;
    const blogStatsArticles = document.getElementById('article-stat-num');
    if (blogStatsArticles) blogStatsArticles.textContent = numArticles;



    // Années d'expérience
    const blogStatsExp = document.getElementById('annee-exp-stat-num');
    if (blogStatsExp && attrs[f.annne_exp] != null) {
      blogStatsExp.textContent = `${parseInt(attrs[f.annne_exp], 10)} ans`;
    }

    // Abonnés réseaux
    const blogStatsAbonnes = document.getElementById('abonnes-stat-num');
    if (blogStatsAbonnes && attrs[f.abonner_reseaux] != null) {
      blogStatsAbonnes.textContent = parseInt(attrs[f.abonner_reseaux], 10);
    }

    animateCounters('.blog-stats');
  } catch (e) {
    // 404 attendu tant que le single type n'est pas publié — fallback HTML conservé
    console.error('[CMS] page-blog:', e.message);
  }
}

const ARTICLES_ROW2_INITIAL = 4; // + 2 en vedette = 6 articles visibles au chargement
const ARTICLES_ROW2_BATCH = 6;   // révélés à chaque clic sur "Voir plus"

export async function loadArticles() {
  try {
    const cacheKey = 'cms:blog-articles';
    let data = getCached(cacheKey);

    if (!data) {
      const res = await fetchJSON('/api/blog-articles?populate[image_couverture]=true&populate[blog_tags]=true');
      data = res.data;
      if (data?.length) setCached(cacheKey, data);
    }

    if (!data?.length) return; // collection vide → fallback HTML intact
    const featured = document.getElementById('section-articles');
    if (!featured) return;
    const row2 = document.getElementById('articles-row2');
    const f = CONFIG.FIELDS.blogArticle;

    // Nombre d'articles dans la base
    const blogStatsCount = document.getElementById('article-stat-num');
    if (blogStatsCount) {
      blogStatsCount.textContent = data.length;
    }

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

    revealGrid('#section-articles', ':scope > .article-card');

    // Rangée secondaire : le reste, avec bouton "Voir plus"
    if (row2) {
      row2.innerHTML = '';
      const remaining = rest.slice(1);
      // Fix : afficher dès qu'il y a AU MOINS 1 article restant (pas > 1)
      row2.style.display = remaining.length > 0 ? '' : 'none';

      if (remaining.length > 0) {
        let cursor = 0;

        const moreBtn = document.createElement('button');
        moreBtn.className = 'filter-btn';
        moreBtn.style.cssText = 'grid-column:1 / -1;justify-self:center;margin-top:16px;';
        moreBtn.textContent = "Voir plus d'articles";
        row2.appendChild(moreBtn);

        function renderNextBatch(count) {
          const slice = remaining.slice(cursor, cursor + count);
          slice.forEach((article, i) => {
            const tmp = document.createElement('div');
            tmp.innerHTML = buildBlogArticleCard(article, i);
            const card = tmp.firstElementChild;
            row2.insertBefore(card, moreBtn); // toujours avant le bouton
            attachArticleNavigation(card, article);
          });
          cursor += slice.length;

          revealGrid('#articles-row2', ':scope > .article-card:not([data-revealed])');   // ← ajouter
          row2.querySelectorAll('.article-card').forEach(c => c.setAttribute('data-revealed', ''));  // ← ajouter
          refreshScrollTrigger();   // ← ajouter


          const hasMore = cursor < remaining.length;
          moreBtn.style.display = hasMore ? '' : 'none';
        }

        renderNextBatch(ARTICLES_ROW2_INITIAL);
        moreBtn.addEventListener('click', () => renderNextBatch(ARTICLES_ROW2_BATCH));
      }
    }

    buildTagChips(sorted);
    window.dispatchEvent(new Event('resize'));
  } catch (e) {
    console.error('[CMS] blog-articles:', e.message);
  } finally { hideSkeleton('skeleton-view-blog') }
}

export async function loadArticleDetailSPA(slug) {
  const elArticle = document.getElementById('article-detail');
  const elNotFound = document.getElementById('article-notfound');

  if (!slug) return;

  try {
    const cacheKey = `cms:article:${slug}`;
    let data = getCached(cacheKey);

    if (!data) {
      const endpoint = `/api/blog-articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[image_couverture]=true&populate[blog_tags]=true`;
      const res = await fetchJSON(endpoint);
      data = res.data;
      if (data?.length) setCached(cacheKey, data);
    }

    if (!data || data.length === 0) {
      if (elArticle) elArticle.hidden = true;
      if (elNotFound) elNotFound.hidden = false;
      return;
    }

    const article = data[0];
    const attr = article.attributes || article;
    const f = CONFIG?.FIELDS?.blogArticle || {};

    // 1. Récupération dynamique de toutes les clés d'attributs
    const titre = attr[f.titre] || attr.titre || attr.Titre || attr.name || 'Article sans titre';
    const contenu = attr[f.contenu] || attr.contenu || attr.content || '';
    const dateRaw = attr[f.date_publication] || attr.date_publication || attr.publishedAt;
    const date = dateRaw ? new Date(dateRaw).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const tags = attr[f.tags] || attr.tags || [];

    // Image de couverture
    const coverField = attr.image_couverture;
    const coverUrl = mediaUrl(Array.isArray(coverField) ? coverField[0] : coverField, { width: 900 });
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

    initShareButtons(document.querySelector('.share-buttons'), {
      title: article.titre, // adapte au nom réel du champ
      url: window.location.href
    });

    // 4. Affichage de la vue
    if (elNotFound) elNotFound.hidden = true;
    if (elArticle) {
      elArticle.hidden = false;
      fadeInView(elArticle);   // ← ajouté : fondu d'entrée du détail d'article
    }

  } catch (e) {
    console.error('[CMS] Erreur lors du rendu du détail de l\'article :', e);
  } finally {
    hideSkeleton('skeleton-view-article');           // ← ligne ajoutée
  }
}

window.setFilter = setFilter;