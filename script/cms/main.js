/* main.js — Entry point module for CMS hydration
 * Role: orchestrate imports and initialization. Exposes window.navigateTo and window.closeProjetModal.
 * This file should be referenced from HTML as: <script type="module" src="script/cms/main.js" defer></script>
 */

import { navigateTo, navigateToSection } from './router/router.js';
import { initModalListeners, closeProjetModal } from './modal/projet-modal.js';
import { loadHero } from './components/hero.js';
import { loadApropo } from './components/apropo.js';
import { loadProjets } from './components/projets.js';
import { loadPostes } from './components/postes.js';
import { loadServices } from './components/services.js';
import { loadOutils } from './components/outils.js';
import { loadPartenaires } from './components/partenaires.js';
import { loadTemoignages } from './components/temoignages.js';
import { loadArticles, loadArticleDetailSPA } from './components/blog.js';
import { loadSocialPosts } from './components/social.js';
import { initWhatsappModal } from './components/contact-modal.js';
import { initPosteModalListeners } from './modal/poste-modal.js';

// Expose functions expected by inline HTML handlers
window.navigateTo = navigateTo;
window.navigateToSection = navigateToSection;
window.closeProjetModal = closeProjetModal;
window.initWhatsappModal = initWhatsappModal;
window.initPosteModalListeners = initPosteModalListeners;
// Initialize once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Ensure modal close/overlay handlers are wired
  initModalListeners();
  initWhatsappModal();
  initPosteModalListeners();

  const hash = window.location.hash;

  if (hash.startsWith('#blog')) {
    navigateTo('blog');
  }
  else if (hash.startsWith('#article')) {
    const paramsString = hash.includes('?') ? hash.split('?')[1] : '';
    const searchParams = new URLSearchParams(paramsString);
    const slug = searchParams.get('slug');

    if (slug && slug !== 'undefined') {
      navigateTo('article', { slug: slug });
    } else {
      navigateTo('blog');
    }
  }
  else if (hash.startsWith('#mentions-legales')) {
    navigateTo('mentions-legales');
  }
  else if (hash.startsWith('#politique-confidentialite')) {
    navigateTo('politique-confidentialite');
  }
  else {
    loadHero();
    loadApropo();
    loadProjets();
    loadPostes();
    loadServices();
    loadOutils();
    loadPartenaires();
    loadTemoignages();
    navigateTo('index');
    const targetId = hash ? hash.slice(1) : '';
    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 400);
      }
    }
  }
});