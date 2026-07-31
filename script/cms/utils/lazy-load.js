/* utils/lazy-load.js
 * Role: chargement paresseux générique via IntersectionObserver.
 * Réutilisé par projets, services, blog (row2) et social-posts.
 */

/**
 * Observe une sentinelle : appelle onIntersect() dès qu'elle entre dans le
 * viewport. onIntersect doit retourner (ou résoudre en) true s'il reste du
 * contenu à charger, false pour arrêter et retirer la sentinelle.
 */
export function watchSentinel(sentinelEl, onIntersect) {
  if (!sentinelEl) return null;

  const observer = new IntersectionObserver(async (entries) => {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(sentinelEl); // évite les déclenchements multiples pendant le chargement
    const hasMore = await onIntersect();
    if (hasMore) {
      observer.observe(sentinelEl); // réarme pour le prochain lot
    } else {
      observer.disconnect();
      sentinelEl.remove();
    }
  }, { rootMargin: '200px' }); // anticipe de 200px avant l'entrée réelle dans le viewport

  observer.observe(sentinelEl);
  return observer;
}

/** Crée (ou repositionne en dernier) l'élément sentinelle d'un container. */
export function ensureSentinel(container, className = 'lazy-sentinel') {
  let sentinel = container.querySelector(`:scope > .${className}`);
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.className = className;
    sentinel.style.cssText = 'width:1px;height:1px;';
    container.appendChild(sentinel);
  } else {
    container.appendChild(sentinel);
  }
  return sentinel;
}