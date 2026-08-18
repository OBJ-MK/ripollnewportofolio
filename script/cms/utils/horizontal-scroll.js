/* utils/horizontal-scroll.js
 * Role: section "Services" en scroll horizontal pinné (façon GSAP+Lenis
 * "horizontal smooth scroll") — la section reste fixe à l'écran pendant
 * que les cartes défilent horizontalement au scroll vertical.
 *
 * Choix de conception, volontairement prudents pour NE PAS CASSER l'existant :
 *  - Enrichissement progressif : le DOM et le CSS d'origine (.services-grid
 *    en grille verticale) restent 100% intacts dans le fichier. Le mode
 *    horizontal n'est appliqué qu'au runtime, via JS, uniquement en desktop.
 *  - Mobile/tablette (<1024px) : on ne touche RIEN, la grille verticale
 *    classique s'affiche normalement, aucun risque pour ces breakpoints.
 *  - prefers-reduced-motion : désactivé, grille verticale normale.
 *  - Idempotent : peut être rappelé plusieurs fois (ex: après un nouveau
 *    batch de cartes chargé) sans dupliquer les wrappers ni les ScrollTrigger.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DESKTOP_MQ = window.matchMedia('(min-width: 1024px)');

let currentST = null;
let resizeTimer = null;
let boundResizeHandler = null;

function teardown(grid) {
  if (currentST) {
    currentST.kill();
    currentST = null;
  }
  if (!grid) return;
  if (typeof gsap !== 'undefined') {
    gsap.set(grid, { clearProps: 'transform' });
  }
  grid.classList.remove('services-hscroll-track');
  const pinWrap = grid.parentElement;
  if (pinWrap && pinWrap.classList.contains('services-hscroll-pin')) {
    pinWrap.parentNode.insertBefore(grid, pinWrap);
    pinWrap.remove();
  }
}

function refreshOnImagesLoaded(grid) {
  const imgs = Array.from(grid.querySelectorAll('img')).filter((img) => !img.complete);
  if (!imgs.length) return;
  let remaining = imgs.length;
  const onDone = () => {
    remaining -= 1;
    if (remaining <= 0 && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  };
  imgs.forEach((img) => {
    img.addEventListener('load', onDone, { once: true });
    img.addEventListener('error', onDone, { once: true });
  });
}

export function initServicesHorizontalScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (REDUCED_MOTION) return;

  const section = document.getElementById('services');
  const grid = section?.querySelector('.services-grid');
  if (!section || !grid) return;

  function setup() {
    teardown(grid);

    if (!DESKTOP_MQ.matches) return; // mobile/tablette : on n'active jamais le pin
    if (!grid.children.length) return; // pas encore de cartes chargées

    const pinWrap = document.createElement('div');
    pinWrap.className = 'services-hscroll-pin';
    grid.parentNode.insertBefore(pinWrap, grid);
    pinWrap.appendChild(grid);
    grid.classList.add('services-hscroll-track');

    // Distance à parcourir = largeur totale du contenu - largeur visible.
    // Recalculé à chaque setup() (resize, nouvelles cartes chargées...).
    const distance = grid.scrollWidth - pinWrap.clientWidth;
    if (distance <= 0) {
      // Pas assez de cartes pour justifier un scroll horizontal (ex: sur un
      // écran très large avec peu de services) → on retombe sur la grille
      // normale plutôt que de pin sans rien à faire défiler.
      teardown(grid);
      return;
    }

    currentST = ScrollTrigger.create({
      trigger: pinWrap,
      start: 'top top+=80',
      end: () => `+=${distance}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      animation: gsap.to(grid, { x: -distance, ease: 'none' }),
    });

    // Les images en loading="lazy" peuvent finir de charger après ce calcul
    // de distance → scrollWidth change sans que le pin soit recalculé. On
    // rafraîchit ScrollTrigger dès qu'elles ont fini.
    refreshOnImagesLoaded(grid);
  }

  setup();

  // Un seul listener resize, jamais dupliqué même si la fonction est
  // rappelée plusieurs fois (ex: nouveau batch de cartes chargé).
  if (!boundResizeHandler) {
    boundResizeHandler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setup, 200);
    };
    window.addEventListener('resize', boundResizeHandler);
  }
}