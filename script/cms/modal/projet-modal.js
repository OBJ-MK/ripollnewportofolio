/* modal/projet-modal.js
 * Role: modal and slider for project detail. Exports openProjetModal, closeProjetModal and initModalListeners.
 */

import { CONFIG } from '../config/config.js';
import { getFocusables } from '../utils/dom-helpers.js';
import { buildImageSlides } from '../utils/media.js';

let _modalTrigger = null;
let _modalKeyHandler = null;
let _sliderCleanup = null;

export function initModalSlider(sliderEl, slides) {
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

export function openProjetModal(proj) {
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

export function closeProjetModal() {
  const modal = document.getElementById('projet-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (_modalKeyHandler) { document.removeEventListener('keydown', _modalKeyHandler); _modalKeyHandler = null; }
  if (_sliderCleanup) { _sliderCleanup(); _sliderCleanup = null; }
  if (_modalTrigger) { _modalTrigger.focus(); _modalTrigger = null; }
}

export function initModalListeners() {
  const modal = document.getElementById('projet-modal');
  if (!modal) return;
  modal.querySelector('.modal-overlay').addEventListener('click', closeProjetModal);
  modal.querySelector('.modal-close').addEventListener('click', closeProjetModal);
}
