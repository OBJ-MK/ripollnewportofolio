/* router/router.js
 * Role: SPA navigation helpers (navigateToSection, navigateTo) and popstate/initial-route handling
 * Routing propre (History API) : /blog, /blog/:slug, /mentions-legales, /politique-confidentialite, /
 */

import { loadHero } from '../components/hero.js';
import { loadApropo } from '../components/apropo.js';
import { loadProjets } from '../components/projets.js';
import { loadPostes } from '../components/postes.js';
import { loadServices } from '../components/services.js';
import { loadOutils } from '../components/outils.js';
import { loadPartenaires } from '../components/partenaires.js';
import { loadTemoignages } from '../components/temoignages.js';
import { loadArticles, loadArticleDetailSPA, loadPageBlog } from '../components/blog.js';
import { loadSocialPosts } from '../components/social.js';
import { loadFooterServices, loadFooterApropo } from '../components/loadFooter.js';

function getAllViews() {
  return {
    index: document.getElementById('view-index'),
    blog: document.getElementById('view-blog'),
    article: document.getElementById('view-article'),
    mentionsLegales: document.getElementById('view-mentions-legales'),
    politiqueConfidentialite: document.getElementById('view-politique-confidentialite'),
  };
}

function hideAllViews(views) {
  Object.values(views).forEach(view => { if (view) view.hidden = true; });
}

// APRÈS
function loadIndexData() {
  const heroReady = loadHero();
  loadApropo();
  loadProjets();
  loadPostes();
  const servicesReady = loadServices();
  loadOutils();
  loadPartenaires();
  loadTemoignages();

  // Seuls hero + services conditionnent la position du contenu ciblé par une
  // ancre (#services est juste après le hero). On attend uniquement ceux-là
  // avant d'autoriser un scroll vers une ancre — pas la peine de bloquer sur
  // les postes, outils, partenaires, témoignages qui ne changent rien à
  // cette position.
  return Promise.allSettled([heroReady, servicesReady]);
}

export function navigateToSection(sectionId, event) {
  if (event) event.preventDefault();

  const views = getAllViews();
  hideAllViews(views);

  if (views.index) {
    const wasHidden = views.index.hidden;
    views.index.hidden = false;
    if (wasHidden) loadIndexData();
  }

  // Toujours repartir de la racine "/" + ancre, même si on vient de /blog ou /blog/slug
  history.pushState({ route: 'index', section: sectionId }, '', `/#${sectionId}`);

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function navigateTo(route, params = {}) {
  const views = getAllViews();
  hideAllViews(views);

  if (route === 'blog') {
    if (views.blog) {
      views.blog.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    loadPageBlog();
    loadArticles();
    loadSocialPosts();
    loadFooterServices();
    loadFooterApropo();
    history.pushState({ route: 'blog' }, '', '/blog');
  }
  else if (route === 'article') {
    if (views.article) {
      views.article.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'article', slug: params.slug }, '', `/blog/${encodeURIComponent(params.slug)}`);
    if (params.slug) loadArticleDetailSPA(params.slug);
  }
  else if (route === 'mentions-legales') {
    if (views.mentionsLegales) {
      views.mentionsLegales.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'mentions-legales' }, '', '/mentions-legales');
  }
  else if (route === 'politique-confidentialite') {
    if (views.politiqueConfidentialite) {
      views.politiqueConfidentialite.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'politique-confidentialite' }, '', '/politique-confidentialite');
  }
  else {
    if (views.index) views.index.hidden = false;
    history.pushState({ route: 'index' }, '', '/');
  }
}

/* Détermine la vue à afficher au chargement initial (ou refresh direct)
 * en lisant window.location.pathname — remplace l'ancien parsing de hash dans main.js */
export function handleInitialRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const hash = window.location.hash;

  if (path === '/blog') {
    navigateTo('blog');
  }
  else if (path.startsWith('/blog/')) {
    const slug = decodeURIComponent(path.slice('/blog/'.length));
    if (slug) navigateTo('article', { slug });
    else navigateTo('blog');
  }
  else if (path === '/mentions-legales') {
    navigateTo('mentions-legales');
  }
  else if (path === '/politique-confidentialite') {
    navigateTo('politique-confidentialite');
  }
  else {
    const dataReady = loadIndexData();
    navigateTo('index');
    const targetId = hash ? hash.slice(1) : '';
    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) {
        dataReady.then(() => {
          // requestAnimationFrame : laisse le navigateur peindre les cartes
          // fraîchement injectées (et le pin GSAP qu'elles déclenchent) avant
          // de démarrer le scroll — sinon on scrolle vers une cible dont la
          // géométrie est encore en train de se stabiliser.
          requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth' });

            // Filet de sécurité : si malgré tout le pin (ou toute position
            // ScrollTrigger) a été mesuré avant la fin réelle du scroll natif,
            // on recalcule tout une fois le scroll effectivement stabilisé.
            const refreshAfterScroll = () => {
              if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            };
            if ('onscrollend' in window) {
              window.addEventListener('scrollend', refreshAfterScroll, { once: true });
            } else {
              setTimeout(refreshAfterScroll, 700); // fallback Safari/Firefox (pas de scrollend)
            }
          });
        });
      }
    }
  }
}

// Boutons Précédent / Suivant du navigateur
window.addEventListener('popstate', (e) => {
  const state = e.state;
  if (state && state.section) {
    navigateToSection(state.section);
  } else if (state) {
    navigateTo(state.route || 'index', state);
  } else {
    handleInitialRoute();
  }
});