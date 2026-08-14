// script/cms/components/like.js
import { apiUrl } from '../config/config.js';

function setLikedIcon(btn, liked) {
  const icon = btn.querySelector('i');
  if (!icon) return;
  icon.classList.toggle('fa-regular', !liked);
  icon.classList.toggle('fa-solid', liked);
}

export function initLikeButton(originalBtn, articleId, currentLikes) {
  const btn = originalBtn.cloneNode(true);
  originalBtn.replaceWith(btn);

  const likedKey = `cms:liked:${articleId}`;
  const alreadyLiked = !!localStorage.getItem(likedKey);

  btn.disabled = alreadyLiked;
  btn.classList.toggle('liked', alreadyLiked);
  setLikedIcon(btn, alreadyLiked);
  btn.querySelector('.like-count').textContent = currentLikes;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    if (localStorage.getItem(likedKey)) return;

    const countEl = btn.querySelector('.like-count');
    const previousCount = parseInt(countEl.textContent, 10) || 0;

    // --- Mise à jour optimiste : on affiche le résultat attendu
    // immédiatement, sans attendre la réponse du serveur.
    btn.disabled = true;
    btn.classList.add('is-liking');
    btn.classList.add('liked');
    setLikedIcon(btn, true);
    countEl.textContent = previousCount + 1;

    try {
      const res = await fetch(apiUrl(`/api/blog-articles/${articleId}/like`), {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // On remplace la valeur optimiste par la vraie valeur du serveur
      // (au cas où d'autres visiteurs auraient liké entre-temps).
      countEl.textContent = data.likes;
      localStorage.setItem(likedKey, '1');
    } catch (err) {
      console.error('Erreur like:', err);
      // Rollback : on annule l'incrément visuel et l'état "liked"
      countEl.textContent = previousCount;
      btn.classList.remove('liked');
      setLikedIcon(btn, false);
      btn.disabled = false;
    } finally {
      btn.classList.remove('is-liking');
    }
  });
}