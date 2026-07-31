/* components/postes.js
 * Role: buildPosteCard and loadPostes
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { openPosteModal } from '../modal/poste-modal.js';
import { openCvModal } from '../modal/cv-modal.js';

export function buildPosteCard(poste, index) {
  const f = CONFIG.FIELDS.poste;
  const attrs = poste;
  const titre = attrs[f.Titre] || '';
  const desc = attrs[f.Description] || '';
  const entreprise = attrs[f.Entreprise] || '';
  const localisation = attrs[f.Localisation] || '';
  const temps = attrs[f.Temps] || '';
  const salaire = attrs[f.Salaire] || '';
  const statut = attrs[f.Statut] || 'Disponible';
  const badgeClass = statut === 'Disponible' ? 'badge-open' : 'badge-closed';

  return `<div class="poste-card fade-in visible" style="transition-delay:${index * 0.1}s" tabindex="0" role="button" aria-label="Voir le détail du poste ${titre}">
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
      <button class="apply-btn" data-no-modal>Postuler</button>
    </div>
  </div>`;
}

function attachPosteModal(card, poste) {
  card.style.cursor = 'pointer';

  const applyBtn = card.querySelector('.apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCvModal();
    });
  }

  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-no-modal]')) return;
    openPosteModal(poste);
  });
  card.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('[data-no-modal]')) {
      e.preventDefault();
      openPosteModal(poste);
    }
  });
}


export async function loadPostes() {
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
      const card = tmp.firstElementChild;
      container.appendChild(card);
      attachPosteModal(card, poste);
    });
  } catch (e) {
    console.error('[CMS] postes:', e.message);
  } finally { hideSkeleton('skeleton-postes') }
}