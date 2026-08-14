import { STRAPI_URL } from '../../config.js'; // adapte le chemin réel

// script/cms/components/like.js
export function initLikeButton(btn, articleId, currentLikes) {
  const likedKey = `cms:liked:${articleId}`;
  const alreadyLiked = localStorage.getItem(likedKey);

  btn.querySelector('.like-count').textContent = currentLikes;
  if (alreadyLiked) btn.classList.add('liked');

  btn.addEventListener('click', async () => {
    if (localStorage.getItem(likedKey)) return; // déjà liké

    try {
      const res = await fetch(`${STRAPI_URL}/api/blog-articles/${articleId}/like`, {
        method: 'POST'
      });
      const data = await res.json();
      btn.querySelector('.like-count').textContent = data.likes;
      btn.classList.add('liked');
      localStorage.setItem(likedKey, '1');
    } catch (err) {
      console.error('Erreur like:', err);
    }
  });
}