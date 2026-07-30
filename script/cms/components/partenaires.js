/* components/partenaires.js
 * Role: partenaires listing
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { mediaUrl } from '../utils/media.js';
import { hideSkeleton } from '../utils/dom-helpers.js';

export function buildPartenaireCard(partenaire, index) {
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

export async function loadPartenaires() {
  try {
    const { data } = await fetchJSON('/api/partenaires?populate=*');
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
  } finally { hideSkeleton('skeleton-partenaires') }
}
