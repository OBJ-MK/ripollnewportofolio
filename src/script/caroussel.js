// ─── CAROUSELS MOBILE ───
function isMobile() {
  return window.innerWidth <= 480;
}

// Sélecteurs des grilles à transformer en carousel
const CAROUSEL_SELECTORS = [
  '.services-grid',
  '.projects-grid',
  '.postes-grid',
  '.testimonial-grid',
];

function getCards(grid) {
  return Array.from(grid.children);
}

function createDots(grid, cards) {
  // Évite de créer des dots en double
  const existing = grid.parentElement.querySelector('.carousel-dots');
  if (existing) existing.remove();

  const dotsEl = document.createElement('div');
  dotsEl.className = 'carousel-dots';

  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Carte ${i + 1}`);
    dot.addEventListener('click', () => {
      scrollToCard(grid, cards, i);
    });
    dotsEl.appendChild(dot);
  });

  grid.parentElement.insertBefore(dotsEl, grid.nextSibling);
  return dotsEl;
}

function scrollToCard(grid, cards, index) {
  const card = cards[index];
  const gridLeft = grid.getBoundingClientRect().left;
  const cardLeft = card.getBoundingClientRect().left;
  const offset = grid.scrollLeft + (cardLeft - gridLeft) - (grid.clientWidth - card.offsetWidth) / 2;
  grid.scrollTo({ left: offset, behavior: 'smooth' });
}

function updateActiveDot(grid, cards, dotsEl) {
  const gridCenter = grid.scrollLeft + grid.clientWidth / 2;
  let closest = 0;
  let minDist = Infinity;

  cards.forEach((card, i) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - gridCenter);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  });

  dotsEl.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === closest);
  });
}

function initCarousels() {
  if (!isMobile()) return;

  CAROUSEL_SELECTORS.forEach(selector => {
    const grid = document.querySelector(selector);
    if (!grid) return;

    const cards = getCards(grid);
    if (cards.length < 2) return;

    const dotsEl = createDots(grid, cards);

    // Scroll → update dots
    let scrollTimer;
    grid.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        updateActiveDot(grid, cards, dotsEl);
      }, 60);
    }, { passive: true });
  });
}

// Init au chargement + au resize
initCarousels();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Nettoyer les dots existants avant de réinitialiser
    document.querySelectorAll('.carousel-dots').forEach(d => d.remove());
    initCarousels();
  }, 200);
});