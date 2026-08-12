/* components/social.js
 * Role: social feed rendering and loader
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { escapeHTML } from '../utils/format.js';
import { hideSkeleton } from '../utils/dom-helpers.js';
import { watchSentinel, ensureSentinel } from '../utils/lazy-load.js';
import { getCached, setCached } from '../utils/cache.js';

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
        <span style="color:rgba(61, 62, 62, 0.7)">${platform.label}</span>
      </div>
      <span class="social-date">${dateTexte}</span>
    </div>
    <p class="social-content">${contenu}</p>
    <div class="social-card-footer">
      ${viewBtn}
    </div>
  </div>`;
}

const SOCIAL_PAGE_SIZE = 6;

export async function loadSocialPosts() {
  const wall = document.getElementById('section-social');
  if (!wall) return;
  wall.innerHTML = '';

  let page = 1;

  async function renderNextPage() {
    try {
      const cacheKey = `cms:social:page:${page}`;
      let result = getCached(cacheKey);

      if (!result) {
        result = await fetchJSON(
          `/api/social-posts?pagination[page]=${page}&pagination[pageSize]=${SOCIAL_PAGE_SIZE}`
        );
        setCached(cacheKey, result);
      }

      const { data, meta } = result;
      console.log('[CMS] social-posts reçus (page', page, '):', data?.length ?? 0);
      if (page === 1 && !data?.length) return false;

      const sentinel = wall.querySelector('.lazy-sentinel');
      data.forEach(post => {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildSocialCard(post);
        wall.insertBefore(tmp.firstElementChild, sentinel);
      });
      window.dispatchEvent(new Event('resize'));

      const hasMore = meta?.pagination && page < meta.pagination.pageCount;
      page += 1;
      return hasMore;
    } catch (e) {
      console.error('[CMS] social-posts:', e.message);
      return false;
    }
  }

  const hasMore = await renderNextPage();
  if (hasMore) watchSentinel(ensureSentinel(wall), renderNextPage);
  hideSkeleton('skeleton-view-blog');
}