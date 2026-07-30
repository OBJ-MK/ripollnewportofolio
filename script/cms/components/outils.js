/* components/outils.js
 * Role: loadOutils — fills skill-bars and tools-grid
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { mediaUrl } from '../utils/media.js';
import { hideSkeleton } from '../utils/dom-helpers.js';

export async function loadOutils() {
  try {
    const { data } = await fetchJSON('/api/outils?populate[Image]=true&sort=Ordre:asc');
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
  } finally { hideSkeleton('skeleton-outils') }
}
