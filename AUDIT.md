# AUDIT TECHNIQUE — Portfolio Ripoll Darcia
> Audit en lecture seule. Aucun fichier source modifié.  
> Date : 2026-06-24 | Auditeur : Claude Sonnet 4.6

---

## 1. Arborescence réelle

```
ripoll/
├── ripollnewdesign/                    ← FRONTEND (site statique Netlify)
│   ├── index.html                      ← Page principale (SPA-like)
│   ├── pages/
│   │   └── blog.html                   ← Page blog séparée
│   ├── css/
│   │   ├── style.css                   ← CSS principal + définitions @font-face Lexend
│   │   ├── telephone.css               ← Responsive ≤ 480px
│   │   ├── tablette.css                ← Responsive 481–768px
│   │   ├── desktop.css                 ← Responsive ≥ 769px (très sparse)
│   │   └── blog.css                    ← CSS spécifique blog (⚠ import Google CDN)
│   ├── script/
│   │   ├── script.js                   ← Scroll, sidebar, IntersectionObserver
│   │   ├── caroussel.js                ← Dots navigation mobile
│   │   ├── blog.js                     ← Filtres blog
│   │   └── cms/                        ← ⛔ DOSSIER VIDE — aucun fichier
│   └── assets/
│       ├── fonts/                      ← Lexend woff2 auto-hébergés (500–900 + regular)
│       ├── icons/                      ← Font Awesome auto-hébergé (all.min.css + webfonts)
│       └── image/                      ← ⛔ DOSSIER VIDE — aucune image réelle
│
└── ripolldarcia-backend/               ← BACKEND (Strapi v5, déploiement Railway)
    ├── config/
    │   ├── database.js                 ← Neon PostgreSQL + pool
    │   ├── server.js                   ← HOST 0.0.0.0, PORT depuis env
    │   ├── middlewares.js              ← CORS + CSP Cloudinary
    │   └── plugins.js                  ← Cloudinary upload + Sendgrid email
    ├── src/
    │   ├── api/
    │   │   ├── hero/                   ← Single type
    │   │   ├── apropo/                 ← Single type
    │   │   ├── projet/                 ← Collection type
    │   │   ├── article/                ← Collection type
    │   │   ├── poste/                  ← Collection type
    │   │   └── post/                   ← ⛔ DOSSIER VIDE (résidu)
    │   └── components/shared/
    │       └── stack.json              ← Composant répétable (champ: nom)
    ├── .env                            ← ⚠ Présent localement avec valeurs réelles
    ├── .env.example                    ← Template sans secrets
    └── .gitignore                      ← .env listé ✓
```

---

## 2. Tableau de synthèse

| Zone | Constats critiques | Gravité |
|------|-------------------|---------|
| Frontend — Identité | Page entière décrit un **dev full-stack / UI-UX**, pas un journaliste/CM | 🔴 Critique |
| Frontend — Intégration | `script/cms/` vide, zéro appel API Strapi, contenu 100% hardcodé | 🔴 Critique |
| Frontend — SEO | Pas de `<meta description>`, pas de canonical, pas d'OG, `lang="en"` sur blog | 🔴 Critique |
| Frontend — Assets | `assets/image/` vide, tous les projets en SVG placeholder | 🟠 Élevée |
| Frontend — Polices | `blog.css` importe Lexend via Google CDN (contredit l'auto-hébergement) | 🟠 Élevée |
| Frontend — Contact | Formulaire de contact sans action ni handler JS | 🟠 Élevée |
| Backend — Sécurité | `.env` local contient des secrets réels — vérifier si jamais commité | 🟠 Élevée |
| Backend — Cloudinary | Credentials `CLOUDINARY_NAME/KEY/SECRET` vides dans `.env` local | 🟠 Élevée |
| Backend — Schémas | Champs en majuscule (`Titre`, `Contenu`, etc.) dans tous les content types | 🟡 Moyenne |
| Backend — Résidu | `src/api/post/` vide, inutile | 🟡 Moyenne |
| Responsive | Pas de breakpoint entre 769 et 1199px ; double padding section/full-section | 🟡 Moyenne |

---

## 3. Audit FRONTEND

### 3.1 Sémantique HTML & SEO

#### ✅ Ce qui est présent
| Élément | Valeur | Fichier |
|---------|--------|---------|
| `<title>` | `Ripoll Darcia — SMM \| Journaliste` | `index.html:6` |
| `lang` | `fr` | `index.html:1` |
| `viewport` meta | `width=device-width, initial-scale=1.0` | `index.html:3` |
| Font preload | 3 poids Lexend (500, 700, 800) | `index.html:8-10` |

#### ❌ Ce qui est absent ou cassé

**[F-SEO-01] Pas de `<meta name="description">`**  
Observation : `index.html` ne contient aucune meta description.  
Gravité : **Critique**  
Impact : Google ne peut pas générer d'extrait pertinent → taux de clic réduit.  
Recommandation : Ajouter `<meta name="description" content="Portfolio de Ripoll Darcia, journaliste et community manager...">`.

**[F-SEO-02] Pas de balise `<link rel="canonical">`**  
Observation : Absente de `index.html`.  
Gravité : **Élevée**  
Impact : Risque de contenu dupliqué (www / non-www, http/https).  
Recommandation : Ajouter `<link rel="canonical" href="https://ripolldarcia.netlify.app/">`.

**[F-SEO-03] Pas de balises Open Graph**  
Observation : Aucun `og:title`, `og:description`, `og:image` dans `index.html`.  
Gravité : **Élevée**  
Impact : Partages sur réseaux sociaux sans preview.  
Recommandation : Ajouter les 5 balises OG minimales + `twitter:card`.

**[F-SEO-04] `lang="en"` sur `blog.html`**  
Observation : `pages/blog.html:2` → `<html lang="en">` alors que tout le contenu est en français.  
Gravité : **Élevée**  
Impact : Google traite la page comme anglaise, pénalité SEO.  
Recommandation : Remplacer par `lang="fr"`.

**[F-SEO-05] Pas de `sitemap.xml` ni `robots.txt` dans le frontend**  
Observation : Ces fichiers sont absents de `ripollnewdesign/`.  
Gravité : **Moyenne**  
Impact : L'indexation n'est pas guidée.  
Recommandation : Créer `sitemap.xml` et `robots.txt` à la racine du frontend.

**[F-SEO-06] Pas de favicon, pas de web manifest**  
Observation : Aucun `favicon.ico`, `site.webmanifest`, `apple-touch-icon` déclaré.  
Gravité : **Faible**  
Impact : Onglet sans icône, pas d'installation PWA.

**[F-SEO-07] Pas de données structurées (Schema.org)**  
Observation : Pas de `<script type="application/ld+json">`.  
Gravité : **Faible**  
Impact : Pas de rich snippet possible.

---

### 3.2 Incohérence d'identité — CRITIQUE CONFIRMÉ

**[F-IDENT-01] La page principale est un portfolio de développeur full-stack, pas un portfolio journaliste/CM**

Preuve directe dans `index.html` :

| Ligne | Extrait | Problème |
|-------|---------|---------|
| L.105 | `"Développeur Full-stack & Designer UI/UX passionné."` | Hero desc |
| L.169 | `"Développement Web Full-stack"` | Service 1 |
| L.179 | `"Design UI/UX"` | Service 2 |
| L.189 | `"Architecture & DevOps"` | Service 3 |
| L.199 | `"Applications Mobile"` | Service 4 |
| L.260 | `"AnalytiX Pro"` (SaaS/Dashboard) | Projet fictif dev |
| L.293 | `"GreenShop"` (E-commerce) | Projet fictif dev |
| L.435 | `"React / Next.js 95%"` | Skill bar |
| L.440 | `"Node.js / Express 90%"` | Skill bar |
| L.541 | `"Développeur Full-stack Senior"` | Poste ouvert |
| L.631 | `"Full-stack Dev & UI/UX Designer"` | Frame badge À propos |
| L.796 | `"Paris, France"` | Contact (client est à Pointe-Noire, Congo) |

Le `<title>` dit bien "SMM | Journaliste" et la page **blog.html** est correctement orientée journalisme. Il y a donc une **scission complète** : le titre et le blog sont bons, mais **tout le corps de la page index.html est du contenu de substitution (boilerplate dev)** qui n'a jamais été remplacé.

Gravité : **Critique**  
Impact : Le client n'est pas représenté. Tout recruteur/client voyant la page perçoit un développeur, pas un journaliste.  
Recommandation : Remplacer intégralement le contenu statique de `index.html` (hero, services, projets, outils, postes, à propos) avec le vrai profil de Ripoll Darcia.

---

### 3.3 Organisation CSS

**[F-CSS-01] `blog.css` importe Lexend via Google Fonts CDN**  
Observation : `css/blog.css:1` → `@import url('https://fonts.googleapis.com/css2?family=Lexend...')`.  
Alors que `css/style.css:1-49` définit Lexend en `@font-face` auto-hébergé.  
Gravité : **Élevée**  
Impact : Deux sources de la même police → requête réseau externe, violation de la politique de confidentialité RGPD (transfert IP vers Google), contredit l'auto-hébergement mis en place.  
Recommandation : Supprimer l'`@import` dans `blog.css` ; les `@font-face` de `style.css` suffisent (blog.html charge déjà `style.css`).

**[F-CSS-02] Fichiers `.woff` référencés mais absents**  
Observation : `style.css:6` → `url('../assets/fonts/lexend-v26-latin-500.woff') format('woff')`. Seuls des `.woff2` existent dans `assets/fonts/`.  
Gravité : **Faible**  
Impact : Tentative de chargement échouée (404 silencieuse), le navigateur tombe en fallback `.woff2` qui est présent.  
Recommandation : Supprimer les références `.woff` ou ajouter les fichiers `.woff`.

**[F-CSS-03] Double padding sur `.full-section` + `.section-inner.section`**  
Observation : `style.css:656` → `.section { padding: 100px 60px }` et `style.css:658` → `.full-section { padding: 100px 60px }`. Dans le HTML chaque section est `<div class="full-section"><div class="section-inner section">`. Les deux classes s'appliquent → 200px de padding vertical total sur chaque section.  
Gravité : **Moyenne**  
Impact : Espacement excessif sur desktop, sections trop hautes.  
Recommandation : Choisir : soit le padding sur `.full-section`, soit sur `.section-inner`. Pas les deux.

**[F-CSS-04] `font-weight: 300` utilisé sans @font-face correspondant**  
Observation : `style.css` utilise `font-weight: 300` (hero-desc, about-body, etc.) mais aucun `@font-face` pour Lexend-300 n'est défini. Seuls 500, 600, 700, 800, 900 et regular (400) sont disponibles.  
Gravité : **Moyenne**  
Impact : Le navigateur synthétise le poids 300 (rendu légèrement différent).  
Recommandation : Soit ajouter le fichier `lexend-v26-latin-300.woff2`, soit utiliser `font-weight: 400` à la place.

**[F-CSS-05] `-webkit-line-clamp` manquant dans `blog.css`**  
Observation : `blog.css:427-429` → `line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;` mais `-webkit-line-clamp: 4` est absent (alors qu'il est présent pour `.article-excerpt` à la L.265).  
Gravité : **Faible**  
Impact : Troncature text ne fonctionne pas sur certains navigateurs pour `.social-content`.

---

### 3.4 JavaScript & Logique

**[F-JS-01] `script/cms/` vide — aucune connexion à Strapi**  
Observation : `find script/cms/` → aucun fichier. Aucun `fetch()`, `XMLHttpRequest`, ni import d'URL Strapi dans `script.js`, `caroussel.js`, `blog.js`.  
Gravité : **Critique** (voir section Intégration)

**[F-JS-02] Formulaire de contact sans handler**  
Observation : `index.html:842` → `<button class="form-submit">Envoyer le message</button>`. Aucun `addEventListener`, aucun `action`, aucun `data-netlify`.  
Gravité : **Élevée**  
Impact : Le formulaire est décoratif — le message n'est jamais envoyé.  
Recommandation : Ajouter `data-netlify="true"` sur un `<form>` ou implémenter un handler JS vers Strapi/Netlify Forms.

**[F-JS-03] Bouton "Admin" sans action**  
Observation : `index.html:44` → `<button class="btn-accent">Admin</button>` — aucun listener, aucun `href`.  
Gravité : **Faible**  
Impact : Bouton mort affiché aux visiteurs.

**[F-JS-04] `isMobile()` basé sur `window.innerWidth` figé au resize**  
Observation : `caroussel.js:2-4` → `return window.innerWidth <= 480`. Correct mais l'event `resize` nettoie et réinitialise les dots (L.107-111).  
Gravité : **Faible** — implémentation acceptable.

---

### 3.5 Assets

**[F-ASSET-01] `assets/image/` entièrement vide**  
Observation : `find assets/image/` → dossier vide. Tous les projets et profil utilisent des SVG inline ou des placeholders texte.  
Gravité : **Élevée**  
Impact : Le portfolio ne montre aucun travail réel de Ripoll Darcia.  
Recommandation : Ajouter les visuels réels (photo profil, captures projets).

**[F-ASSET-02] Fonts auto-hébergées — BIEN**  
Observation : `assets/fonts/` contient `lexend-v26-latin-[500/600/700/800/900/regular].woff2`. Preload déclaré pour 500, 700, 800. Font Awesome dans `assets/icons/`.  
Gravité : N/A — constat positif. ✅

---

### 3.6 Accessibilité

**[F-A11Y-01] Labels de formulaire non liés aux inputs**  
Observation : `index.html:821-840` → `<label class="form-label">Prénom</label><input type="text" class="form-input">`. Aucun attribut `for` sur les labels, aucun `id` sur les inputs.  
Gravité : **Moyenne**  
Impact : Lecteurs d'écran ne peuvent pas associer label et champ.  
Recommandation : Ajouter `id="prenom"` sur l'input et `for="prenom"` sur le label.

**[F-A11Y-02] Boutons sans rôle ou texte accessible**  
Observation : `<button class="btn-accent">Admin</button>` — ambigu. Aucun `aria-label` sur les boutons d'actions sociales.  
Gravité : **Faible**.

**[F-A11Y-03] Pas de lien "skip to content"**  
Observation : Absent.  
Gravité : **Faible**.

---

## 4. Audit BACKEND

### 4.1 Configuration Strapi

**[B-CONF-01] Config server.js — correcte**  
`config/server.js:15-16` → `host: '0.0.0.0'`, `port: env.int('PORT', 1337)`. Déploiement Railway OK.  
⚠ Les commentaires disent "Koyeb" (L.4, L.11) alors que la cible est Railway — commentaires obsolètes.  
Gravité : **Faible** — fonctionnel, commentaires à corriger.

**[B-CONF-02] Config database.js — correcte pour Neon**  
`config/database.js:28-33` → SSL `rejectUnauthorized: false` requis pour Neon. Pool `min:0, max:2` en production (plan gratuit). Correct.  
Gravité : N/A ✅

**[B-CONF-03] CORS config**  
`config/middlewares.js:26-34` → Origines autorisées : `https://ripolldarcia.com`, `localhost:3000`, `localhost:5173`, `localhost:1337`. Cohérent.  
⚠ Le wildcard `*` n'est PAS utilisé — bien.  
Gravité : N/A ✅

**[B-CONF-04] CSP Cloudinary partielle**  
`config/middlewares.js:13-17` → `img-src` inclut `res.cloudinary.com`. OK pour l'affichage. Mais aucun `script-src` ou `style-src` personnalisé — defaults Strapi.  
Gravité : **Faible**.

---

### 4.2 Sécurité

**[B-SEC-01] `.env` local contient des secrets réels**  
Observation : `ripolldarcia-backend/.env` contient des valeurs non-vides pour :
- `APP_KEYS`, `JWT_SECRET`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` (valeurs présentes — non recopiées ici)
- `DATABASE_PASSWORD` (valeur présente)
- `DATABASE_USERNAME=ripollpostgres`

`.gitignore:124` → `.env` est bien listé.  
**Ne peut pas confirmer sans `git log` si le fichier a été commité avant l'ajout au .gitignore.**  
Gravité : **Élevée**  
Recommandation : Vérifier avec `git log --all --full-history -- .env`. Si commité, purger l'historique et régénérer tous les secrets.

**[B-SEC-02] Permissions publiques Strapi — non vérifiable en lecture seule**  
Observation : Les permissions sont stockées en base de données, pas dans les fichiers. Non auditable sans accès au panel Strapi.  
Gravité : **À vérifier** — s'assurer que les endpoints publics exposent uniquement ce qui est voulu.

---

### 4.3 Cloudinary — Upload cassé (confirmé)

**[B-CLOUD-01] Credentials Cloudinary vides dans `.env`**  
Observation : `ripolldarcia-backend/.env:27-29` →  
```
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
```
La config `plugins.js:19-21` lit ces variables : `cloud_name: env('CLOUDINARY_NAME')` etc.  
En production Railway, si ces variables ne sont pas définies dans le panel Railway, tout upload échoue avec une erreur Cloudinary 401/invalid credentials.  
Gravité : **Élevée**  
Impact : Upload d'images impossible → contenu sans médias.  
Recommandation : Renseigner les 3 variables dans les variables d'environnement Railway (Settings → Variables). Le `.env` local peut rester vide pour la dev.

---

### 4.4 Content types & schémas

#### hero (Single Type) — `src/api/hero/content-types/hero/schema.json`
| Champ | Type | Remarque |
|-------|------|---------|
| `Titre` | string, required | ⚠ Capitalisé |
| `sousTitre` | string, required | camelCase OK |
| `badgeTexte` | string | camelCase OK |
| `statProjets` | integer | OK |
| `statExperience` | integer | OK |
| `statSatisfaction` | **biginteger** | ⚠ biginteger pour un % (0-100) — devrait être integer |

#### apropo (Single Type) — `src/api/apropo/content-types/apropo/schema.json`
| Champ | Type | Remarque |
|-------|------|---------|
| `Titre` | string, required | ⚠ Capitalisé |
| `Contenu` | blocks, required | ⚠ Capitalisé |
| `Photo` | media, required | ⚠ Capitalisé |
| `LinkedIn`, `Facebook`, `Twitter`, `Instagram` | string | ⚠ Capitalisés |
| `Email` | email, required | ⚠ Capitalisé |

#### projet (Collection) — `src/api/projet/content-types/projet/schema.json`
| Champ | Type | Remarque |
|-------|------|---------|
| `Titre`, `Type`, `Description`, `Lien`, `Image` | divers | ⚠ Tous capitalisés |
| `stack` | component shared.stack, repeatable | ✅ camelCase |

#### article (Collection) — `src/api/article/content-types/article/schema.json`
| Champ | Type | Remarque |
|-------|------|---------|
| `Titre` | string, default hardcodé | ⚠ Capitalisé + valeur par défaut dev-oriented |
| `slug` | uid, targetField: "Titre" | ⚠ Référence un champ capitalisé |
| `Contenu`, `Resume`, `Image`, `Categorie` | divers | ⚠ Capitalisés |
| `Categorie` | string, default "Design" | ⚠ Devrait être une énumération |

#### poste (Collection) — `src/api/poste/content-types/poste/schema.json`
| Champ | Type | Remarque |
|-------|------|---------|
| `Titre`, `Description` | string/text | ⚠ Capitalisés |
| `Localisation` | enumeration: Remote/Hybride/Sur site | ✅ Cohérent avec le front |
| `Temps` | enumeration: Full-time/Part-time/Consulting | ✅ OK |
| `Salaire` | enumeration | ⚠ "Equility + Cash" (faute : "Equity") |
| `Statut` | enumeration: Bientôt/Disponible | ✅ OK |
| `Entreprise` | string | OK |

**[B-SCHEMA-01] Nommage des champs capitalisés systématiquement**  
Observation : `Titre`, `Contenu`, `Photo`, `Description`, `Image`, `Lien`, `Type`, `Resume`, `Categorie` sont capitalisés dans tous les schemas.  
Gravité : **Moyenne**  
Impact : L'API Strapi expose les champs tels quels (`data.attributes.Titre`). Si le front consomme l'API il devra utiliser les noms capitalisés — inhabituel et source d'erreurs futures.  
Recommandation : Standardiser en camelCase (`titre`, `contenu`, `photo`, etc.) via une migration de schéma.

**[B-SCHEMA-02] `statSatisfaction` en `biginteger`**  
Observation : `hero/schema.json:30` → `"type": "biginteger"`. La satisfaction est un pourcentage (0-100), `integer` suffit. `biginteger` est réservé aux très grands entiers (>2^31).  
Gravité : **Faible** — fonctionne mais sémantique incorrecte.

**[B-SCHEMA-03] `src/api/post/` — dossier vide**  
Observation : Dossier vide sans contenu-types, controller ni routes.  
Gravité : **Faible** — ne cause pas d'erreur mais pollue la structure.  
Recommandation : Supprimer le dossier `src/api/post/`.

**[B-SCHEMA-04] Faute de frappe dans poste.schema : "Equility"**  
Observation : `poste/schema.json:47` → `"Equility + Cash"` (doit être "Equity + Cash").  
Gravité : **Faible** — valeur affichée telle quelle aux visiteurs.

---

### 4.5 Sendgrid

**[B-SG-01] Credentials Sendgrid vides dans `.env` local**  
Observation : `ripolldarcia-backend/.env:33` → `SENDGRID_API_KEY=` vide.  
Gravité : **Moyenne** en local (dev ne nécessite pas d'emails), **Élevée** si vide aussi dans Railway.  
Recommandation : Vérifier que la clé est renseignée dans les variables Railway pour que le "mot de passe oublié" Strapi fonctionne.

---

## 5. Audit INTÉGRATION front↔back

### [I-01] Zéro intégration — CONFIRMÉ ABSENT

**Observation :**
- `ripollnewdesign/script/cms/` → dossier vide, aucun fichier
- `script/script.js` → aucun `fetch()`, aucune URL API
- `script/caroussel.js` → uniquement logique UI locale
- `script/blog.js` → filtres DOM locaux, aucun appel réseau
- `index.html` → tout le contenu (hero, services, projets, outils, postes, à propos) est **HTML statique hardcodé**
- `blog.html` → articles et posts des réseaux sociaux **hardcodés en HTML**

**Gravité : Critique**  
**Impact :** Strapi est configuré, déployé et inutilisé. Toute mise à jour de contenu nécessite une modification directe du HTML.

### [I-02] Pas de variables d'environnement côté frontend

**Observation :** Aucun `netlify.toml` trouvé dans `ripollnewdesign/`, aucun `.env`, aucune référence à `STRAPI_URL` ou `API_URL` dans les scripts.  
Gravité : **Élevée**  
Impact : Même si le cms.js était créé, l'URL de l'API n'est pas injectée.

### [I-03] Pas de gestion d'erreur ni fallback

**Observation :** Sans intégration, il n'y a pas non plus de fallback. Si un jour l'API est appelée, la page serait vide en cas d'échec.  
Recommandation : Concevoir le cms.js avec `try/catch` et des valeurs par défaut affichées si l'API ne répond pas.

---

## 6. Vérification des points de contexte connus

| Point contexte | Statut | Preuve |
|---------------|--------|--------|
| `cms.js` manquant → front non connecté à l'API | **CONFIRMÉ ABSENT** | `script/cms/` vide, 0 `fetch()` dans les 3 fichiers JS |
| Erreur upload Cloudinary | **CONFIRMÉ CASSÉ** | `.env:27-29` → `CLOUDINARY_NAME=` vide |
| Incohérence identité (dev full-stack vs journaliste) | **CONFIRMÉ CRITIQUE** | `index.html:105` "Développeur Full-stack", L.631 "Full-stack Dev & UI/UX Designer" |
| Conflit polices Lexend vs Syne/DM Sans | **PARTIEL** | Syne/DM Sans absents ✅ mais `blog.css:1` importe Lexend via Google CDN ⚠ |
| Bugs nommage champs Strapi (Titre capitalisé) | **CONFIRMÉ** | Tous les schemas : `Titre`, `Contenu`, `Description`, etc. capitalisés |
| `statSatisfaction` en string | **CORRIGÉ** | `hero/schema.json:30` → `"type": "biginteger"` (pas string) |
| Responsive imparfait | **CONFIRMÉ PARTIEL** | Voir RESPONSIVE-AUDIT.md |

---

## 7. Top 5 priorités (ordre d'urgence)

### 🥇 P1 — Remplacer le contenu identitaire (Critique, 0 user vu le vrai profil)
**Quoi :** Tout le corps de `index.html` parle d'un dev full-stack. Remplacer hero, services, projets, outils, postes, à propos avec le vrai profil journaliste/CM de Ripoll Darcia.  
**Pourquoi :** C'est le problème bloquant N°1 — le site ne représente pas son propriétaire.  
**Fichiers :** `index.html` (sections hero → footer), `pages/blog.html` (déjà correct).

### 🥈 P2 — Créer `script/cms/cms.js` et connecter Strapi (Critique, architecture découplée vide)
**Quoi :** Implémenter le fichier `script/cms/cms.js` qui fetch les content types Strapi (hero, apropo, projets, articles, postes) et injecte les données dans le DOM.  
**Pourquoi :** Sans ça, Strapi est inutile et le contenu ne peut être mis à jour qu'en éditant le HTML.  
**Fichiers :** Créer `script/cms/cms.js`, référencer dans `index.html` et `blog.html`, ajouter `STRAPI_URL` dans les variables Netlify.

### 🥉 P3 — Renseigner les credentials Cloudinary dans Railway (Élevée, uploads bloqués)
**Quoi :** Dans le panel Railway du backend, ajouter les variables `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`.  
**Pourquoi :** Sans ces valeurs, tout upload d'image dans le panel Strapi échoue.  
**Fichiers :** Variables d'environnement Railway (pas de fichier code à modifier).

### 4 — Corriger SEO de base (Élevée, visibilité moteurs nulle)
**Quoi :** Ajouter `<meta name="description">`, `<link rel="canonical">`, les balises Open Graph, corriger `lang="en"` dans `blog.html`, créer `sitemap.xml` et `robots.txt`.  
**Pourquoi :** Sans meta description le taux de clic organique est bas ; sans canonical le duplicate content est risqué.  
**Fichiers :** `index.html`, `pages/blog.html`.

### 5 — Supprimer l'import Google Fonts dans `blog.css` (Élevée, RGPD + cohérence)
**Quoi :** Supprimer la ligne 1 de `css/blog.css` (`@import url('https://fonts.googleapis.com...')`).  
**Pourquoi :** La police est déjà auto-hébergée via `style.css`. L'import CDN envoie l'IP du visiteur à Google sans consentement.  
**Fichiers :** `css/blog.css:1`.
