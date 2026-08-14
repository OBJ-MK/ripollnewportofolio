// script/cms/components/like.js
import { apiUrl } from '../config/config.js';

function setLikedIcon(btn, liked) {
  const icon = btn.querySelector('i');
  if (!icon) return;
  icon.classList.toggle('fa-regular', !liked);
  icon.classList.toggle('fa-solid', liked);
}

export function initLikeButton(originalBtn, articleId, currentLikes) {
  // Clone le bouton pour repartir sans aucun ancien écouteur "click"
  const btn = originalBtn.cloneNode(true);
  originalBtn.replaceWith(btn);

  const likedKey = `cms:liked:${articleId}`;
  const alreadyLiked = !!localStorage.getItem(likedKey);

  // Réinitialisation explicite de l'état pour CET article précis.
  // Important : cloneNode(true) recopie aussi l'attribut "disabled",
  // donc sans ce reset, un like sur l'article A laissait le bouton
  // désactivé pour tous les articles suivants (B, C, ...).
  btn.disabled = alreadyLiked;
  btn.classList.toggle('liked', alreadyLiked);
  setLikedIcon(btn, alreadyLiked);
  btn.querySelector('.like-count').textContent = currentLikes;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    if (localStorage.getItem(likedKey)) return;

    btn.disabled = true;

    try {
      const res = await fetch(apiUrl(`/api/blog-articles/${articleId}/like`), {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      btn.querySelector('.like-count').textContent = data.likes;
      btn.classList.add('liked');
      setLikedIcon(btn, true);
      localStorage.setItem(likedKey, '1');
    } catch (err) {
      console.error('Erreur like:', err);
      btn.disabled = false;
    }
  });
}