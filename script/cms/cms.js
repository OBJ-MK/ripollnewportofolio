/* cms.js — Hydratation Strapi v5 → DOM
 * Fallback : si l'API échoue, le contenu HTML par défaut reste affiché.
 * Ne jamais vider le DOM avant d'avoir une réponse valide.
 */

const CONFIG = {
  STRAPI_URL: 'https://ripolldarcia-backend.up.railway.app',
  FIELDS: {
    hero: {
      Titre: 'Titre',
      sousTitre: 'sousTitre',
      badgeTexte: 'badgeTexte',
      statProjets: 'statProjets',
      statExperience: 'statExperience',
      statSatisfaction: 'statSatisfaction',
    },
    apropo: {
      Titre: 'Titre',
      Contenu: 'Contenu',
      Photo: 'Photo',
      Email: 'Email',
      LinkedIn: 'LinkedIn',
      Facebook: 'Facebook',
      Twitter: 'Twitter',
      Instagram: 'Instagram',
    },
    projet: {
      Titre: 'Titre',
      Type: 'Type',
      Description: 'Description',
      Lien: 'Lien',
      Image: 'Image',
      stack: 'stack',
    },
    article: {
      Titre: 'Titre',
      slug: 'slug',
      Contenu: 'Contenu',
      Resume: 'Resume',
      Image: 'Image',
      Categorie: 'Categorie',
    },
    poste: {
      Titre: 'Titre',
      Description: 'Description',
      Localisation: 'Localisation',
      Temps: 'Temps',
      Salaire: 'Salaire',
      Statut: 'Statut',
      Entreprise: 'Entreprise',
    },
  },
};

/* ── Helpers ──────────────────────────────────────────────── */

function apiUrl(path) {
  return `${CONFIG.STRAPI_URL}${path}`;
}

async function fetchJSON(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
}

/* Convertit le format "blocks" (rich text Strapi v5) en HTML simplifié */
function blocksToHTML(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      const text = (block.children || []).map(n => {
        let t = n.text || '';
        if (n.bold) t = `<strong>${t}</strong>`;
        if (n.italic) t = `<em>${t}</em>`;
        if (n.underline) t = `<u>${t}</u>`;
        return t;
      }).join('');
      return `<p>${text}</p>`;
    }
    if (block.type === 'heading') {
      const level = block.level || 2;
      const text = (block.children || []).map(n => n.text || '').join('');
      return `<h${level}>${text}</h${level}>`;
    }
    if (block.type === 'list') {
      const tag = block.format === 'ordered' ? 'ol' : 'ul';
      const items = (block.children || []).map(item => {
        const text = (item.children || []).map(n => n.text || '').join('');
        return `<li>${text}</li>`;
      }).join('');
      return `<${tag}>${items}</${tag}>`;
    }
    return '';
  }).join('');
}

/* Résout l'URL d'un champ media Strapi v5 (format plat : { url, ... }) */
function mediaUrl(field) {
  if (!field) return null;
  const url = field.url || null;
  if (!url) return null;
  return url.startsWith('http') ? url : CONFIG.STRAPI_URL + url;
}

/* Hydrate un seul élément DOM via son attribut data-cms */
function hydrate(selector, value) {
  const el = document.querySelector(`[data-cms="${selector}"]`);
  if (!el || value == null) return;
  if (el.tagName === 'A') {
    el.href = value;
    if (!el.textContent.trim() || el.textContent.trim() === selector) {
      el.textContent = value;
    }
  } else if (el.tagName === 'IMG') {
    el.src = value;
  } else {
    el.textContent = value;
  }
}

/* Hydrate avec innerHTML — remplace <p> par <div> si nécessaire (évite <p> dans <p>) */
function hydrateHTML(selector, html) {
  const el = document.querySelector(`[data-cms="${selector}"]`);
  if (!el || !html) return;
  if (el.tagName === 'P') {
    const div = document.createElement('div');
    div.className = el.className;
    div.setAttribute('data-cms', selector);
    div.innerHTML = html;
    el.replaceWith(div);
  } else {
    el.innerHTML = html;
  }
}

/* Hydrate un champ textuel dans le scope d'une carte (évite les sélecteurs ambigus) */
function hydrateField(card, selector, value) {
  if (value == null) return;
  const el = card.querySelector(`[data-cms="${selector}"]`);
  if (!el) return;
  el.textContent = value;
}

/* ── Fetch & hydratation : Hero ───────────────────────────── */

async function loadHero() {
  try {
    const { data } = await fetchJSON('/api/hero');
    // Strapi v5 : champs plats directement sur data (pas data.attributes)
    const attrs = data || {};
    const f = CONFIG.FIELDS.hero;
    if (attrs[f.Titre]) hydrate('hero.Titre', attrs[f.Titre]);
    if (attrs[f.sousTitre]) hydrate('hero.sousTitre', attrs[f.sousTitre]);
    if (attrs[f.badgeTexte]) hydrate('hero.badgeTexte', attrs[f.badgeTexte]);
    if (attrs[f.statProjets] != null) hydrate('hero.statProjets', attrs[f.statProjets] + '+');
    if (attrs[f.statExperience] != null) hydrate('hero.statExperience', attrs[f.statExperience] + ' ans');
    if (attrs[f.statSatisfaction] != null) hydrate('hero.statSatisfaction', String(attrs[f.statSatisfaction]) + '%');
  } catch (e) {
    console.error('[CMS] hero:', e.message);
  }
}

/* ── Fetch & hydratation : À propos ──────────────────────── */

async function loadApropo() {
  try {
    const { data } = await fetchJSON('/api/apropo?populate=*');
    // Strapi v5 : champs plats directement sur data
    const attrs = data || {};
    const f = CONFIG.FIELDS.apropo;
    if (attrs[f.Titre]) hydrate('apropo.Titre', attrs[f.Titre]);
    if (attrs[f.Contenu]) hydrateHTML('apropo.Contenu', blocksToHTML(attrs[f.Contenu]));
    if (attrs[f.Email]) {
      hydrate('apropo.Email', attrs[f.Email]);
      const emailLink = document.querySelector('[data-cms="apropo.Email"]');
      if (emailLink) emailLink.href = `mailto:${attrs[f.Email]}`;
    }
    if (attrs[f.LinkedIn]) {
      const el = document.querySelector('[data-cms="apropo.LinkedIn"]');
      if (el) el.href = attrs[f.LinkedIn];
    }
    // Strapi v5 : media plat { url, ... } (plus data.attributes.url)
    const photoUrl = mediaUrl(attrs[f.Photo]);
    if (photoUrl) {
      const avatar = document.querySelector('.avatar-placeholder');
      if (avatar) {
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = attrs[f.Titre] || 'Photo de profil';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
        avatar.replaceWith(img);
      }
    }
  } catch (e) {
    console.error('[CMS] apropo:', e.message);
  }
}

/* ── Fetch & hydratation : Projets ───────────────────────── */

/* Construit une carte projet complète (utilisé pour les index sans carte en dur) */
function buildProjetCard(proj, index) {
  const f = CONFIG.FIELDS.projet;
  // Strapi v5 : champs plats
  const attrs = proj;
  const titre = attrs[f.Titre] || '';
  const type = attrs[f.Type] || '';
  const desc = attrs[f.Description] || '';
  const lien = attrs[f.Lien] || '#';
  const stackItems = (Array.isArray(attrs[f.stack]) ? attrs[f.stack] : [])
    .map(s => `<span class="stack-badge">${s.nom || s.name || s}</span>`).join('');
  // Strapi v5 : media plat { url, ... }
  const imgUrl = mediaUrl(attrs[f.Image]);
  const thumbContent = imgUrl
    ? `<img src="${imgUrl}" alt="${titre}" style="width:100%;height:100%;object-fit:cover;">`
    : `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="180" fill="rgba(245,197,24,0.03)"/><text x="150" y="100" text-anchor="middle" fill="rgba(245,197,24,0.3)" font-size="14">${titre}</text></svg>`;

  return `<div class="project-card fade-in visible" style="transition-delay:${index * 0.1}s">
    <div class="project-thumb" style="background:linear-gradient(135deg,#0f1a2e,#1a2a4a);">${thumbContent}</div>
    <div class="project-body">
      <div class="project-type">${type}</div>
      <div class="project-name">${titre}</div>
      <p class="project-desc">${desc}</p>
      <div class="project-footer">
        <div class="project-stack">${stackItems}</div>
        <a href="${lien}" class="project-link" target="_blank" rel="noopener">Voir →</a>
      </div>
    </div>
  </div>`;
}

async function loadProjets() {
  try {
    const { data } = await fetchJSON('/api/projets?populate=*');
    console.log('[CMS] projets reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const container = document.getElementById('projets-container');
    if (!container) return;
    const f = CONFIG.FIELDS.projet;

    data.forEach((proj, i) => {
      // Strapi v5 : champs plats
      const attrs = proj;
      const card = container.querySelector(`[data-cms-project="${i}"]`);

      if (!card) {
        // Pas de carte en dur pour cet index : on l'ajoute
        const tmp = document.createElement('div');
        tmp.innerHTML = buildProjetCard(proj, i);
        container.appendChild(tmp.firstElementChild);
        return;
      }

      // Hydratation champ par champ dans la carte existante
      if (attrs[f.Titre]) hydrateField(card, 'projet.Titre', attrs[f.Titre]);
      if (attrs[f.Type]) hydrateField(card, 'projet.Type', attrs[f.Type]);
      if (attrs[f.Description]) hydrateField(card, 'projet.Description', attrs[f.Description]);

      // Lien : ne jamais écrire "null"
      if (attrs[f.Lien]) {
        const lienEl = card.querySelector('[data-cms="projet.Lien"]');
        if (lienEl) lienEl.href = attrs[f.Lien];
      }

      // Stack badges : régénérer si l'API renvoie un tableau non vide
      const stackEl = card.querySelector('[data-cms="projet.stack"]');
      if (stackEl && Array.isArray(attrs[f.stack]) && attrs[f.stack].length) {
        stackEl.innerHTML = attrs[f.stack]
          .map(s => `<span class="stack-badge">${s.nom || s.name || s}</span>`).join('');
      }

      // Image : Strapi v5 media plat { url, ... }
      const imgUrl = mediaUrl(attrs[f.Image]);
      if (imgUrl) {
        const thumbEl = card.querySelector('.project-thumb');
        if (thumbEl) thumbEl.innerHTML = `<img src="${imgUrl}" alt="${attrs[f.Titre] || ''}" style="width:100%;height:100%;object-fit:cover;">`;
      }
    });
  } catch (e) {
    console.error('[CMS] projets:', e.message);
  }
}

/* ── Fetch & hydratation : Postes ────────────────────────── */

/* Construit une carte poste complète (utilisé pour les index sans carte en dur) */
function buildPosteCard(poste, index) {
  const f = CONFIG.FIELDS.poste;
  // Strapi v5 : champs plats
  const attrs = poste;
  const titre = attrs[f.Titre] || '';
  const desc = attrs[f.Description] || '';
  const entreprise = attrs[f.Entreprise] || '';
  const localisation = attrs[f.Localisation] || '';
  const temps = attrs[f.Temps] || '';
  const salaire = attrs[f.Salaire] || '';
  const statut = attrs[f.Statut] || 'Disponible';
  const badgeClass = statut === 'Disponible' ? 'badge-open' : 'badge-closed';

  return `<div class="poste-card fade-in visible" style="transition-delay:${index * 0.1}s">
    <div class="poste-header">
      <div>
        <div class="poste-title">${titre}</div>
        <div class="poste-company">${entreprise}</div>
      </div>
      <span class="poste-badge ${badgeClass}">${statut}</span>
    </div>
    <p class="poste-desc">${desc}</p>
    <div class="poste-footer">
      <div class="poste-meta">
        ${localisation ? `<span class="poste-meta-item">📍 ${localisation}</span>` : ''}
        ${temps ? `<span class="poste-meta-item">⏱ ${temps}</span>` : ''}
        ${salaire ? `<span class="poste-meta-item">💶 ${salaire}</span>` : ''}
      </div>
      <button class="apply-btn">Postuler</button>
    </div>
  </div>`;
}

async function loadPostes() {
  try {
    const { data } = await fetchJSON('/api/postes');
    console.log('[CMS] postes reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const container = document.getElementById('postes-container');
    if (!container) return;
    const f = CONFIG.FIELDS.poste;

    data.forEach((poste, i) => {
      // Strapi v5 : champs plats
      const attrs = poste;
      const card = container.querySelector(`[data-cms-poste="${i}"]`);

      if (!card) {
        // Pas de carte en dur pour cet index : on l'ajoute
        const tmp = document.createElement('div');
        tmp.innerHTML = buildPosteCard(poste, i);
        container.appendChild(tmp.firstElementChild);
        return;
      }

      // Hydratation champ par champ dans la carte existante
      if (attrs[f.Titre]) hydrateField(card, 'poste.Titre', attrs[f.Titre]);
      if (attrs[f.Description]) hydrateField(card, 'poste.Description', attrs[f.Description]);
      if (attrs[f.Entreprise]) hydrateField(card, 'poste.Entreprise', attrs[f.Entreprise]);

      // Préfixes emoji conservés
      if (attrs[f.Localisation]) hydrateField(card, 'poste.Localisation', `📍 ${attrs[f.Localisation]}`);
      if (attrs[f.Temps]) hydrateField(card, 'poste.Temps', `⏱ ${attrs[f.Temps]}`);
      if (attrs[f.Salaire]) hydrateField(card, 'poste.Salaire', `💶 ${attrs[f.Salaire]}`);

      // Statut : texte + classe badge
      if (attrs[f.Statut]) {
        const statutEl = card.querySelector('[data-cms="poste.Statut"]');
        if (statutEl) {
          statutEl.textContent = attrs[f.Statut];
          statutEl.className = `poste-badge ${attrs[f.Statut] === 'Disponible' ? 'badge-open' : 'badge-closed'}`;
        }
      }
    });
  } catch (e) {
    console.error('[CMS] postes:', e.message);
  }
}

/* ── Fetch & hydratation : Articles (blog.html) ──────────── */

function buildArticleCard(article, index) {
  const f = CONFIG.FIELDS.article;
  // Strapi v5 : champs plats
  const attrs = article;
  const titre = attrs[f.Titre] || '';
  const resume = attrs[f.Resume] || '';
  const categorie = attrs[f.Categorie] || '';
  // Strapi v5 : media plat { url, ... }
  const imgUrl = mediaUrl(attrs[f.Image]);
  const thumbContent = imgUrl
    ? `<img src="${imgUrl}" alt="${titre}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="article-thumb-bg" style="background:linear-gradient(135deg,#0f1a2e,#1a2a4a)"><i class="fa-solid fa-newspaper"></i></div>`;

  return `<div class="article-card fade-in visible" style="transition-delay:${index * 0.1}s" data-type="article">
    <div class="article-thumb">${thumbContent}</div>
    <div class="article-body">
      <div class="article-meta">
        <span class="article-date">${categorie}</span>
      </div>
      <div class="article-title">${titre}</div>
      <p class="article-excerpt">${resume}</p>
      <div class="article-footer">
        <div class="article-tags"><span class="article-tag">${categorie}</span></div>
        <a href="#" class="read-link">Lire →</a>
      </div>
    </div>
  </div>`;
}

async function loadArticles() {
  try {
    const { data } = await fetchJSON('/api/articles?populate=*');
    console.log('[CMS] articles reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const featured = document.getElementById('section-articles');
    if (!featured) return;
    const cards = featured.querySelectorAll('.article-card');

    data.forEach((article, i) => {
      const newCardHtml = buildArticleCard(article, i);
      const tmp = document.createElement('div');
      tmp.innerHTML = newCardHtml;
      const newCard = tmp.firstElementChild;
      if (cards[i]) {
        // Remplace la carte existante, les cartes suivantes restent intactes
        cards[i].replaceWith(newCard);
      } else {
        featured.appendChild(newCard);
      }
    });
  } catch (e) {
    console.error('[CMS] articles:', e.message);
  }
}

/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const isIndex = !window.location.pathname.includes('blog');
  const isBlog = window.location.pathname.includes('blog');

  if (isIndex) {
    loadHero();
    loadApropo();
    loadProjets();
    loadPostes();
  }
  if (isBlog) {
    loadArticles();
  }
});
