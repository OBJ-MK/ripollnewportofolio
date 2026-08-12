/* utils/media.js
 * Role: Media and date helpers: mediaUrl, formatDateFR, articleTags, buildImageSlides
 */

import { CONFIG } from '../config/config.js';
import { escapeHTML } from './format.js';

// Insère une transformation Cloudinary (redimension + compression + format auto)
// dans une URL, sans jamais toucher au fichier original stocké.
function applyCloudinaryTransform(url, width) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  // Évite de doubler une transformation déjà présente (ex: un format
  // thumbnail/small déjà généré par Strapi contient parfois ses propres params)
  const afterUpload = url.split('/upload/')[1] || '';
  const alreadyTransformed = /^[a-z]+_[^/]+\//.test(afterUpload);
  if (alreadyTransformed) return url;

  const transform = width ? `w_${width},q_auto,f_auto` : 'q_auto,f_auto';
  return url.replace('/upload/', `/upload/${transform}/`);
}

export function mediaUrl(field, { width } = {}) {
  if (!field) return null;
  const url = field.url || null;
  if (!url) return null;
  const absolute = url.startsWith('http') ? url : CONFIG.STRAPI_URL + url;
  return applyCloudinaryTransform(absolute, width);
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

export function buildImageSlides(proj) {
  const images = Array.isArray(proj[CONFIG.FIELDS.projet.Image]) ? proj[CONFIG.FIELDS.projet.Image] : [];
  return images
    .map(img => ({ url: mediaUrl(img, { width: 1000 }) })) // slider modal = plus grand
    .filter(s => s.url);
}