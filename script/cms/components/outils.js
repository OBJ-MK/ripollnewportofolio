/* components/outils.js
 * Role: fetch & rendu de la section Outils — cartes outils (grille) et
 * barres de compétences ("skill bars"). Ajout : apparition en cascade au
 * scroll (IntersectionObserver, déclenché une fois) + remplissage animé
 * des barres, en plus de la logique de récupération des données déjà en
 * place.
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { mediaUrl } from '../utils/media.js';

export async function loadOutils() {
  try {
    const { data } = await fetchJSON('/api/outils?populate[Image]=true&sort=Ordre:asc');
    if (!data?.length) return;
    const f = CONFIG.FIELDS.outil;
    const skillBars = document.querySelector('.skill-bars');
    const toolsGrid = document.querySelector('.tools-grid');

    // ── Barres de compétences : démarrent à 0%, remplies au scroll ──
    if (skillBars) {
      skillBars.innerHTML = '';
      data.filter(o => o[f.Vedette] === true).forEach(o => {
        const nom = o[f.Nom] || '';
        const pct = Math.min(100, Math.max(0, o[f.Pourcentage] || 0));
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.innerHTML = `<div class="skill-meta"><span>${nom}</span></div>
          <div class="skill-bar"><div class="skill-fill" style="width:0%" data-target-width="${pct}"></div></div>`;
        skillBars.appendChild(row);
      });
    }

    // ── Grille d'outils : chaque carte démarre invisible, avec un délai
    //    progressif prêt à jouer dès que la grille entre dans l'écran ──
    if (toolsGrid) {
      toolsGrid.innerHTML = '';
      data.forEach((o, i) => {
        const nom = o[f.Nom] || '';
        const imgField = o[f.Image];
        const imgSrc = imgField
          ? (mediaUrl(imgField.formats?.thumbnail) || mediaUrl(imgField))
          : null;
        const iconHtml = imgSrc
          ? `<img src="${imgSrc}" alt="${nom}" loading="lazy">`
          : '';
        const item = document.createElement('div');
        item.className = 'tool-item fade-in';
        item.style.transitionDelay = `${Math.min(i, 12) * 0.045}s`; // plafonné pour ne pas trop retarder les dernières cartes
        item.innerHTML = `<div class="tool-icon">${iconHtml}</div><div class="tool-name">${nom}</div>`;
        toolsGrid.appendChild(item);
      });
    }

    initOutilsScrollReveal();
  } catch (e) {
    console.error('[CMS] outils:', e.message);
  } finally { hideSkeleton('skeleton-outils') }
}

/* Un seul IntersectionObserver, qui se déclenche une fois puis se
 * déconnecte immédiatement — aucun coût après le premier passage à
 * l'écran, contrairement à un listener de scroll classique.
 *
 * Important : on attend que la page soit ENTIÈREMENT chargée (window.load)
 * avant de commencer à observer. Sans ça, l'observer évalue l'intersection
 * dès sa création — souvent quelques centaines de ms après le début du
 * chargement, avant que les images/polices aient fini de charger et que
 * la hauteur réelle de la page soit stabilisée. Ce décalage peut faire
 * croire à tort que la section est "déjà visible" alors que l'utilisateur
 * n'a pas encore scrollé, jouant l'animation hors champ et la neutralisant
 * pour de bon (l'observer se déconnecte après son premier déclenchement). */
function initOutilsScrollReveal() {
  const section = document.getElementById('outils');
  if (!section) return;
  if (section.dataset.revealBound) return; // évite les observers en double si loadOutils() est rappelée
  section.dataset.revealBound = 'true';

  const revealAll = () => {
    section.querySelectorAll('.tool-item.fade-in').forEach(el => el.classList.add('visible'));
    section.querySelectorAll('.skill-fill[data-target-width]').forEach(el => {
      el.style.width = `${el.dataset.targetWidth}%`;
    });
  };

  const startObserving = () => {
    if (!('IntersectionObserver' in window)) {
      revealAll(); // navigateur ancien : on affiche directement, pas de blocage
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealAll();
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });

    observer.observe(section);
  };

  if (document.readyState === 'complete') {
    // La page est déjà entièrement chargée (cas où loadOutils() répond
    // après coup, tard) : pas besoin d'attendre, la mise en page est stable.
    startObserving();
  } else {
    window.addEventListener('load', () => {
      // Petite marge supplémentaire pour laisser la mise en page se stabiliser
      // (polices, dernières images) après l'événement load lui-même.
      setTimeout(startObserving, 50);
    });
  }
}