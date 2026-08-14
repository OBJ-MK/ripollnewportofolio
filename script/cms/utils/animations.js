/* utils/animations.js
 * Role: utilitaire centralisé pour toutes les animations GSAP du site.
 * Un seul endroit pour régler la vitesse, désactiver, ou déboguer —
 * plutôt que de la logique dupliquée dans chaque composant.
 *
 * Garde-fous performance :
 *  - Uniquement transform/opacity (jamais width/top/height) → accéléré GPU,
 *    aucun recalcul de mise en page pendant l'animation.
 *  - ScrollTrigger.batch() pour les grilles : UN SEUL écouteur de scroll
 *    pour toute une grille de cartes, pas un par carte.
 *  - Respecte prefers-reduced-motion : anime instantanément (durée ~0) si
 *    l'utilisateur a demandé de réduire les animations.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let _initialized = false;

/** À appeler une seule fois au démarrage, après que le script GSAP CDN soit chargé. */
export function initGSAP() {
  if (_initialized) return;
  if (typeof gsap === 'undefined') {
    console.error('[animations] GSAP non chargé — vérifie les balises <script> dans index.html');
    return;
  }
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
  _initialized = true;
}

/* ── Entrée du Hero : cascade badge → titre → texte → boutons → stats ──
 * Important : le comptage des stats (animateCounters) est déclenché en
 * même temps que le fondu d'apparition des stats, avec le texte déjà
 * remis à "0" avant que le fondu ne commence (resetCountersToZero). Sans
 * ce reset préalable, le fondu révélait d'abord la valeur finale statique
 * ("+6 ans"), et ce n'est qu'ensuite que le compteur repartait de 0 pour
 * recompter → effet de "flash puis reset" bien visible. La page blog n'a
 * pas ce souci car ses stats n'ont aucune animation d'entrée concurrente. */
export function playHeroEntrance() {
  if (typeof gsap === 'undefined') return;
  const hero = document.getElementById('hero');
  if (!hero) return;

  const targets = {
    badge: hero.querySelector('.hero-badge'),
    title: hero.querySelector('.hero-title'),
    desc: hero.querySelector('.hero-desc'),
    btns: hero.querySelector('.hero-btns'),
    stats: hero.querySelector('.hero-stats'),
    card: hero.querySelector('.hero-card'),
  };

  if (REDUCED_MOTION) {
    // Affichage direct, sans animation — respecte la préférence utilisateur
    Object.values(targets).forEach(el => el && gsap.set(el, { opacity: 1, x: 0, y: 0 }));
    if (targets.stats) animateCounters('.hero-stats');
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (targets.badge) tl.from(targets.badge, { opacity: 0, y: 16, duration: 0.65 });
  if (targets.title) tl.from(targets.title, { opacity: 0, y: 24, duration: 0.75 }, '-=0.25');
  if (targets.desc) tl.from(targets.desc, { opacity: 0, y: 18, duration: 0.65 }, '-=0.35');
  if (targets.btns) tl.from(targets.btns.children, { opacity: 1, y: 14, duration: 0.65, stagger: 0.08 }, '-=0.3');
  if (targets.stats) {
    // On force le texte à "0" AVANT que le fondu ne commence : sans ça,
    // le fondu révèle d'abord la valeur finale statique ("+6 ans"), et
    // ce n'est qu'après que le compteur réinitialise à 0 pour recompter
    // → effet de "flash puis reset" bien visible. En partant de 0 dès le
    // départ (invisible tant que opacity:0), le chiffre compte pendant
    // qu'il apparaît, jamais avant.
    resetCountersToZero('.hero-stats');
    tl.from(targets.stats.children, { opacity: 0, y: 14, duration: 0.65, stagger: 0.08 }, '-=0.3');
    // '<' = démarre en même temps que le tween précédent (le fondu des
    // stats), pas après : le comptage se joue PENDANT l'apparition.
    tl.call(() => animateCounters('.hero-stats'), null, '<');
  }
  if (targets.card) tl.from(targets.card, { opacity: 0, x: 30, duration: 0.85 }, '-=0.6');
}

/* Extrait {prefix, targetValue, suffix, decimals} d'un texte comme "+6 ans",
 * "10+", "98%"... Partagé entre resetCountersToZero et animateCounters pour
 * ne jamais désynchroniser leur façon de lire le texte. */
function parseCounterRaw(raw) {
  const match = raw.match(/^([+-]?)(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const prefix = match[1] || '';
  const numStr = match[2];
  return {
    prefix,
    targetValue: parseFloat(numStr.replace(',', '.')),
    suffix: raw.slice(match[0].length),
    decimals: numStr.includes(',') || numStr.includes('.') ? 1 : 0,
  };
}

/* ── Met les compteurs à "0" immédiatement (texte, pas d'animation) ──
 * À appeler AVANT toute animation d'apparition (fondu, etc.) qui rendrait
 * l'élément visible. La valeur finale d'origine est conservée dans
 * data-counter-raw pour qu'animateCounters() sache jusqu'où compter. */
export function resetCountersToZero(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const nums = container.querySelectorAll('.stat-num, .blog-stat-num');
  nums.forEach((el) => {
    if (el.dataset.counterRaw) return; // déjà préparé, on ne double pas
    const raw = el.textContent.trim();
    const parsed = parseCounterRaw(raw);
    if (!parsed) return;
    el.dataset.counterRaw = raw;
    el.textContent = parsed.prefix + '0' + parsed.suffix;
  });
}

/* ── Compteurs animés : "20+", "5 ans", "100%" → montent depuis 0 ──
 * Lit data-counter-raw si resetCountersToZero() est passé par là avant
 * (le texte affiché est alors déjà "0", pas la valeur finale), sinon lit
 * directement le texte affiché (cas de la page blog, sans fondu concurrent). */
export function animateCounters(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const nums = container.querySelectorAll('.stat-num, .blog-stat-num');
  if (!nums.length) return;

  nums.forEach((el) => {
    const raw = el.dataset.counterRaw || el.textContent.trim();
    const parsed = parseCounterRaw(raw);
    if (!parsed) return; // pas de nombre en tête (ex: texte libre) → on laisse tel quel
    const { prefix, suffix, decimals, targetValue } = parsed;

    if (REDUCED_MOTION || typeof gsap === 'undefined') {
      el.textContent = raw;
      delete el.dataset.counterRaw;
      return;
    }

    const proxy = { val: 0 };
    gsap.to(proxy, {
      val: targetValue,
      duration: 1.55,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = prefix + proxy.val.toFixed(decimals) + suffix;
      },
      onComplete: () => {
        el.textContent = raw; // valeur exacte garantie à la fin, pas d'arrondi résiduel
        delete el.dataset.counterRaw;
      },
    });
  });
}

/* ── Révélation en cascade d'une grille de cartes au scroll ──
 * Utilise ScrollTrigger.batch : un seul écouteur de scroll pour toute la
 * grille, peu importe le nombre de cartes — pas un trigger par élément. */
export function revealGrid(containerSelector, itemSelector = ':scope > *') {
  if (typeof gsap === 'undefined') return;
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const items = container.querySelectorAll(itemSelector);
  if (!items.length) return;

  if (REDUCED_MOTION || typeof ScrollTrigger === 'undefined') {
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }

  gsap.set(items, { opacity: 0, y: 24 });

  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power2.out',
        stagger: 0.08,
      });
    },
  });
}

/* ── Révélation simple d'un en-tête de section (tag + titre + sous-titre) ── */
export function revealSectionHeader(selector) {
  if (typeof gsap === 'undefined') return;
  const el = document.querySelector(selector);
  if (!el) return;

  if (REDUCED_MOTION || typeof ScrollTrigger === 'undefined') {
    gsap.set(el, { opacity: 1, y: 0 });
    return;
  }

  gsap.set(el, { opacity: 0, y: 20 });
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.75,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
  });
}

/* Après tout ajout dynamique de contenu (fetch Strapi qui insère des
 * cartes après coup), les positions calculées par ScrollTrigger doivent
 * être recalculées — sans ça, les mêmes soucis de timing qu'on a eu avec
 * l'ancien observer maison peuvent réapparaître. */
export function refreshScrollTrigger() {
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}

/* ── Fondu d'entrée simple pour une vue qui vient d'être révélée
 * (détail article, changement de page SPA...) — pas de ScrollTrigger,
 * se joue immédiatement au moment de l'appel. */
export function fadeInView(el) {
  if (!el) return;
  if (typeof gsap === 'undefined' || REDUCED_MOTION) return;
  gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' });
}