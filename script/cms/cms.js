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
      descriptionCourte: 'descriptionCourte',
      descriptionLongue: 'descriptionLongue', // rich text Markdown (string)
      Lien: 'Lien',
      Image: 'Image',   // Multiple Media → tableau de { url, ... }
      logo: 'logo',     // Single Media → objet plat { url, formats } ou null
      badges: 'badges', // répétable : { label, Type }
      liens: 'liens',   // répétable : { Label, URL }
      stack: 'stack',   // répétable : { nom }
    },
    blogArticle: {
      Titre: 'Titre',
      slug: 'slug',
      description_courte: 'description_courte',
      contenu: 'contenu',                 // blocks Strapi v5
      image_couverture: 'image_couverture', // Single Media plat { url, formats }
      date_publication: 'date_publication',
      blog_tags: 'blog_tags',             // relation manyToMany → [{ nom }]
      mis_en_avant: 'mis_en_avant',
    },
    blogTag: {
      nom: 'nom',
    },
    pageBlog: {
      titre_principal: 'titre_principal',
      sous_titre: 'sous_titre',
    },
    socialPost: {
      plateforme: 'plateforme',   // enum : Instagram | Twitter | LinkedIn
      date_texte: 'date_texte',
      contenu: 'contenu',
      hashtags: 'hashtags',
      likes: 'likes',
      Commantaire: 'Commantaire', // ⚠ casse immuable du schéma (C majuscule, orthographe du schéma)
      Repost: 'Repost',           // ⚠ casse immuable du schéma
      lien_externe: 'lien_externe',
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
    service: {
      Titre: 'Titre',
      Description: 'Description',
      tags: 'tags',
      Image: 'Image',
      Ordre: 'Ordre',
    },
    outil: {
      Nom: 'Nom',
      Image: 'Image',
      Pourcentage: 'Pourcentage',
      Vedette: 'Vedette',
      Ordre: 'Ordre',
    },
    partenaire: {
      NomDuDomaine: 'NomDuDomaine',
      Description: 'Description',
      Image: 'Image',
    },
    temoignage: {
      Citation: 'Citation',
      Auteur: 'Auteur',
      Fonction: 'Fonction',
      Entreprise: 'Entreprise',
      Note: 'Note',
      Photo: 'Photo',
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

/* Échappe le HTML d'un texte saisi dans Strapi (anti-injection) */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Rend les nœuds inline d'un block (texte formaté + liens) */
function renderInline(nodes) {
  return (nodes || []).map(n => {
    if (n.type === 'link') {
      const inner = renderInline(n.children);
      return `<a href="${escapeHTML(n.url || '#')}" target="_blank" rel="noopener">${inner}</a>`;
    }
    let t = escapeHTML(n.text || '');
    if (n.code) t = `<code>${t}</code>`;
    if (n.bold) t = `<strong>${t}</strong>`;
    if (n.italic) t = `<em>${t}</em>`;
    if (n.underline) t = `<u>${t}</u>`;
    if (n.strikethrough) t = `<s>${t}</s>`;
    return t;
  }).join('');
}

/* Convertit le format "blocks" (rich text Strapi v5) en HTML */
function blocksToHTML(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      const text = renderInline(block.children);
      return text.trim() ? `<p>${text}</p>` : '';
    }
    if (block.type === 'heading') {
      const level = Math.min(6, Math.max(1, block.level || 2));
      return `<h${level}>${renderInline(block.children)}</h${level}>`;
    }
    if (block.type === 'list') {
      const tag = block.format === 'ordered' ? 'ol' : 'ul';
      const items = (block.children || []).map(item =>
        `<li>${renderInline(item.children)}</li>`
      ).join('');
      return `<${tag}>${items}</${tag}>`;
    }
    if (block.type === 'quote') {
      return `<blockquote>${renderInline(block.children)}</blockquote>`;
    }
    if (block.type === 'code') {
      const text = (block.children || []).map(n => n.text || '').join('');
      return `<pre><code>${escapeHTML(text)}</code></pre>`;
    }
    if (block.type === 'image' && block.image) {
      const src = block.image.url && block.image.url.startsWith('http')
        ? block.image.url
        : CONFIG.STRAPI_URL + (block.image.url || '');
      const alt = escapeHTML(block.image.alternativeText || '');
      return block.image.url ? `<figure><img src="${src}" alt="${alt}" loading="lazy"></figure>` : '';
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
    // Entete : Markdown string → HTML inline, gras → .gold
    if (attrs[f.Entete]) {
      const enteteEl = document.querySelector('[data-cms="hero.Entete"]');
      if (enteteEl) {
        let html;
        if (typeof marked !== 'undefined') {
          html = typeof marked.parseInline === 'function'
            ? marked.parseInline(attrs[f.Entete])
            : marked.parse(attrs[f.Entete]).replace(/^<p>|<\/p>\n?$/g, '');
        } else {
          html = attrs[f.Entete];
        }
        html = html.replace(/<strong>([\s\S]*?)<\/strong>/g, '<span class="gold">$1</span>');
        enteteEl.innerHTML = html;
      }
    }
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
  // Couverture : 1re image de Image[] (Multiple Media)
  const imageArr = Array.isArray(attrs[f.Image]) ? attrs[f.Image] : [];
  const firstImgUrl = mediaUrl(imageArr[0] || null);
  const thumbContent = firstImgUrl
    ? `<img src="${firstImgUrl}" alt="${titre}" loading="eager" style="width:100%;height:100%;object-fit:cover;">`
    : `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="180" fill="rgba(245,197,24,0.03)"/><text x="150" y="100" text-anchor="middle" fill="rgba(245,197,24,0.3)" font-size="14">${titre}</text></svg>`;
  // Logo rond (optionnel)
  const logoField = attrs[f.logo];
  const logoSrc = logoField
    ? (mediaUrl(logoField.formats?.thumbnail) || mediaUrl(logoField))
    : null;
  const logoHtml = logoSrc
    ? `<div class="project-logo"><img src="${logoSrc}" alt="${titre}" loading="lazy"></div>`
    : '';
  const hasLogoClass = logoSrc ? ' has-logo' : '';

  return `<div class="project-card fade-in visible${hasLogoClass}" style="transition-delay:${index * 0.1}s" tabindex="0" role="button" aria-label="Voir le projet ${titre}">
    <div class="project-thumb" style="background:linear-gradient(135deg,#0f1a2e,#1a2a4a);">${thumbContent}${logoHtml}</div>
    <div class="project-body">
      <div class="project-type">${type}</div>
      <div class="project-name">${titre}</div>
      <p class="project-desc">${desc}</p>
      <div class="project-footer">
        <div class="project-stack">${stackItems}</div>
        <div class="project-link">Voir →</d>
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

/* Mini-carrousel à fondu sur le thumb d'une carte projet.
   slides = [{ url, legende }] issu de buildImageSlides. */
function initCardCarousel(thumbEl, slides) {
  if (!thumbEl || !slides.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Empiler les images (opacity crossfade)
  thumbEl.style.position = 'relative';
  thumbEl.innerHTML = slides.map((s, i) =>
    `<img src="${s.url}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" ` +
    `style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;` +
    `opacity:${i === 0 ? 1 : 0};transition:opacity 0.7s ease;">`
  ).join('');

  if (slides.length <= 1 || prefersReduced) return;

  const imgs = thumbEl.querySelectorAll('img');
  let cur = 0;
  let timerId = null;

  function showNext() {
    imgs[cur].style.opacity = '0';
    cur = (cur + 1) % imgs.length;
    imgs[cur].style.opacity = '1';
  }

  function start() { if (!timerId) timerId = setInterval(showNext, 3000); }
  function pause() { clearInterval(timerId); timerId = null; }

  thumbEl.addEventListener('mouseenter', pause);
  thumbEl.addEventListener('mouseleave', start);
  start();

  // Nettoyage si la carte quitte le DOM
  const card = thumbEl.closest('.project-card');
  if (card && card.parentElement) {
    const obs = new MutationObserver(() => {
      if (!card.isConnected) { pause(); obs.disconnect(); }
    });
    obs.observe(card.parentElement, { childList: true });
  }
}

async function loadProjets() {
  try {
    const { data } = await fetchJSON(
      '/api/projets' +
      '?populate[Image]=true' +
      '&populate[stack]=true' +
      '&populate[badges]=true' +
      '&populate[liens]=true' +
      '&populate[logo]=true'
    );
    console.log('[CMS] projets reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const container = document.getElementById('projets-container');
    if (!container) return;
    const f = CONFIG.FIELDS.projet;

    container.innerHTML = '';
    data.forEach((proj, i) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildProjetCard(proj, i);
      const newCard = tmp.firstElementChild;
      container.appendChild(newCard);
      initCardCarousel(newCard.querySelector('.project-thumb'), buildImageSlides(proj));
      attachCardModal(newCard, proj);
    });

    // Bande « Ils m'ont fait confiance » : reconstruire depuis les projets (×3 pour le marquee)
    const track = document.querySelector('#temoignages .partners-track');
    if (track) {
      const items = data.map(proj => {
        const lf = proj[f.logo];
        const src = lf ? (mediaUrl(lf.formats?.thumbnail) || mediaUrl(lf)) : null;
        const titre = (proj[f.Titre] || '').trim();
        const imgHtml = src ? `<img src="${src}" alt="" loading="lazy">` : '';
        const hasLogo = src ? ' has-logo' : '';
        return `<div class="partner-logo${hasLogo}">${imgHtml}${titre}</div>`;
      });
      track.innerHTML = [...items, ...items, ...items].join('');
    }
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

    container.innerHTML = '';
    data.forEach((poste, i) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildPosteCard(poste, i);
      container.appendChild(tmp.firstElementChild);
    });
  } catch (e) {
    console.error('[CMS] postes:', e.message);
  }
}

/* ── Fetch & hydratation : Services ──────────────────────── */

function buildServiceCard(s, index) {
  const f = CONFIG.FIELDS.service;
  const titre = s[f.Titre] || '';
  const desc = s[f.Description];
  const descHtml = Array.isArray(desc) ? blocksToHTML(desc) : (desc ? `<p>${desc}</p>` : '');
  const imgField = s[f.Image];
  const imgSrc = imgField
    ? (mediaUrl(imgField.formats?.small) || mediaUrl(imgField.formats?.thumbnail) || mediaUrl(imgField))
    : null;
  const iconHtml = imgSrc
    ? `<div class="service-icon"><img src="${imgSrc}" alt="${titre}" loading="lazy"></div>`
    : `<div class="service-icon"></div>`;
  const tags = Array.isArray(s[f.tags]) ? s[f.tags] : [];
  const tagsHtml = tags.length
    ? `<div class="service-tags">${tags.map(t => {
        const label = t.nom || t.Nom || t.label || t.Label || t.Name || t.name || t.titre || t.Titre || '';
        return label ? `<span class="tag">${label}</span>` : '';
      }).filter(Boolean).join('')}</div>`
    : '';

  return `<div class="service-card fade-in visible" style="transition-delay:${index * 0.1}s">
    ${iconHtml}
    <div class="service-name">${titre}</div>
    <div class="service-desc">${descHtml}</div>
    ${tagsHtml}
    <a href="#contact" class="apply-btn">Demander ce service</a>
  </div>`;
}

async function loadServices() {
  try {
    const { data } = await fetchJSON('/api/services?populate=*&sort=Ordre:asc');
    console.log('[CMS] services reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const grid = document.querySelector('.services-grid');
    if (!grid) return;
    grid.innerHTML = '';
    data.forEach((s, i) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildServiceCard(s, i);
      grid.appendChild(tmp.firstElementChild);
    });
  } catch (e) {
    console.error('[CMS] services:', e.message);
  }
}

/* ── Fetch & hydratation : Outils ────────────────────────── */

async function loadOutils() {
  try {
    const { data } = await fetchJSON('/api/outils?populate=*&sort=Ordre:asc');
    console.log('[CMS] outils reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const f = CONFIG.FIELDS.outil;
    const skillBars = document.querySelector('.skill-bars');
    const toolsGrid = document.querySelector('.tools-grid');

    if (skillBars) {
      skillBars.innerHTML = '';
      data.filter(o => o[f.Vedette] === true).forEach(o => {
        const nom = o[f.Nom] || '';
        const pct = Math.min(100, Math.max(0, o[f.Pourcentage] || 0));
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.innerHTML = `<div class="skill-meta"><span>${nom}</span></div>
          <div class="skill-bar"><div class="skill-fill" style="width:${pct}%"></div></div>`;
        skillBars.appendChild(row);
      });
    }

    if (toolsGrid) {
      toolsGrid.innerHTML = '';
      data.forEach(o => {
        const nom = o[f.Nom] || '';
        const imgField = o[f.Image];
        const imgSrc = imgField
          ? (mediaUrl(imgField.formats?.thumbnail) || mediaUrl(imgField))
          : null;
        const iconHtml = imgSrc
          ? `<img src="${imgSrc}" alt="${nom}" loading="lazy">`
          : '';
        const item = document.createElement('div');
        item.className = 'tool-item';
        item.innerHTML = `<div class="tool-icon">${iconHtml}</div><div class="tool-name">${nom}</div>`;
        toolsGrid.appendChild(item);
      });
    }
  } catch (e) {
    console.error('[CMS] outils:', e.message);
  }
}

/* ── Fetch & hydratation : Page blog (en-tête) ───────────── */

async function loadPageBlog() {
  try {
    const { data } = await fetchJSON('/api/page-blog');
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
    if (attrs[f.sous_titre]) hydrate('pageBlog.sous_titre', attrs[f.sous_titre]);
  } catch (e) {
    // 404 attendu tant que le single type n'est pas publié — fallback HTML conservé
    console.error('[CMS] page-blog:', e.message);
  }
}

/* ── Fetch & hydratation : Articles de blog ──────────────── */

function formatDateFR(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function articleTags(article) {
  const rel = article[CONFIG.FIELDS.blogArticle.blog_tags];
  return (Array.isArray(rel) ? rel : [])
    .map(t => (t && t.nom) || '')
    .filter(Boolean);
}

function buildBlogArticleCard(article, index, { featured = false } = {}) {
  const f = CONFIG.FIELDS.blogArticle;
  const titre = escapeHTML(article[f.Titre] || '');
  const resume = escapeHTML(article[f.description_courte] || '');
  const slug = encodeURIComponent(article[f.slug] || '');
  const date = formatDateFR(article[f.date_publication]);
  const tags = articleTags(article);
  const imgUrl = mediaUrl(article[f.image_couverture]?.formats?.medium)
    || mediaUrl(article[f.image_couverture]);
  const href = `article.html?slug=${slug}`;

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
        <a class="read-link" href="${href}">Lire →</a>
      </div>
    </div>
  </div>`;
}

function attachArticleNavigation(card) {
  const href = card.getAttribute('data-href');
  if (!href) return;
  card.addEventListener('click', e => {
    if (e.target.closest('a')) return; // le lien "Lire →" gère déjà sa navigation
    window.location.href = href;
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.location.href = href;
  });
  card.style.cursor = 'pointer';
}

/* Puces de filtre par tag — filtrage client, pas de re-fetch */
function buildTagChips(articles) {
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

async function loadArticles() {
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
      attachArticleNavigation(card);
    });

    // Rangée secondaire : le reste
    if (row2) {
      row2.innerHTML = '';
      rest.slice(1).forEach((article, i) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildBlogArticleCard(article, i + 2);
        const card = tmp.firstElementChild;
        row2.appendChild(card);
        attachArticleNavigation(card);
      });
      row2.style.display = rest.length > 1 ? '' : 'none';
    }

    buildTagChips(sorted);
    // Le carrousel mobile (caroussel.js) se réinitialise sur resize
    window.dispatchEvent(new Event('resize'));
  } catch (e) {
    console.error('[CMS] blog-articles:', e.message);
  }
}

/* ── Fetch & hydratation : Flux social ───────────────────── */

const SOCIAL_PLATFORMS = {
  LinkedIn:  { cls: 'linkedin',  icon: 'fa-brands fa-linkedin-in', label: 'LinkedIn',    btn: 'Voir sur LinkedIn ↗' },
  Instagram: { cls: 'instagram', icon: 'fa-brands fa-instagram',   label: 'Instagram',   btn: 'Voir sur Instagram ↗' },
  Twitter:   { cls: 'twitter',   icon: 'fa-brands fa-x-twitter',   label: 'Twitter / X', btn: 'Voir sur X ↗' },
};

function buildSocialCard(post) {
  const f = CONFIG.FIELDS.socialPost;
  const platform = SOCIAL_PLATFORMS[post[f.plateforme]] || SOCIAL_PLATFORMS.LinkedIn;
  const contenu = escapeHTML(post[f.contenu] || '');
  const hashtags = escapeHTML(post[f.hashtags] || '');
  const dateTexte = escapeHTML(post[f.date_texte] || '');
  const lien = post[f.lien_externe] || '';

  // biginteger Strapi → string ; n'afficher une stat que si renseignée
  const stat = (icon, val) => (val != null && val !== '' && val !== '0')
    ? `<span class="social-stat"><i class="${icon}"></i> ${escapeHTML(String(val))}</span>` : '';
  const stats =
    stat('fa-solid fa-heart', post[f.likes]) +
    stat('fa-solid fa-comment', post[f.Commantaire]) +
    stat('fa-solid fa-retweet', post[f.Repost]);

  const viewBtn = lien
    ? `<a class="social-view-btn" href="${escapeHTML(lien)}" target="_blank" rel="noopener">${platform.btn}</a>`
    : '';

  return `<div class="social-card ${platform.cls}">
    <div class="social-card-header">
      <div class="social-platform">
        <div class="platform-icon"><i class="${platform.icon}"></i></div>
        <span style="color:rgba(238,240,248,0.7)">${platform.label}</span>
      </div>
      <span class="social-date">${dateTexte}</span>
    </div>
    <p class="social-content">${contenu}</p>
    ${hashtags ? `<div class="social-hashtags">${hashtags}</div>` : ''}
    <div class="social-card-footer">
      <div class="social-stats">${stats}</div>
      ${viewBtn}
    </div>
  </div>`;
}

async function loadSocialPosts() {
  try {
    const { data } = await fetchJSON('/api/social-posts');
    console.log('[CMS] social-posts reçus:', data?.length ?? 0);
    if (!data?.length) return; // collection vide → fallback HTML intact
    const wall = document.getElementById('section-social');
    if (!wall) return;

    wall.innerHTML = '';
    data.forEach(post => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildSocialCard(post);
      wall.appendChild(tmp.firstElementChild);
    });
    window.dispatchEvent(new Event('resize'));
  } catch (e) {
    console.error('[CMS] social-posts:', e.message);
  }
}

/* ── Page détail article (article.html?slug=) ────────────── */

async function loadArticleDetail() {
  const container = document.getElementById('article-detail');
  if (!container) return;
  const notFound = () => {
    const el = document.getElementById('article-notfound');
    if (el) el.hidden = false;
    container.hidden = true;
  };
  try {
    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { notFound(); return; }
    const { data } = await fetchJSON(
      `/api/blog-articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`);
    const article = data?.[0];
    if (!article) { notFound(); return; }
    const f = CONFIG.FIELDS.blogArticle;

    const titre = article[f.Titre] || '';
    document.title = `${titre} — Ripoll Darcia`;

    const titreEl = document.getElementById('article-titre');
    if (titreEl) titreEl.textContent = titre;

    const dateEl = document.getElementById('article-date');
    if (dateEl) dateEl.textContent = formatDateFR(article[f.date_publication]);

    const tagsEl = document.getElementById('article-tags');
    if (tagsEl) {
      tagsEl.innerHTML = articleTags(article)
        .map(t => `<span class="article-tag">${escapeHTML(t)}</span>`).join('');
    }

    const coverEl = document.getElementById('article-cover');
    const coverUrl = mediaUrl(article[f.image_couverture]?.formats?.large)
      || mediaUrl(article[f.image_couverture]);
    if (coverEl && coverUrl) {
      coverEl.innerHTML = `<img src="${coverUrl}" alt="${escapeHTML(titre)}">`;
      coverEl.hidden = false;
    }

    const bodyEl = document.getElementById('article-contenu');
    if (bodyEl) bodyEl.innerHTML = blocksToHTML(article[f.contenu]);

    container.hidden = false;
  } catch (e) {
    console.error('[CMS] article détail:', e.message);
    notFound();
  }
}

/* ── Modal projet ─────────────────────────────────────────── */

let _modalTrigger = null;
let _modalKeyHandler = null;
let _sliderCleanup = null;

/* Construit les slides depuis Image (Multiple Media, Strapi v5). */
function buildImageSlides(proj) {
  const images = Array.isArray(proj[CONFIG.FIELDS.projet.Image]) ? proj[CONFIG.FIELDS.projet.Image] : [];
  return images
    .map(img => ({ url: mediaUrl(img) }))
    .filter(s => s.url);
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

  captionEl.hidden = true;

  track.innerHTML = slides.map((s, idx) => {
    const loading = idx === 0 ? 'eager' : 'lazy';
    return `<div class="slider-slide"><img src="${s.url}" alt="" loading="${loading}"></div>`;
  }).join('');

  dotsEl.innerHTML = slides.map((_, idx) =>
    `<button class="slider-dot${idx === 0 ? ' active' : ''}" aria-label="Image ${idx + 1}"></button>`
  ).join('');

  const dots = dotsEl.querySelectorAll('.slider-dot');

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    // Pas de légende dans le schéma — captionEl masqué en permanence
  }

  goTo(0);

  // Auto-play 4s — stop définitif sur interaction manuelle
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoId = null;
  let autoKilled = false;

  function startAuto() {
    if (autoKilled || prefersReduced || slides.length <= 1) return;
    clearInterval(autoId);
    autoId = setInterval(() => goTo(current + 1), 4000);
  }
  function pauseAuto() { clearInterval(autoId); autoId = null; }
  function killAuto() {
    autoKilled = true;
    pauseAuto();
    sliderEl.removeEventListener('mouseleave', startAuto);
  }

  startAuto();
  const onMouseEnter = () => pauseAuto();
  const onMouseLeave = () => startAuto();
  sliderEl.addEventListener('mouseenter', onMouseEnter);
  sliderEl.addEventListener('mouseleave', onMouseLeave);

  // Navigation manuelle → arrêt définitif de l'auto-play
  const onPrev = () => { killAuto(); goTo(current - 1); };
  const onNext = () => { killAuto(); goTo(current + 1); };
  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  dots.forEach((d, i) => d.addEventListener('click', () => { killAuto(); goTo(i); }));

  // Swipe tactile → arrêt définitif de l'auto-play
  let touchX = 0;
  const onTouchStart = e => { touchX = e.touches[0].clientX; };
  const onTouchEnd = e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { killAuto(); dx < 0 ? goTo(current + 1) : goTo(current - 1); }
  };
  track.addEventListener('touchstart', onTouchStart, { passive: true });
  track.addEventListener('touchend', onTouchEnd, { passive: true });

  _sliderCleanup = () => {
    pauseAuto();
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    sliderEl.removeEventListener('mouseenter', onMouseEnter);
    sliderEl.removeEventListener('mouseleave', onMouseLeave);
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

  // Titre
  const titre = proj[f.Titre] || '';
  modal.querySelector('#modal-titre').textContent = titre;

  // Catégorie
  const categorie = proj[f.Categorie] || proj[f.Type] || '';
  modal.querySelector('#modal-categorie').textContent = categorie;

  // Description : descriptionLongue (Markdown) → fallback descriptionCourte (texte plat)
  const descEl = modal.querySelector('#modal-desc');
  const descLongue = (proj[f.descriptionLongue] || '').trim();
  const descCourte = (proj[f.descriptionCourte] || '').trim();
  if (descLongue) {
    if (typeof marked !== 'undefined' && marked.parse) {
      const html = marked.parse(descLongue, { breaks: true, gfm: true });
      // Forcer target="_blank" rel="noopener" sur tous les liens générés
      descEl.innerHTML = html.replace(/<a\s/gi, '<a target="_blank" rel="noopener" ');
    } else {
      descEl.innerHTML = `<p>${descLongue}</p>`;
    }
    descEl.hidden = false;
  } else if (descCourte) {
    descEl.innerHTML = `<p>${descCourte}</p>`;
    descEl.hidden = false;
  } else {
    descEl.innerHTML = '';
    descEl.hidden = true;
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
  // Schéma : liens.Label (majuscule) et liens.URL (majuscule)
  const liensValides = liensArr.filter(l => l && (l.URL || l.url) && (l.Label || l.label));
  if (!liensValides.length && proj[f.Lien]) {
    liensValides.push({ Label: 'Voir le projet', URL: proj[f.Lien] });
  }
  const extIcon =
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">` +
    `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>` +
    `<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>` +
    `</svg>`;
  if (liensValides.length) {
    liensEl.innerHTML = liensValides
      .map(l => {
        const href = l.URL || l.url;
        const label = l.Label || l.label;
        return `<a href="${href}" class="modal-lien-btn" target="_blank" rel="noopener">${extIcon}${label}</a>`;
      })
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

/* ── Fetch & hydratation : Témoignages ───────────────────── */

function buildTemoignageCard(t, index) {
  const f = CONFIG.FIELDS.temoignage;
  const citation = t[f.Citation] || '';
  const auteur = t[f.Auteur] || '';
  const fonction = t[f.Fonction] || '';
  const entreprise = t[f.Entreprise] || '';
  const note = Math.min(5, Math.max(1, t[f.Note] || 5));
  const stars = '★'.repeat(note);
  const role = fonction && entreprise
    ? `${fonction}, ${entreprise}`
    : fonction || entreprise;
  const photoField = t[f.Photo];
  const photoUrl = photoField
    ? mediaUrl(photoField.formats?.thumbnail || photoField)
    : null;
  const avatarContent = photoUrl
    ? `<img src="${photoUrl}" alt="${auteur}" loading="lazy">`
    : (auteur.charAt(0).toUpperCase() || '?');
  const delay = index * 0.1;

  return `<div class="testimonial-card fade-in visible" style="transition-delay:${delay}s">
    <div class="testi-stars">${stars}</div>
    <p class="testi-quote">${citation}</p>
    <div class="testi-author">
      <div class="testi-avatar">${avatarContent}</div>
      <div>
        <div class="testi-name">${auteur}</div>
        <div class="testi-role">${role}</div>
      </div>
    </div>
  </div>`;
}

async function loadTemoignages() {
  try {
    const { data } = await fetchJSON('/api/temoignages?populate=*');
    console.log('[CMS] témoignages reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const grid = document.querySelector('#temoignages .testimonial-grid');
    if (!grid) return;

    // Vider les placeholders uniquement si des données sont disponibles
    grid.innerHTML = '';
    data.forEach((t, i) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildTemoignageCard(t, i);
      grid.appendChild(tmp.firstElementChild);
    });
  } catch (e) {
    console.error('[CMS] temoignages:', e.message);
  }
}

/* ── Fetch & hydratation : Partenaires ───────────────────── */

function buildPartenaireCard(partenaire, index) {
  const f = CONFIG.FIELDS.partenaire;
  const attrs = partenaire;
  const nom = attrs[f.NomDuDomaine] || '';
  const desc = attrs[f.Description] || '';
  const imgField = attrs[f.Image];
  const imgSrc = imgField
    ? (mediaUrl(imgField.formats?.thumbnail) || mediaUrl(imgField))
    : null;
  const iconHtml = imgSrc
    ? `<div class="service-icon has-image"><img src="${imgSrc}" alt="${nom}" loading="lazy"></div>`
    : `<div class="service-icon">🤝</div>`;

  return `<div class="service-card partenaires-card fade-in visible" style="transition-delay:${index * 0.1}s" data-cms-partner="${index}">
    ${iconHtml}
    <div class="service-name">${nom}</div>
    <p class="service-desc">${desc}</p>
    <a href="#contact" class="apply-btn partenaires-cta">Demander une mise en relation</a>
  </div>`;
}

async function loadPartenaires() {
  try {
    const { data } = await fetchJSON('/api/partenaires?populate=*');
    console.log('[CMS] partenaires reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const container = document.getElementById('partenaires-container');
    if (!container) return;

    container.innerHTML = '';
    data.forEach((partenaire, i) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildPartenaireCard(partenaire, i);
      container.appendChild(tmp.firstElementChild);
    });
  } catch (e) {
    console.error('[CMS] partenaires:', e.message);
  }
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
  const path = window.location.pathname;
  const isBlog = path.includes('blog');
  const isArticle = path.includes('article.html');
  const isIndex = !isBlog && !isArticle;

  if (isIndex) {
    initModalListeners();
    loadHero();
    loadApropo();
    loadProjets();
    loadPostes();
    loadServices();
    loadOutils();
    loadPartenaires();
    loadTemoignages();
  }
  if (isBlog) {
    loadPageBlog();
    loadArticles();
    loadSocialPosts();
  }
  if (isArticle) {
    loadArticleDetail();
  }
});
