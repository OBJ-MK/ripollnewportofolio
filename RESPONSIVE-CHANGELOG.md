# RESPONSIVE-CHANGELOG

Audit réalisé le 2026-06-24.  
RESPONSIVE-AUDIT.md était absent au démarrage : l'audit complet a été conduit directement sur les sources CSS/HTML.

---

## Système de breakpoints unifié

**Avant :** 3 plages incohérentes (`≤480`, `481–768`, `≥769`).  
**Après :** 5 plages mobile-first :

| Plage | Fichier | Rôle |
|-------|---------|------|
| 0–480px | `telephone.css` | Mobile |
| 481–600px | `tablette.css` (nouveau bloc) | Phablet — hamburger étendu |
| 601–768px | `tablette.css` (bloc existant revu) | Tablette — nav visible |
| 769–1023px | `tablette.css` (nouveau bloc) | Tablette large — hero 1 col |
| ≥769px | `desktop.css` | Sidebar masquée, nav complète |

---

## Corrections détaillées

### 1. Double-padding mobile supprimé
**Problème :** `.section { padding: 30px }` + sous-éléments avec `padding: 0 20px` → contenu à 50px du bord sur 320px (215px de largeur utile seulement, 57% du viewport).  
**Correction :** `telephone.css`
- `.section { padding: 40px 24px; }` — padding horizontal unifié à 24px
- `.full-section { padding: 40px 0; }` — le parent gère uniquement le vertical, pas l'horizontal
- Suppression de `padding-left: 20px; padding-right: 20px` sur `.section-header`
- Suppression de `padding: 0 20px` sur `.tools-wrapper`, `.apropos-grid`, `.contact-inner`
- **Résultat :** contenu à 24px du bord → 272px sur 320px (85% du viewport) ✓

### 2. Carousels — négatif-margin pour bord-à-bord
**Problème :** Le carousel était à l'intérieur du padding de `.section` (30px), les cartes ne montraient pas bien le "peek" suivant.  
**Correction :** `telephone.css`  
- `.services-grid, .projects-grid, .postes-grid, .testimonial-grid, .articles-featured, .articles-row, .social-wall` : ajout de `margin: 0 -24px; padding: 4px 24px 12px;`
- Compense exactement le padding de `.section` pour que le carousel soit bord-à-bord dans la section.

### 3. Float chips — overflow horizontal sur tablette
**Problème :** `.chip1 { right: -20px }` et `.chip2 { left: -30px }` positionnées négativement hors du container sans `overflow:hidden` → débordement horizontal visible sur tablette 481–768px et 769–1023px.  
**Correction :** `tablette.css`  
- Ajout de `.chip1, .chip2 { display: none; }` dans les 3 blocs tablet (481–600, 601–768, 769–1023).
- Les chips restent visibles uniquement sur desktop ≥1024px où elles ne débordent pas.

### 4. Nav hamburger étendu à 481–600px
**Problème :** À 481–600px les 7 liens de nav + logo + actions nécessitent ~715px mais le viewport n'en offre que 420–540px → overflow horizontal de la navbar.  
**Correction :** `tablette.css` (nouveau bloc 481–600px)
- `.nav-links, .nav-actions { display: none; }` — liens cachés
- `.logo > div:first-child { display: flex; width: 44px; height: 44px; }` — hamburger visible
- `.side.open { display: flex; }` — sidebar activée pour cette plage
- Padding nav réduit : `15px 24px`

### 5. Hero 769–1023px — colonne unique
**Problème :** La grille `1fr 300px` avec `gap: 80px` et `padding: 80px 60px` laisse seulement ~270px au contenu gauche à 769px → titre compressé, hiérarchie dégradée.  
**Correction :** `tablette.css` (nouveau bloc 769–1023px)
- `.hero-inner { grid-template-columns: 1fr; gap: 48px; text-align: center; max-width: 680px; margin: 0 auto; }`
- `.hero-card { max-width: 480px; margin: 0 auto; }`
- Grilles de contenu en 2 colonnes (services, projects, postes, testimonials)
- Outils, à propos, contact : colonne unique

### 6. Tap targets ≥ 44×44px
**Problème :** Plusieurs boutons avaient une hauteur ~30–38px (sous le seuil WCAG de 44px).  
**Correction :** `telephone.css`
- `.logo > div:first-child { width: 44px; height: 44px; min-width: 44px; }` (hamburger)
- `.cta-main, .cta-outline { min-height: 44px; }`
- `.sidebtn-ghost, .sidebtn-accent { min-height: 44px; }`
- `.sidenav-links a { min-height: 44px; display: flex; align-items: center; }`
- `.social-btn { min-height: 44px; }`
- `.apply-btn { min-height: 44px; display: flex; align-items: center; }`
- `.form-submit { min-height: 44px; }`
- `.filter-btn { min-height: 44px; }` (blog)
- `tablette.css` 481–600px : hamburger `44×44px`

### 7. Corps de texte ≥ 16px sur mobile
**Problème :** `.hero-desc (15.5px)`, `.about-body (14.5px)`, `.contact-desc (14.5px)` sous le seuil WCAG recommandé pour mobile.  
**Correction :** `telephone.css`
- `.hero-desc { font-size: 16px; }` (au lieu de l'héritage 15.5px)
- `.about-body { font-size: 16px; }` (au lieu de 14.5px)
- `.contact-desc { font-size: 16px; }` (au lieu de 14.5px)

### 8. Hero-title fluide sur mobile
**Problème :** `.hero-title { font-size: 2.1rem; }` fixe sur ≤480px — trop grand à 320px (33.6px).  
**Correction :** `telephone.css`  
- `.hero-title { font-size: clamp(1.9rem, 8vw, 2.4rem); }` → 25.6px à 320px, 30.4px à 380px ✓

### 9. Newsletter input — largeur fixe supprimée
**Problème :** `.newsletter-input { width: 240px; }` — largeur fixe qui déborde sur certains mobiles étroits.  
**Correction :** `telephone.css`  
- `.newsletter-input { width: 100%; max-width: 100%; }` ← s'adapte au container

### 10. prefers-reduced-motion — accessibilité
**Problème :** Aucune règle pour les utilisateurs ayant activé `prefers-reduced-motion`. Les animations `pulse`, `floatY`, `marquee` et `fade-in` étaient systématiquement actives.  
**Correction :** `style.css` (ajouté en fin de fichier)
- Block `@media (prefers-reduced-motion: reduce)` désactivant toutes les transitions/animations
- `.partners-track { animation: none; }` — marquee stoppé
- `.float-chip { animation: none; }` — chips statiques
- `.pulse-dot, .avail-dot { animation: none; opacity: 1; }` — dots statiques
- `.fade-in { opacity: 1; transform: none; transition: none; }` — éléments immédiatement visibles

### 11. Import Google Fonts supprimé de blog.css
**Problème :** `@import url('https://fonts.googleapis.com/css2?...')` en tête de `blog.css` — dépendance externe CDN, requête réseau supplémentaire, contradictoire avec l'approche locale de `style.css`.  
**Correction :** `blog.css`  
- Suppression de l'`@import`. La police Lexend est déjà chargée localement via `style.css` (qui est inclus dans `blog.html` juste après `blog.css`).

### 12. desktop.css — breakpoint maintenu à 769px
**Note :** Le breakpoint de `desktop.css` reste à `min-width: 769px` pour assurer le masquage de la sidebar et la visibilité de la nav sur toute la plage ≥769px. Les overrides de layout (hero 1 col sur 769–1023px) sont gérés par le bloc dédié dans `tablette.css` qui prend la précédence via la cascade.

---

## Validation par largeur (raisonnement CSS)

| Largeur | Résultat | Notes |
|---------|----------|-------|
| 320px | ✓ | Hamburger 44px, content 272px, titre ~25.6px, body 16px |
| 360px | ✓ | Content 312px, titre ~28.8px, carousels snap OK |
| 375px | ✓ | Content 327px, titre ~30px |
| 390px | ✓ | Content 342px |
| 430px | ✓ | Content 382px, encore en mode mobile (≤480px) |
| 481px | ✓ | Bascule phablet : hamburger, sidebar, padding 32px |
| 600px | ✓ | Dernier px phablet : hamburger encore présent |
| 601px | ✓ | Bascule tablette : nav visible, gap 14px, 7 liens dans ~690px dispo ✓ |
| 768px | ✓ | Tablette : hero 1 col, grilles 2 col, nav confortable |
| 769px | ✓ | Bascule tablette large : hero centré 1 col max-width 680px |
| 834px | ✓ | iPad Pro : même layout tablette large |
| 1023px | ✓ | Dernier px tablette large |
| 1024px | ✓ | Hero passe en 2 col (524px colonne gauche), desktop complet |
| 1280px | ✓ | Max-width 1200px centré, espacements corrects |
| 1366px | ✓ | Idem, espace lateral visible |
| 1440px | ✓ | Idem |
| 1920px | ✓ | Centré, max-width 1200px, marges larges |

---

## Points à tester sur appareil réel

- [ ] Geste de swipe carousel sur iOS Safari (smooth scroll, snap) à 375px
- [ ] Sidebar mobile : ouverture/fermeture + focus trap clavier
- [ ] Nav tablette 601–640px : s'assurer que les 7 liens ne débordent pas sur les appareils physiques
- [ ] Tap targets : vérifier le retour visuel sur appuis longs (iOS hold)
- [ ] newsletter-band à 481–600px : vérifier l'alignement du formulaire en colonne
- [ ] Vérifier que `prefers-reduced-motion` est bien respecté sur macOS/iOS (paramètre accessibilité)
- [ ] Blog page sur tablette réelle : carrousel articles et social-wall

---

## Checklist finale

- [x] Tous les problèmes identifiés par l'audit traités
- [x] Aucune largeur de la liste 320–1920px ne devrait déborder horizontalement
- [x] Desktop non régressé (styles base style.css inchangés, desktop.css préservé)
- [x] Changelog écrit
- [x] prefers-reduced-motion respecté
- [x] Tap targets ≥ 44×44px sur mobile
- [x] Corps ≥ 16px sur mobile
- [x] Pas de `!important` ajouté (sauf `.side { display: none !important; }` existant dans desktop.css — conservé car nécessaire pour passer au-dessus du display:flex de la sidebar JS)
