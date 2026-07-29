/* router/router.js
 * Role: SPA navigation helpers (navigateToSection, navigateTo) and popstate handling
 */

import { loadHero } from '../components/hero.js';
import { loadApropo } from '../components/apropo.js';
import { loadProjets } from '../components/projets.js';
import { loadPostes } from '../components/postes.js';
import { loadServices } from '../components/services.js';
import { loadOutils } from '../components/outils.js';
import { loadPartenaires } from '../components/partenaires.js';
import { loadTemoignages } from '../components/temoignages.js';
import { loadArticles, loadArticleDetailSPA } from '../components/blog.js';
import { loadSocialPosts } from '../components/social.js';

export function navigateToSection(sectionId, event) {
  if (event) event.preventDefault();

  // 1. S'assurer qu'on affiche bien la vue Index / Portfolio
  const indexView = document.getElementById('view-index');
  const blogView = document.getElementById('view-blog');
  const articleView = document.getElementById('view-article');

  if (blogView) blogView.hidden = true;
  if (articleView) articleView.hidden = true;

  if (indexView) {
    const wasHidden = indexView.hidden;
    indexView.hidden = false;

    // Si l'index était caché, charger les données Strapi si nécessaire
    if (wasHidden) {
      loadHero();
      loadApropo();
      loadProjets();
      loadPostes();
      loadServices();
      loadOutils();
      loadPartenaires();
      loadTemoignages();
    }
  }

  // 2. Mettre à jour l'URL avec l'ancre
  history.pushState({ route: 'index', section: sectionId }, '', `#${sectionId}`);

  // 3. Défiler jusqu'à la section de manière fluide
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function navigateTo(route, params = {}) {
  const indexView = document.getElementById('view-index');
  const blogView = document.getElementById('view-blog');
  const articleView = document.getElementById('view-article');

  // 1. Masquer systématiquement toutes les vues
  if (indexView) indexView.hidden = true;
  if (blogView) blogView.hidden = true;
  if (articleView) articleView.hidden = true;

  // 2. Afficher la vue demandée et charger ses données
  if (route === 'blog') {
    if (blogView) {
      blogView.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // load blog resources
    loadArticles();
    loadSocialPosts();
    history.pushState({ route: 'blog' }, '', '#blog');
  } 
  else if (route === 'article') {
    if (articleView) {
      articleView.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'article', slug: params.slug }, '', `#article?slug=${params.slug}`);
    if (params.slug) loadArticleDetailSPA(params.slug);
  } 
  else {
    if (indexView) {
      indexView.hidden = false;
    }
    history.pushState({ route: 'index' }, '', '#portfolio');
  }
}

// Intercepter les boutons Retour / Suivant du navigateur
window.addEventListener('popstate', (e) => {
  const state = e.state || {};
  if (state.section) {
    navigateToSection(state.section);
  } else {
    navigateTo(state.route || 'index', state);
  }
});
