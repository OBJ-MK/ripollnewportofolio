/* components/social.js
 * Role: social feed rendering and loader
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { escapeHTML } from '../utils/format.js';
import { hideSkeleton } from '../utils/dom-helpers.js';

export const SOCIAL_PLATFORMS = {
  LinkedIn: { cls: 'linkedin', icon: 'fa-brands fa-linkedin-in', label: 'LinkedIn', btn: 'Voir sur LinkedIn ↗' },
  Instagram: { cls: 'instagram', icon: 'fa-brands fa-instagram', label: 'Instagram', btn: 'Voir sur Instagram ↗' },
  Facebook: { cls: 'facebook', icon: 'fa-brands fa-facebook-f', label: 'Facebook', btn: 'Voir sur Facebook ↗' },
  Twitter: { cls: 'twitter', icon: 'fa-brands fa-x-twitter', label: 'Twitter / X', btn: 'Voir sur X ↗' },
};

export function buildSocialCard(post) {
  const f = CONFIG.FIELDS.socialPost;
  const platform = SOCIAL_PLATFORMS[post[f.plateforme]] || SOCIAL_PLATFORMS.LinkedIn;
  const contenu = escapeHTML(post[f.contenu] || '');
  const dateTexte = escapeHTML(post[f.date_texte] || '');
  const lien = post[f.lien_externe] || '';

  
  const viewBtn = lien
    ? `<a class="social-view-btn" href="${escapeHTML(lien)}" target="_blank" rel="noopener">${platform.btn}</a>`
    : '';

  return `<div class="social-card ${platform.cls}">
    <div class="social-card-header">
      <div class="social-platform">
        <div class="platform-icon"><i class="${platform.icon}"></i></div>
        <span style="color:rgba(238,240,248,0.7)">${platform.label}</span>
      </div>
      <span class="social-date">${dateTexte}</span>
    </div>
    <p class="social-content">${contenu}</p>
    <div class="social-card-footer">
      <div class="social-stats">${stats}</div>
      ${viewBtn}
    </div>
  </div>`;
}

export async function loadSocialPosts() {
  try {
    const { data } = await fetchJSON('/api/social-posts');
    console.log('[CMS] social-posts reçus:', data?.length ?? 0);
    if (!data?.length) return; // collection vide → fallback HTML intact
    const wall = document.getElementById('section-social');
    if (!wall) return;

    wall.innerHTML = '';
    data.forEach(post => {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildSocialCard(post);
      wall.appendChild(tmp.firstElementChild);
    });
    window.dispatchEvent(new Event('resize'));
  } catch (e) {
    console.error('[CMS] social-posts:', e.message);
  }finally { hideSkeleton('skeleton-view-blog') }
}
