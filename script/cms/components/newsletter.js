/* components/newsletter.js
 * Role: gère l'inscription à la newsletter (bloc "Ne rien manquer")
 */

import { CONFIG } from '../config/config.js';

export function initNewsletterForm() {
  const btn = document.querySelector('.newsletter-btn');
  const input = document.querySelector('.newsletter-input');
  if (!btn || !input) return; // bloc absent de cette vue, rien à faire

  // Évite d'attacher plusieurs fois le même listener si la vue est rechargée
  if (btn.dataset.newsletterBound) return;
  btn.dataset.newsletterBound = 'true';

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = input.value.trim();

    if (!email || !email.includes('@')) {
      input.style.borderColor = '#e74c3c';
      input.focus();
      return;
    }
    input.style.borderColor = '';

    const originalText = btn.textContent;
    btn.textContent = 'Inscription...';
    btn.disabled = true;

    try {
      const res = await fetch(`${CONFIG.STRAPI_URL}/api/newsletter-subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { email } }),
      });

      if (res.ok) {
        btn.textContent = 'Inscrit ✓';
        input.value = '';
        input.placeholder = 'Merci pour votre inscription !';
      } else {
        const err = await res.json().catch(() => null);
        const isDuplicate = err?.error?.message?.toLowerCase().includes('unique');
        btn.textContent = isDuplicate ? 'Déjà inscrit' : 'Erreur, réessayez';
      }
    } catch (err) {
      console.error('[newsletter] erreur inscription:', err.message);
      btn.textContent = 'Erreur, réessayez';
    } finally {
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 3000);
    }
  });
}