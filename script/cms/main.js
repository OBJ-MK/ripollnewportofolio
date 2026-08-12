/* main.js — Entry point module for CMS hydration
 * Role: orchestrate imports and initialization. Exposes window.navigateTo and window.closeProjetModal.
 * This file should be referenced from HTML as: <script type="module" src="script/cms/main.js" defer></script>
 */

import { navigateTo, navigateToSection, handleInitialRoute } from './router/router.js';
import { initModalListeners, closeProjetModal } from './modal/projet-modal.js';
import { initWhatsappModal } from './components/contact-modal.js';
import { initPosteModalListeners } from './modal/poste-modal.js';
import { initContactForm } from './components/contact.js';
import { initNewsletterForm } from './components/newsletter.js';
import { initCvModalListeners } from './modal/cv-modal.js';


// Expose functions expected by inline HTML handlers
window.navigateTo = navigateTo;
window.navigateToSection = navigateToSection;
window.closeProjetModal = closeProjetModal;


// Initialize once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initModalListeners();
  initWhatsappModal();
  initPosteModalListeners();
  initCvModalListeners();
  initContactForm();
  initNewsletterForm();

  handleInitialRoute();
});