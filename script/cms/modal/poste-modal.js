/* modal/poste-modal.js
 * Role: modal détail d'un poste (lecture seule — le téléchargement du CV
 * se fait désormais via cv-modal.js, déclenché par le bouton "Postuler")
 */

import { CONFIG } from '../config/config.js';
import { getFocusables } from '../utils/dom-helpers.js';

let _modalTrigger = null;
let _modalKeyHandler = null;

export function openPosteModal(poste) {
  const f = CONFIG.FIELDS.poste;
  const modal = document.getElementById('poste-modal');
  if (!modal) return;

  const titre = poste[f.Titre] || '';
  const entreprise = poste[f.Entreprise] || '';
  const localisation = poste[f.Localisation] || '';
  const temps = poste[f.Temps] || '';
  const salaire = poste[f.Salaire] || '';
  const statut = poste[f.Statut] || 'Disponible';
  const desc = poste[f.Description] || '';

  modal.querySelector('#poste-modal-titre').textContent = titre;
  modal.querySelector('#poste-modal-entreprise').textContent = entreprise;

  const statutEl = modal.querySelector('#poste-modal-statut');
  statutEl.textContent = statut;
  statutEl.className = 'poste-badge ' + (statut === 'Disponible' ? 'badge-open' : 'badge-closed');

  const metaEl = modal.querySelector('#poste-modal-meta');
  const metaItems = [
    localisation && `📍 ${localisation}`,
    temps && `⏱ ${temps}`,
    salaire && `💶 ${salaire}`,
  ].filter(Boolean);
  metaEl.innerHTML = metaItems.map(m => `<span class="modal-badge">${m}</span>`).join('');

  modal.querySelector('#poste-modal-desc').innerHTML = desc ? `<p>${desc}</p>` : '';

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  _modalTrigger = document.activeElement;
  modal.querySelector('.modal-close').focus();

  _modalKeyHandler = e => {
    if (e.key === 'Escape') { closePosteModal(); return; }
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

export function closePosteModal() {
  const modal = document.getElementById('poste-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (_modalKeyHandler) { document.removeEventListener('keydown', _modalKeyHandler); _modalKeyHandler = null; }
  if (_modalTrigger) { _modalTrigger.focus(); _modalTrigger = null; }
}

export function initPosteModalListeners() {
  const modal = document.getElementById('poste-modal');
  if (!modal) return;
  modal.querySelector('.modal-overlay').addEventListener('click', closePosteModal);
  modal.querySelector('.modal-close').addEventListener('click', closePosteModal);
}