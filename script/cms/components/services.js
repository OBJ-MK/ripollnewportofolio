/* components/services.js
 * Role: buildServiceCard and loadServices
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { blocksToHTML } from '../utils/format.js';
import { mediaUrl } from '../utils/media.js';
import { hideSkeleton } from '../utils/dom-helpers.js';

export function buildServiceCard(s, index) {
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

export async function loadServices() {
  try {
    const { data } = await fetchJSON('/api/services?populate[Image]=true&sort=Ordre:asc');
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
  } finally { hideSkeleton('skeleton-services') }
}
