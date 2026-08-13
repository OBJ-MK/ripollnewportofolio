/* components/outils.js
 * Role: fetch & rendu de la section Outils — cartes outils (grille) et
 * barres de compétences. La révélation au scroll passe maintenant par
 * l'utilitaire GSAP centralisé (utils/animations.js) — plus de logique
 * d'observer maison ni de dépendance à AOS.
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { mediaUrl } from '../utils/media.js';
import { revealGrid, refreshScrollTrigger } from '../utils/animations.js';

export async function loadOutils() {
  try {
    const { data } = await fetchJSON('/api/outils?populate[Image]=true&sort=Ordre:asc');
    if (!data?.length) return;
    const f = CONFIG.FIELDS.outil;
    const skillBars = document.querySelector('.skill-bars');
    const toolsGrid = document.querySelector('.tools-grid');

    // ── Barres de compétences ──
    // Élément unique/rare (2-3 barres) : une animation GSAP directe suffit,
    // pas besoin du système de grille en cascade ici.
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

      if (typeof gsap !== 'undefined') {
        skillBars.querySelectorAll('.skill-fill[data-target-width]').forEach((fill) => {
          gsap.to(fill, {
            width: `${fill.dataset.targetWidth}%`,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: typeof ScrollTrigger !== 'undefined'
              ? { trigger: fill, start: 'top 92%', once: true }
              : undefined,
          });
        });
      } else {
        // Repli si GSAP indisponible : on affiche directement la valeur finale
        skillBars.querySelectorAll('.skill-fill[data-target-width]').forEach((fill) => {
          fill.style.width = `${fill.dataset.targetWidth}%`;
        });
      }
    }

    // ── Grille d'outils ──
    if (toolsGrid) {
      toolsGrid.innerHTML = '';
      data.forEach((o) => {
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

      revealGrid('.tools-grid', ':scope > .tool-item');
      refreshScrollTrigger(); // contenu ajouté après coup : on force le recalcul des positions
    }
  } catch (e) {
    console.error('[CMS] outils:', e.message);
  } finally { hideSkeleton('skeleton-outils') }
}