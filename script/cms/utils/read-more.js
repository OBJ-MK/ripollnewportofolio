/* utils/read-more.js
 * Role: bouton "Voir plus / Voir moins" pour du texte tronqué en CSS
 * (line-clamp). N'affiche le bouton QUE si le texte est réellement
 * tronqué (scrollHeight > clientHeight) — un avis ou un service déjà
 * court n'a jamais de bouton inutile.
 *
 * Utilisé par temoignages.js (.testi-quote) et services.js (.service-desc)
 * pour éviter la redondance avec les modales de projets/postes : ici,
 * l'expansion se fait sur place, dans la carte, sans navigation.
 */

export function setupReadMore(containerSelector, textSelector, options = {}) {
  const { moreLabel = 'Voir plus', lessLabel = 'Voir moins' } = options;
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll(textSelector).forEach((textEl) => {
    // Idempotent : évite de dupliquer le bouton si la fonction est
    // rappelée (ex: nouveau batch de cartes chargé en lazy-load).
    if (textEl.dataset.readMoreReady) return;
    textEl.dataset.readMoreReady = '1';

    // On attend le layout (images d'icône, polices...) pour savoir si le
    // clamp CSS tronque vraiment le texte, avant de décider d'afficher
    // le bouton ou non.
    requestAnimationFrame(() => {
      const isTruncated = textEl.scrollHeight > textEl.clientHeight + 1;
      if (!isTruncated) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'read-more-toggle';
      btn.textContent = moreLabel;
      btn.setAttribute('aria-expanded', 'false');
      btn.style.display = 'inline-block';

      btn.addEventListener('click', () => {
        const expanded = textEl.classList.toggle('is-expanded');
        btn.textContent = expanded ? lessLabel : moreLabel;
        btn.setAttribute('aria-expanded', String(expanded));
      });

      textEl.insertAdjacentElement('afterend', btn);
    });
  });
}