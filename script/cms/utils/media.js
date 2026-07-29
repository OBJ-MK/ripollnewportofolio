/* utils/media.js
 * Role: Media and date helpers: mediaUrl, formatDateFR, articleTags, buildImageSlides
 */

import { CONFIG } from '../config/config.js';
import { escapeHTML } from './format.js';

export function mediaUrl(field) {
  if (!field) return null;
  const url = field.url || null;
  if (!url) return null;
  return url.startsWith('http') ? url : CONFIG.STRAPI_URL + url;
}

export function formatDateFR(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function articleTags(article) {
  const rel = article[CONFIG.FIELDS.blogArticle.blog_tags];
  return (Array.isArray(rel) ? rel : [])
    .map(t => (t && t.nom) || '')
    .filter(Boolean);
}

// buildImageSlides used by projets and modal — defined once here
export function buildImageSlides(proj) {
  const images = Array.isArray(proj[CONFIG.FIELDS.projet.Image]) ? proj[CONFIG.FIELDS.projet.Image] : [];
  return images
    .map(img => ({ url: mediaUrl(img) }))
    .filter(s => s.url);
}
