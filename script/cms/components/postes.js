/* components/postes.js
 * Role: buildPosteCard and loadPostes
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';

export function buildPosteCard(poste, index) {
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

export async function loadPostes() {
  try {
    const { data } = await fetchJSON('/api/postes');
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
  } finally { hideSkeleton('skeleton-postes') }
}
