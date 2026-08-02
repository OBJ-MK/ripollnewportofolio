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
import { loadArticles, loadArticleDetailSPA, loadPageBlog } from '../components/blog.js';
import { loadSocialPosts } from '../components/social.js';

// Liste centralisée de toutes les vues du site — évite d'oublier une vue
// à masquer à chaque nouvel ajout (mentions légales, politique...).
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

export function navigateToSection(sectionId, event) {
  if (event) event.preventDefault();

  const views = getAllViews();
  hideAllViews(views);

  if (views.index) {
    const wasHidden = views.index.hidden;
    views.index.hidden = false;

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
    history.pushState({ route: 'blog' }, '', '#blog');
  }
  else if (route === 'article') {
    if (views.article) {
      views.article.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'article', slug: params.slug }, '', `#article?slug=${params.slug}`);
    if (params.slug) loadArticleDetailSPA(params.slug);
  }
  else if (route === 'mentions-legales') {
    if (views.mentionsLegales) {
      views.mentionsLegales.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'mentions-legales' }, '', '#mentions-legales');
  }
  else if (route === 'politique-confidentialite') {
    if (views.politiqueConfidentialite) {
      views.politiqueConfidentialite.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    history.pushState({ route: 'politique-confidentialite' }, '', '#politique-confidentialite');
  }
  else {
    if (views.index) {
      views.index.hidden = false;
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