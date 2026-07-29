/* main.js — Entry point module for CMS hydration
 * Role: orchestrate imports and initialization. Exposes window.navigateTo and window.closeProjetModal.
 * This file should be referenced from HTML as: <script type="module" src="script/cms/main.js" defer></script>
 */

import { navigateTo } from './router/router.js';
import { initModalListeners, closeProjetModal } from './modal/projet-modal.js';

// Expose functions expected by inline HTML handlers
window.navigateTo = navigateTo;
window.closeProjetModal = closeProjetModal;

// Initialize once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Ensure modal close/overlay handlers are wired
  initModalListeners();

  // Detect current hash and route like the original cms.js
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
  else {
    navigateTo('index');
  }
});
