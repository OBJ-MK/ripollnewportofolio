/* components/hero.js
 * Role: fetch and hydrate the hero section (loadHero)
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hydrate, hideSkeleton } from '../utils/dom-helpers.js';
import { playHeroEntrance, animateCounters } from '../utils/animations.js';

export async function loadHero() {
  try {
    const { data } = await fetchJSON('/api/hero');
    // Strapi v5 : champs plats directement sur data (pas data.attributes)
    const attrs = data || {};
    const f = CONFIG.FIELDS.hero;
    // Entete : Markdown string → HTML inline, gras → .gold
    if (attrs[f.Entete]) {
      const enteteEl = document.querySelector('[data-cms="hero.Entete"]');
      if (enteteEl) {
        let html;
        if (typeof marked !== 'undefined') {
          html = typeof marked.parseInline === 'function'
            ? marked.parseInline(attrs[f.Entete])
            : marked.parse(attrs[f.Entete]).replace(/^<p>|<\/p>\n?$/g, '');
        } else {
          html = attrs[f.Entete];
        }
        html = html.replace(/<strong>([\s\S]*?)<\/strong>/g, '<span class="gold">$1</span>');
        enteteEl.innerHTML = html;
      }
    }
    if (attrs[f.sousTitre]) hydrate('hero.sousTitre', attrs[f.sousTitre]);
    if (attrs[f.badgeTexte]) hydrate('hero.badgeTexte', attrs[f.badgeTexte]);
    if (attrs[f.statProjets] != null) hydrate('hero.statProjets', attrs[f.statProjets] + '+');
    if (attrs[f.statExperience] != null) hydrate('hero.statExperience', attrs[f.statExperience] + ' ans');
    if (attrs[f.statSatisfaction] != null) hydrate('hero.statSatisfaction', String(attrs[f.statSatisfaction]) + '%');
    hideSkeleton('skeleton-hero');
    playHeroEntrance();
    animateCounters('.hero-stats');
  } catch (e) {
    console.error('[CMS] hero:', e.message);
  } finally {
    hideSkeleton('skeleton-hero');
  }
}