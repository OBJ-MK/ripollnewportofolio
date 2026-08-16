/* script/theme.js
 * Role: bascule mode sombre (défaut) / mode clair via le bouton
 * .theme-toggle du footer, avec persistance de la préférence.
 *
 * Ce fichier doit être chargé le plus tôt possible dans <head>, AVANT les
 * feuilles de style, pour appliquer immédiatement le thème sauvegardé et
 * éviter un flash visuel (page sombre qui clignote en clair une fraction
 * de seconde au chargement).
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'ripoll-theme';
  var root = document.documentElement;

  // 1. Applique immédiatement le thème sauvegardé (avant le premier rendu)
  // Protégé par try/catch : ce script tourne en tout premier, avant tout le
  // reste du site. Si localStorage lève une exception (navigation privée
  // stricte, webview restreint type in-app browser), ça ne doit jamais
  // empêcher le reste de la page de se charger.
  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // Stockage indisponible : on continue simplement en thème par défaut
  }
  if (saved === 'light') {
    root.setAttribute('data-theme', 'light');
  }

  function isLight() {
    return root.getAttribute('data-theme') === 'light';
  }

  function updateIcon(btn) {
    var icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = isLight() ? 'fa-regular fa-moon' : 'fa-regular fa-sun';
  }

  function toggleTheme(btn) {
    if (isLight()) {
      root.removeAttribute('data-theme');
      try { localStorage.setItem(STORAGE_KEY, 'dark'); } catch (e) {}
    } else {
      root.setAttribute('data-theme', 'light');
      try { localStorage.setItem(STORAGE_KEY, 'light'); } catch (e) {}
    }
    updateIcon(btn);
  }

  // 2. Câble le bouton une fois le DOM prêt
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    updateIcon(btn);
    btn.addEventListener('click', function () {
      toggleTheme(btn);
    });
  });
})();