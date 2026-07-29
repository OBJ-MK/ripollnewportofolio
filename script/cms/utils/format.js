/* utils/format.js
 * Role: Text and rich-text helpers: escapeHTML, renderInline, blocksToHTML, buildPointsForts
 */

import { CONFIG } from '../config/config.js';

export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderInline(nodes) {
  return (nodes || []).map(n => {
    if (n.type === 'link') {
      const inner = renderInline(n.children);
      return `<a href="${escapeHTML(n.url || '#')}" target="_blank" rel="noopener">${inner}</a>`;
    }
    let t = escapeHTML(n.text || '');
    if (n.code) t = `<code>${t}</code>`;
    if (n.bold) t = `<strong>${t}</strong>`;
    if (n.italic) t = `<em>${t}</em>`;
    if (n.underline) t = `<u>${t}</u>`;
    if (n.strikethrough) t = `<s>${t}</s>`;
    return t;
  }).join('');
}

export function blocksToHTML(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      const text = renderInline(block.children);
      return text.trim() ? `<p>${text}</p>` : '';
    }
    if (block.type === 'heading') {
      const level = Math.min(6, Math.max(1, block.level || 2));
      return `<h${level}>${renderInline(block.children)}</h${level}>`;
    }
    if (block.type === 'list') {
      const tag = block.format === 'ordered' ? 'ol' : 'ul';
      const items = (block.children || []).map(item =>
        `<li>${renderInline(item.children)}</li>`
      ).join('');
      return `<${tag}>${items}</${tag}>`;
    }
    if (block.type === 'quote') {
      return `<blockquote>${renderInline(block.children)}</blockquote>`;
    }
    if (block.type === 'code') {
      const text = (block.children || []).map(n => n.text || '').join('');
      return `<pre><code>${escapeHTML(text)}</code></pre>`;
    }
    if (block.type === 'image' && block.image) {
      const src = block.image.url && block.image.url.startsWith('http')
        ? block.image.url
        : CONFIG.STRAPI_URL + (block.image.url || '');
      const alt = escapeHTML(block.image.alternativeText || '');
      return block.image.url ? `<figure><img src="${src}" alt="${alt}" loading="lazy"></figure>` : '';
    }
    return '';
  }).join('');
}

export function buildPointsForts(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter(b => b.type === 'list')
    .flatMap(b => b.children || [])
    .filter(item => item.type === 'list-item')
    .map(item => {
      const text = (item.children || []).map(n => n.text || '').join('');
      return text ? `<div class="value-item"><span class="value-check">✦</span>${text}</div>` : '';
    })
    .filter(Boolean)
    .join('');
}
