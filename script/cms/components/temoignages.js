/* components/temoignages.js
 * Role: testimonials (temoignages)
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { mediaUrl } from '../utils/media.js';
import { hideSkeleton } from '../utils/dom-helpers.js';

export function buildTemoignageCard(t, index) {
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

export async function loadTemoignages() {
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
  } finally { hideSkeleton('skeleton-temoignages') }
}
