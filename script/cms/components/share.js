// script/cms/components/share.js

import { STRAPI_URL } from '../../config.js'; // adapte le chemin réel

const SHARE_URLS = {
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  twitter: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  whatsapp: (url, title) => `https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`,
};

export function initShareButtons(container, { title, url }) {
  const shareUrl = url || window.location.href;

  container.querySelectorAll('[data-share]').forEach(btn => {
    const network = btn.dataset.share;

    if (network === 'copy') {
      btn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(shareUrl);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 2000);
      });
      return;
    }

    const buildUrl = SHARE_URLS[network];
    if (!buildUrl) return;

    btn.addEventListener('click', () => {
      window.open(buildUrl(shareUrl, title), '_blank', 'width=600,height=400,noopener,noreferrer');
    });
  });
}