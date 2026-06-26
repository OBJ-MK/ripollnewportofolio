/* cms.js — Hydratation Strapi v5 → DOM
 * Fallback : si l'API échoue, le contenu HTML par défaut reste affiché.
 * Ne jamais vider le DOM avant d'avoir une réponse valide.
 */

const CONFIG = {
  STRAPI_URL: 'https://ripolldarcia-backend.up.railway.app',
  FIELDS: {
    hero: {
      Entete: 'Entete',           // remappé : était Titre — le schéma l'appelle Entete (richtext)
      sousTitre: 'sousTitre',
      badgeTexte: 'badgeTexte',
      statProjets: 'statProjets',
      statExperience: 'statExperience',
      statSatisfaction: 'statSatisfaction',
    },
    apropo: {
      // Titre supprimé  : n'existe pas dans le schéma
      // Contenu supprimé : n'existe pas — remplacé par Paragraphe1 + Paragraphe2
      Paragraphe1: 'Paragraphe1', // remappé : était Contenu — texte richtext (string)
      Paragraphe2: 'Paragraphe2', // nouveau : second paragraphe (string)
      points_forts: 'points_forts', // nouveau : rich-text blocks → liste .value-item
      Photo: 'Photo',             // inchangé : media plat { url, ... }
      Email: 'Email',
      LinkedIn: 'LinkedIn',
      Facebook: 'Facebook',
      Twitter: 'Twitter',
      Instagram: 'Instagram',
    },
    projet: {
      Titre: 'Titre',
      Type: 'Type',
      Categorie: 'Categorie',
      descriptionCourte: 'descriptionCourte', // remappé : était Description
      descriptionLongue: 'descriptionLongue', // rich-text blocks → modal
      Lien: 'Lien',
      Image: 'Image',        // multiple:true → tableau; on prend [0] pour la carte
      galerie: 'galerie',    // répétable : { image: { url }, legende }
      badges: 'badges',      // répétable : { label }
      liens: 'liens',        // répétable : { label, url }
      accentColor: 'accentColor',
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

/* Convertit points_forts (blocks Strapi v5) en <div class="value-item"> */
function buildPointsForts(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter(b => b.type === 'list')
    .flatMap(b => b.children || [])
    .filter(item => item.type === 'list-item')
    .map(item => {
      const text = (item.children || []).map(n => n.text || '').join('');
      return text ? `<div class="value-item"><span class="value-check">✦</span>${text}</div>` : '';
    })
    .filter(Boolean)
    .join('');
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
    // Entete (richtext) → sélecteur hero.Entete dans le DOM
    if (attrs[f.Entete]) hydrate('hero.Entete', attrs[f.Entete]);
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

    // Paragraphe1 / Paragraphe2 : richtext Strapi → string simple
    if (attrs[f.Paragraphe1]) hydrate('apropo.Paragraphe1', attrs[f.Paragraphe1]);
    if (attrs[f.Paragraphe2]) hydrate('apropo.Paragraphe2', attrs[f.Paragraphe2]);

    // points_forts : blocks Strapi v5 → <div class="value-item"> avec ✦
    const pointsHtml = buildPointsForts(attrs[f.points_forts]);
    if (pointsHtml) hydrateHTML('apropo.points_forts', pointsHtml);

    // Email : texte affiché + href mailto (jamais "null")
    if (attrs[f.Email]) {
      const emailLink = document.querySelector('[data-cms="apropo.Email"]');
      if (emailLink) {
        emailLink.textContent = attrs[f.Email];
        emailLink.href = `mailto:${attrs[f.Email]}`;
      }
    }

    // Réseaux sociaux : ne toucher au href que si la valeur n'est pas null
    if (attrs[f.LinkedIn]) {
      const el = document.querySelector('[data-cms="apropo.LinkedIn"]');
      if (el) el.href = attrs[f.LinkedIn];
    }
    if (attrs[f.Facebook]) {
      const el = document.querySelector('[data-cms="apropo.Facebook"]');
      if (el) el.href = attrs[f.Facebook];
    }
    if (attrs[f.Twitter]) {
      const el = document.querySelector('[data-cms="apropo.Twitter"]');
      if (el) el.href = attrs[f.Twitter];
    }
    if (attrs[f.Instagram]) {
      const el = document.querySelector('[data-cms="apropo.Instagram"]');
      if (el) el.href = attrs[f.Instagram];
    }

    // Photo : Strapi v5 media plat { url, ... }
    const photoUrl = mediaUrl(attrs[f.Photo]);
    if (photoUrl) {
      const avatar = document.querySelector('.avatar-placeholder');
      if (avatar) {
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = 'Photo de profil';
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
  const desc = attrs[f.descriptionCourte] || ''; // remappé : était Description
  const lien = attrs[f.Lien] || '#';
  const stackItems = (Array.isArray(attrs[f.stack]) ? attrs[f.stack] : [])
    .map(s => `<span class="stack-badge">${s.nom || s.name || s}</span>`).join('');
  // Image multiple:true → tableau; on prend le premier élément
  const imageField = Array.isArray(attrs[f.Image]) ? attrs[f.Image][0] : attrs[f.Image];
  const imgUrl = mediaUrl(imageField);
  const thumbContent = imgUrl
    ? `<img src="${imgUrl}" alt="${titre}" style="width:100%;height:100%;object-fit:cover;">`
    : `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="180" fill="rgba(245,197,24,0.03)"/><text x="150" y="100" text-anchor="middle" fill="rgba(245,197,24,0.3)" font-size="14">${titre}</text></svg>`;

  return `<div class="project-card fade-in visible" style="transition-delay:${index * 0.1}s" tabindex="0" role="button" aria-label="Voir le projet ${titre}">
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

function attachCardModal(card, proj) {
  card.addEventListener('click', () => openProjetModal(proj));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProjetModal(proj); }
  });
}

async function loadProjets() {
  try {
    const { data } = await fetchJSON(
      '/api/projets' +
      '?populate[Image]=true' +
      '&populate[stack]=true' +
      '&populate[galerie][populate][Image]=true' +
      '&populate[badges]=true' +
      '&populate[liens]=true'
    );
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
        const newCard = tmp.firstElementChild;
        container.appendChild(newCard);
        attachCardModal(newCard, proj);
        return;
      }

      // Hydratation champ par champ dans la carte existante
      if (attrs[f.Titre]) hydrateField(card, 'projet.Titre', attrs[f.Titre]);
      if (attrs[f.Type]) hydrateField(card, 'projet.Type', attrs[f.Type]);
      // descriptionCourte remplacé Description dans le schéma
      if (attrs[f.descriptionCourte]) hydrateField(card, 'projet.Description', attrs[f.descriptionCourte]);

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

      // Image multiple:true → tableau; on prend le premier élément
      const imageField = Array.isArray(attrs[f.Image]) ? attrs[f.Image][0] : attrs[f.Image];
      const imgUrl = mediaUrl(imageField);
      if (imgUrl) {
        const thumbEl = card.querySelector('.project-thumb');
        if (thumbEl) thumbEl.innerHTML = `<img src="${imgUrl}" alt="${attrs[f.Titre] || ''}" style="width:100%;height:100%;object-fit:cover;">`;
      }

      // Clic / clavier → ouvrir le modal
      attachCardModal(card, proj);
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

/* ── Modal projet ─────────────────────────────────────────── */

let _modalTrigger = null;
let _modalKeyHandler = null;
let _sliderCleanup = null;

/* Fusionne galerie (composant répétable) + Image (multiple:true), dédoublonne par url */
function buildImageSlides(proj) {
  const seen = new Set();
  const slides = [];
  const f = CONFIG.FIELDS.projet;

  const galerie = Array.isArray(proj[f.galerie]) ? proj[f.galerie] : [];
  galerie.forEach(item => {
    const imgObj = item && item.image;
    if (!imgObj) return;
    const url = mediaUrl(imgObj);
    if (!url || seen.has(url)) return;
    seen.add(url);
    slides.push({ url, legende: item.legende || null });
  });

  const images = Array.isArray(proj[f.Image]) ? proj[f.Image] : (proj[f.Image] ? [proj[f.Image]] : []);
  images.forEach(img => {
    if (!img) return;
    const url = mediaUrl(img);
    if (!url || seen.has(url)) return;
    seen.add(url);
    slides.push({ url, legende: null });
  });

  return slides;
}

function getFocusables(container) {
  return Array.from(container.querySelectorAll(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function initModalSlider(sliderEl, slides) {
  if (_sliderCleanup) { _sliderCleanup(); _sliderCleanup = null; }

  const track = sliderEl.querySelector('#slider-track');
  const dotsEl = sliderEl.querySelector('#slider-dots');
  const captionEl = sliderEl.querySelector('#slider-caption');
  const prevBtn = sliderEl.querySelector('.slider-prev');
  const nextBtn = sliderEl.querySelector('.slider-next');

  let current = 0;

  track.innerHTML = slides.map((s, idx) => {
    const loading = idx === 0 ? 'eager' : 'lazy';
    return `<div class="slider-slide"><img src="${s.url}" alt="${s.legende || ''}" loading="${loading}"></div>`;
  }).join('');

  dotsEl.innerHTML = slides.map((_, idx) =>
    `<button class="slider-dot${idx === 0 ? ' active' : ''}" aria-label="Image ${idx + 1}"></button>`
  ).join('');

  const dots = dotsEl.querySelectorAll('.slider-dot');

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    const leg = slides[current].legende;
    captionEl.textContent = leg || '';
  }

  goTo(0);

  const onPrev = () => goTo(current - 1);
  const onNext = () => goTo(current + 1);
  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  // Swipe tactile
  let touchX = 0;
  const onTouchStart = e => { touchX = e.touches[0].clientX; };
  const onTouchEnd = e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) dx < 0 ? goTo(current + 1) : goTo(current - 1);
  };
  track.addEventListener('touchstart', onTouchStart, { passive: true });
  track.addEventListener('touchend', onTouchEnd, { passive: true });

  _sliderCleanup = () => {
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    track.removeEventListener('touchstart', onTouchStart);
    track.removeEventListener('touchend', onTouchEnd);
  };

  // Masquer flèches si une seule image
  if (slides.length <= 1) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    dotsEl.hidden = true;
  } else {
    prevBtn.hidden = false;
    nextBtn.hidden = false;
    dotsEl.hidden = false;
  }
}

function openProjetModal(proj) {
  const f = CONFIG.FIELDS.projet;
  const modal = document.getElementById('projet-modal');
  if (!modal) return;

  const accentColor = proj[f.accentColor] || '#f5c518';
  modal.querySelector('.modal-panel').style.setProperty('--modal-accent', accentColor);
  modal.querySelector('.modal-categorie').style.color = accentColor;

  // Titre
  const titre = proj[f.Titre] || '';
  modal.querySelector('#modal-titre').textContent = titre;

  // Catégorie
  const categorie = proj[f.Categorie] || proj[f.Type] || '';
  modal.querySelector('#modal-categorie').textContent = categorie;

  // Description : descriptionLongue (rich-text blocks) → fallback descriptionCourte (texte)
  const descEl = modal.querySelector('#modal-desc');
  const descHtml = blocksToHTML(proj[f.descriptionLongue]);
  if (descHtml) {
    descEl.innerHTML = descHtml;
    descEl.hidden = false;
  } else {
    const descCourte = proj[f.descriptionCourte] || '';
    if (descCourte) {
      descEl.innerHTML = `<p>${descCourte}</p>`;
      descEl.hidden = false;
    } else {
      descEl.innerHTML = '';
      descEl.hidden = true;
    }
  }

  // Tags : stack (même source que la carte) + badges Strapi, dédoublonnés par label
  const tagsEl = modal.querySelector('#modal-tags');
  const stackArr = Array.isArray(proj[f.stack]) ? proj[f.stack] : [];
  const badgesArr = Array.isArray(proj[f.badges]) ? proj[f.badges] : [];
  const seenLabels = new Set();
  const allTags = [];
  stackArr.forEach(s => {
    const label = (s && (s.nom || s.name)) || (typeof s === 'string' ? s : '');
    if (label && !seenLabels.has(label)) { seenLabels.add(label); allTags.push(label); }
  });
  badgesArr.forEach(b => {
    const label = (b && (b.label || b.nom)) || (typeof b === 'string' ? b : '');
    if (label && !seenLabels.has(label)) { seenLabels.add(label); allTags.push(label); }
  });
  if (allTags.length) {
    tagsEl.innerHTML = allTags.map(l => `<span class="modal-badge">${l}</span>`).join('');
    tagsEl.hidden = false;
  } else {
    tagsEl.innerHTML = '';
    tagsEl.hidden = true;
  }

  // Liens : collection liens (label+url) → fallback champ Lien simple
  const liensEl = modal.querySelector('#modal-liens');
  const liensArr = Array.isArray(proj[f.liens]) ? proj[f.liens] : [];
  const liensValides = liensArr.filter(l => l && l.url && l.label);
  if (!liensValides.length && proj[f.Lien]) {
    liensValides.push({ label: 'Voir le projet', url: proj[f.Lien] });
  }
  const extIcon =
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">` +
    `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>` +
    `<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>` +
    `</svg>`;
  if (liensValides.length) {
    liensEl.innerHTML = liensValides
      .map(l => `<a href="${l.url}" class="modal-lien-btn" target="_blank" rel="noopener">${extIcon}${l.label}</a>`)
      .join('');
    liensEl.hidden = false;
  } else {
    liensEl.innerHTML = '';
    liensEl.hidden = true;
  }

  // Slider d'images
  const sliderEl = modal.querySelector('#modal-slider');
  const slides = buildImageSlides(proj);
  if (slides.length) {
    initModalSlider(sliderEl, slides);
    sliderEl.hidden = false;
  } else {
    sliderEl.hidden = true;
  }

  // Ouvrir
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  _modalTrigger = document.activeElement;
  modal.querySelector('.modal-close').focus();

  // Focus trap + fermeture Échap
  _modalKeyHandler = e => {
    if (e.key === 'Escape') { closeProjetModal(); return; }
    if (e.key !== 'Tab') return;
    const focusables = getFocusables(modal.querySelector('.modal-panel'));
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', _modalKeyHandler);
}

function closeProjetModal() {
  const modal = document.getElementById('projet-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (_modalKeyHandler) { document.removeEventListener('keydown', _modalKeyHandler); _modalKeyHandler = null; }
  if (_sliderCleanup) { _sliderCleanup(); _sliderCleanup = null; }
  if (_modalTrigger) { _modalTrigger.focus(); _modalTrigger = null; }
}

/* Init overlay et croix une seule fois au DOMContentLoaded */
function initModalListeners() {
  const modal = document.getElementById('projet-modal');
  if (!modal) return;
  modal.querySelector('.modal-overlay').addEventListener('click', closeProjetModal);
  modal.querySelector('.modal-close').addEventListener('click', closeProjetModal);
}

/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const isIndex = !window.location.pathname.includes('blog');
  const isBlog = window.location.pathname.includes('blog');

  if (isIndex) {
    initModalListeners();
    loadHero();
    loadApropo();
    loadProjets();
    loadPostes();
  }
  if (isBlog) {
    loadArticles();
  }
});
