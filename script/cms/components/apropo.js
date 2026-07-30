/* components/apropo.js
 * Role: fetch and hydrate the "À propos" section (loadApropo)
 */

import { fetchJSON, CONFIG } from '../config/config.js';
import { hydrate, hydrateHTML, hideSkeleton } from '../utils/dom-helpers.js';
import { buildPointsForts } from '../utils/format.js';
import { mediaUrl } from '../utils/media.js';

export async function loadApropo() {
  try {
    const { data } = await fetchJSON('/api/apropo?populate[Photo]=true');
    // Strapi v5 : champs plats directement sur data
    const attrs = data || {};
    const f = CONFIG.FIELDS.apropo;

    // Paragraphe1 / Paragraphe2 : richtext Strapi → string simple
    if (attrs[f.Paragraphe1]) hydrate('apropo.Paragraphe1', attrs[f.Paragraphe1]);
    if (attrs[f.Paragraphe2]) hydrate('apropo.Paragraphe2', attrs[f.Paragraphe2]);

    // points_forts : blocks Strapi v5 → <div class="value-item"> avec ✦
    const pointsHtml = buildPointsForts(attrs[f.points_forts]);
    if (pointsHtml) hydrateHTML('apropo.points_forts', pointsHtml);

    // Email : texte affiché + href mailto (jamais "null")
    if (attrs[f.Email]) {
      const emailLink = document.querySelector('[data-cms="apropo.Email"]');
      if (emailLink) {
        emailLink.textContent = attrs[f.Email];
        emailLink.href = `mailto:${attrs[f.Email]}`;
      }
    }

    // Réseaux sociaux : ne toucher au href que si la valeur n'est pas null
    if (attrs[f.LinkedIn]) {
      const el = document.querySelector('[data-cms="apropo.LinkedIn"]');
      if (el) el.href = attrs[f.LinkedIn];
    }
    if (attrs[f.Facebook]) {
      const el = document.querySelector('[data-cms="apropo.Facebook"]');
      if (el) el.href = attrs[f.Facebook];
    }
    if (attrs[f.Twitter]) {
      const el = document.querySelector('[data-cms="apropo.Twitter"]');
      if (el) el.href = attrs[f.Twitter];
    }
    if (attrs[f.Instagram]) {
      const el = document.querySelector('[data-cms="apropo.Instagram"]');
      if (el) el.href = attrs[f.Instagram];
    }

    // Photo : Strapi v5 media plat { url, ... }
    const photoUrl = mediaUrl(attrs[f.Photo]);
    if (photoUrl) {
      const avatar = document.querySelector('.avatar-placeholder');
      if (avatar) {
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = 'Photo de profil';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
        avatar.replaceWith(img);
      }
    }
  } catch (e) {
    console.error('[CMS] apropo:', e.message);
  } finally { hideSkeleton('skeleton-apropo') }
}
