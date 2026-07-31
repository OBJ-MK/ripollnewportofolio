/* modal/cv-modal.js
 * Role: modal "Postuler" — propose le téléchargement du CV statique
 * (fichier PDF unique uploadé par Ripoll dans Strapi, champ apropo.cv_pdf)
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { mediaUrl } from '../utils/media.js';

let _modalTrigger = null;

export async function openCvModal() {
  const modal = document.getElementById('cv-modal');
  if (!modal) return;

  const linkEl = modal.querySelector('#cv-modal-link');
  const statusEl = modal.querySelector('#cv-modal-status');
  linkEl.hidden = true;
  statusEl.textContent = 'Chargement du CV…';
  statusEl.hidden = false;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  _modalTrigger = document.activeElement;
  modal.querySelector('.modal-close').focus();

  try {
    const { data } = await fetchJSON('/api/apropo?populate=cv_pdf');
    const f = CONFIG.FIELDS.apropo;
    const url = mediaUrl(data?.[f.cv_pdf]);

    if (url) {
      linkEl.href = url;
      linkEl.hidden = false;
      statusEl.hidden = true;
    } else {
      statusEl.textContent = "Le CV n'est pas encore disponible pour le moment.";
    }
  } catch (e) {
    console.error('[cv-modal] erreur chargement CV:', e.message);
    statusEl.textContent = 'Impossible de charger le CV pour le moment, réessaie plus tard.';
  }
}

export function closeCvModal() {
  const modal = document.getElementById('cv-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (_modalTrigger) { _modalTrigger.focus(); _modalTrigger = null; }
}

export function initCvModalListeners() {
  const modal = document.getElementById('cv-modal');
  if (!modal) return;
  modal.querySelector('.modal-overlay').addEventListener('click', closeCvModal);
  modal.querySelector('.modal-close').addEventListener('click', closeCvModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeCvModal();
  });
}