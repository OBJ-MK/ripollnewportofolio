/* components/services.js
 * Role: buildServiceCard and loadServices
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { blocksToHTML } from '../utils/format.js';
import { mediaUrl } from '../utils/media.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { watchSentinel, ensureSentinel } from '../utils/lazy-load.js';

export function buildServiceCard(s, index) {
  const f = CONFIG.FIELDS.service;
  const titre = s[f.Titre] || '';
  const desc = s[f.Description];
  const descHtml = Array.isArray(desc) ? blocksToHTML(desc) : (desc ? `<p>${desc}</p>` : '');
  const imgField = s[f.Image];
  const imgSrc = imgField
    ? (mediaUrl(imgField.formats?.small, { width: 100 }) || mediaUrl(imgField.formats?.thumbnail, { width: 100 }) || mediaUrl(imgField, { width: 100 }))
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

  const lien = titre.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return `<div id="${lien}" class="service-card fade-in visible" style="transition-delay:${index * 0.1}s">
    ${iconHtml}
    <div class="service-name">${titre}</div>
    <div class="service-desc">${descHtml}</div>
    ${tagsHtml}
    <span class="apply-btn">Demander ce service</span>
  </div>`;
}

const SERVICES_BATCH_SIZE = 6;

export async function loadServices() {
  try {
    const { data } = await fetchJSON('/api/services?populate=*&sort=Ordre:asc');
    console.log('[CMS] services reçus:', data?.length ?? 0);
    if (!data?.length) return;
    const grid = document.querySelector('.services-grid');
    const footerServicesList = document.getElementById('footer-services-list');
    footerServicesList.innerHTML = data.map(s => {
      const f = CONFIG.FIELDS.service;
      const titre = s[f.Titre] || '';
      const lien = titre.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return `<li><a href="${'#'}${lien || '#'}">${titre}</a></li>`;
    }).join('');
    if (!footerServicesList) return;

    if (!grid) return;

    grid.innerHTML = '';
    let cursor = 0;

    function renderNextBatch() {
      const slice = data.slice(cursor, cursor + SERVICES_BATCH_SIZE);
      const sentinel = grid.querySelector('.lazy-sentinel');
      slice.forEach((s, i) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildServiceCard(s, i);
        grid.insertBefore(tmp.firstElementChild, sentinel);
      });
      cursor += slice.length;
      return cursor < data.length;
    }



    const hasMore = renderNextBatch();
    if (hasMore) watchSentinel(ensureSentinel(grid), renderNextBatch);

  } catch (e) {
    console.error('[CMS] services:', e.message);
  } finally { hideSkeleton('skeleton-services') }
}
