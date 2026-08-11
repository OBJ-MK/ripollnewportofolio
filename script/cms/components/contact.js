/* components/contact.js
 * Role: gère la soumission du formulaire de contact vers /api/contact (Brevo)
 */

import { CONFIG } from '../config/config.js';

export function initContactForm() {
  const form = document.querySelector('form[name="contact"]');
  if (!form) return; // bloc absent de cette vue, rien à faire

  if (form.dataset.contactBound) return;
  form.dataset.contactBound = 'true';

  const submitBtn = form.querySelector('.form-submit');
  const champs = {
    prenom: form.querySelector('#contact-prenom'),
    nom: form.querySelector('#contact-nom'),
    email: form.querySelector('#contact-email'),
    sujet: form.querySelector('#contact-sujet'),
    message: form.querySelector('#contact-message'),
  };
  const honeypot = form.querySelector('[name="bot-field"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // empêche l'envoi natif vers Netlify

    // Validation simple : bordure rouge sur les champs requis vides
    let valid = true;
    Object.values(champs).forEach((el) => {
      if (!el) return;
      const requis = el.hasAttribute('required');
      const vide = !el.value.trim();
      el.style.borderColor = requis && vide ? '#e74c3c' : '';
      if (requis && vide) valid = false;
    });
    if (!valid) return;

    const payload = {
      prenom: champs.prenom.value.trim(),
      nom: champs.nom.value.trim(),
      email: champs.email.value.trim(),
      sujet: champs.sujet ? champs.sujet.value.trim() : '',
      message: champs.message.value.trim(),
      'bot-field': honeypot ? honeypot.value : '',
    };

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Envoi...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${CONFIG.STRAPI_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        submitBtn.textContent = 'Message envoyé ✓';
        form.reset();
      } else {
        submitBtn.textContent = 'Erreur, réessayez';
      }
    } catch (err) {
      console.error('[contact] erreur envoi:', err.message);
      submitBtn.textContent = 'Erreur, réessayez';
    } finally {
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 3000);
    }
  });
}