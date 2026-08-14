/* utils/dom-helpers.js
 * Role: DOM hydration helpers: hydrate, hydrateHTML, hydrateField, hideSkeleton, getFocusables
 */

export function hydrate(selector, value) {
  const el = document.querySelector(`[data-cms="${selector}"]`);
  if (!el || value == null) return;
  if (el.tagName === 'A') {
    el.href = value;
    if (!el.textContent.trim() || el.textContent.trim() === selector) {
      el.textContent = value;
    }
  } else if (el.tagName === 'IMG') {
    el.src = value;
  } else {
    el.textContent = value;
  }
}

export function hydrateHTML(selector, html) {
  const el = document.querySelector(`[data-cms="${selector}"]`);
  if (!el || !html) return;
  if (el.tagName === 'P') {
    const div = document.createElement('div');
    div.className = el.className;
    div.setAttribute('data-cms', selector);
    div.innerHTML = html;
    el.replaceWith(div);
  } else {
    el.innerHTML = html;
  }
}

export function hydrateField(card, selector, value) {
  if (value == null) return;
  const el = card.querySelector(`[data-cms="${selector}"]`);
  if (!el) return;
  el.textContent = value;
}

export function hideSkeleton(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

export function getFocusables(container) {
  return Array.from(container.querySelectorAll(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}


let toastTimer = null;

/**
 * Affiche un petit toast en bas de l'écran (pas de alert()).
 * Réutilise un seul élément DOM, créé au premier appel.
 */
export function showToast(message, duration = 2200) {
  let toast = document.getElementById('cms-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cms-toast';
    toast.className = 'cms-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}