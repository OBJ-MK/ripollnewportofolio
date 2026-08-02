/* components/contact-modal.js
 * Role: modal "Contactez-moi sur WhatsApp" — remplace la redirection vers
 * #contact pour tous les boutons CTA du site (nav, hero, à propos, partenaires).
 * Nécessite CONFIG.WHATSAPP_NUMBER défini dans config/config.js
 * (format international sans '+' ni espaces, ex: '221771234567').
 */

import { CONFIG } from '../config/config.js';

let overlay = null;
let nomInput = null;
let messageInput = null;

function buildModal() {
  if (overlay) return; // déjà construit

  overlay = document.createElement('div');
  overlay.className = 'wa-modal-overlay';
  overlay.innerHTML = `
    <div class="wa-modal" role="dialog" aria-modal="true" aria-label="Contact WhatsApp">
      <button type="button" class="wa-modal-close" aria-label="Fermer">✕</button>
      <div class="wa-modal-icon">
        <i class="fa-brands fa-whatsapp"></i>
      </div>
      <h3>Contactez-moi sur <span>WhatsApp</span></h3>
      <p class="wa-modal-desc">
        Remplissez les champs ci-dessous pour générer votre message personnalisé.
      </p>
      <div class="wa-field">
        <label for="wa-nom">Votre nom et prénom</label>
        <input id="wa-nom" type="text" placeholder="Ex: Jean Dupont" autocomplete="name">
      </div>
      <div class="wa-field">
        <label for="wa-message">Message</label>
        <textarea id="wa-message" placeholder="Décrivez votre besoin..."></textarea>
      </div>
      <button type="button" class="wa-modal-submit">
        <i class="fa-brands fa-whatsapp"></i>
        Envoyer sur WhatsApp
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  nomInput = overlay.querySelector('#wa-nom');
  messageInput = overlay.querySelector('#wa-message');

  overlay.querySelector('.wa-modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(); // clic en dehors de la carte
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  overlay.querySelector('.wa-modal-submit').addEventListener('click', envoyerWhatsapp);
}

function envoyerWhatsapp() {
  const numero = CONFIG.WHATSAPP_NUMBER;
  if (!numero) {
    console.error('[contact-modal] CONFIG.WHATSAPP_NUMBER manquant dans config.js');
    return;
  }

  const nom = nomInput.value.trim();
  const message = messageInput.value.trim();

  if (!nom) {
    nomInput.style.borderColor = '#e74c3c';
    nomInput.focus();
    return;
  }
  nomInput.style.borderColor = '';

  const texteFinal = `Bonjour, je suis ${nom}.\n\n${message || "Je souhaite en savoir plus sur vos services."}`;
  const lien = `https://wa.me/${numero}?text=${encodeURIComponent(texteFinal)}`;

  window.open(lien, '_blank', 'noopener');
  closeModal();
}

export function openWhatsappModal(messagePrerempli = '') {
  buildModal();
  messageInput.value = messagePrerempli;
  nomInput.value = '';
  nomInput.style.borderColor = '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => nomInput.focus(), 200);
}

function closeModal() {
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function findCardTitle(el, selector) {
  // Cherche le titre de la carte (service, partenaire...) associée au
  // bouton cliqué, en ciblant directement la classe CSS utilisée dans le
  // rendu de la carte — plus fiable qu'une recherche générique de heading.
  const card = el.closest('div, article, li');
  if (!card) return '';
  const titleEl = card.querySelector(selector) || card.parentElement?.querySelector(selector);
  return titleEl ? titleEl.textContent.trim() : '';
}

/* Câble tous les boutons CTA du site vers le modal — via délégation
 * d'événements sur document, pour fonctionner aussi bien sur les boutons
 * déjà présents dans le HTML (nav, hero, à propos) que sur ceux générés
 * dynamiquement après le chargement des données Strapi (services,
 * partenaires) qui n'existent pas encore au moment de l'initialisation. */
export function initWhatsappModal() {
  buildModal();

  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a, .apply-btn');
    if (!el) return;
    const texte = el.textContent.trim();

    if (texte === 'Commencer une discussion') {
      openWhatsappModal(
        "Bonjour, je souhaite commencer une discussion au sujet d'un projet de communication digitale."
      );
      return;
    }

    if (texte === 'Me contacter') {
      const message = el.classList.contains('cta-outline')
        ? "Bonjour, je viens de découvrir votre site et j'aimerais échanger sur un projet."
        : "Bonjour, j'ai découvert votre parcours et vos services, j'aimerais échanger avec vous.";
      openWhatsappModal(message);
      return;
    }

    if (texte === 'Demander ce service') {
      e.preventDefault(); // utile pour le <a href="#contact"> du bloc partenaires
      const titre = findCardTitle(el, '.service-name');
      openWhatsappModal(
        titre
          ? `Bonjour, je souhaite obtenir plus d'informations sur votre service : ${titre}.`
          : 'Bonjour, je souhaite obtenir plus d\'informations sur ce service.'
      );
      return;
    }

    if (texte === 'Demander une mise en relation') {
      e.preventDefault();
      // TODO: remplacer '.service-name' par la vraie classe du titre sur
      // les cartes partenaires dès qu'elle sera confirmée.
      const titre = findCardTitle(el, '.service-name');
      openWhatsappModal(
        titre
          ? `Bonjour, je souhaite être mis(e) en relation avec un expert pour : ${titre}.`
          : 'Bonjour, je souhaite être mis(e) en relation avec un expert de votre réseau.'
      );
    }
  });
}