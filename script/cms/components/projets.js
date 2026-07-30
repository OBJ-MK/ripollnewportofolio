/* components/projets.js
 * Role: project cards, mini thumbnails carousel, and loadProjets
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { mediaUrl, buildImageSlides } from '../utils/media.js';
import { openProjetModal, initModalSlider, closeProjetModal } from '../modal/projet-modal.js';

export function buildProjetCard(proj, index) {
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

export function attachCardModal(card, proj) {
  // delegate to modal's openProjetModal
  card.addEventListener('click', () => openProjetModal(proj));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProjetModal(proj); }
  });
}

export function initCardCarousel(thumbEl, slides) {
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

export async function loadProjets() {
  try {
    const { data } = await fetchJSON(
      '/api/projets' +
      '?populate[Image]=true' +
      '&populate[stack]=true' +
      '&populate[badges]=true' +
      '&populate[liens]=true' +
      '&populate[logo]=true'
    );
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
  } finally { hideSkeleton('skeleton-projets') }
}
