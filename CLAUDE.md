# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Two-repo project: a **static frontend** (`ripollnewdesign/`) deployed on Netlify, and a **Strapi v5 backend** (`ripolldarcia-backend/`) deployed on Railway with a Neon PostgreSQL database.

- Frontend URL: `https://ripolldarcia.com`
- Backend API: `https://api.ripolldarcia.com`
- Backend admin: `https://api.ripolldarcia.com/admin`

There is **no build step** on the frontend. Edit files and open `index.html` directly in a browser, or serve the folder with any static server (e.g. `npx serve .` from `ripollnewdesign/`).

## Backend commands (ripolldarcia-backend/)

```bash
npm run dev      # develop mode with hot-reload (Strapi admin + API)
npm run build    # rebuild Strapi admin panel
npm start        # production start (used by Railway)
```

Requires Node ≥20. The `.env` file must have `DATABASE_URL`, `APP_KEYS`, `JWT_SECRET`, etc. See `.env.example`.

## Frontend architecture

### Pages
- `index.html` — single-page portfolio (all sections on one page)
- `pages/blog.html` — separate blog/social wall page

### CSS layering (load order matters)
All pages load in this order:
1. `css/style.css` — base styles, CSS custom properties, `@font-face` Lexend, all section styles, desktop-first layout
2. `css/telephone.css` — overrides for ≤480px
3. `css/tablette.css` — overrides for 481–768px and intermediate breakpoints
4. `css/desktop.css` — overrides for ≥769px (sparse, mostly grid columns)
5. `css/blog.css` — blog-only styles (loaded before the others on blog.html)

**Never** add `@import url('https://fonts.googleapis.com/...')` to any CSS file — Lexend is self-hosted in `assets/fonts/`. The `@font-face` declarations in `style.css` cover weights 500, 600, 700, 800, 900 and regular (400).

### Design tokens (CSS custom properties in style.css)
```
--bg: #0b0d14          /* main background */
--bg2: #0f1119         /* alternate section background */
--surface / --surface2 /* card backgrounds */
--accent: #f5c518      /* gold — primary accent */
--text: #eef0f8        /* body text */
--muted                /* subdued text */
--font-display / --font-body: "Lexend", sans-serif
```
Never change these values — the entire visual identity depends on them.

### JavaScript files
- `script/script.js` — IntersectionObserver fade-in + sidebar mobile open/close (Escape key, click backdrop)
- `script/caroussel.js` — transforms grid sections into touch carousels with dot navigation at ≤480px. Targets: `.services-grid`, `.projects-grid`, `.postes-grid`, `.testimonial-grid`, `.articles-featured`, `.articles-row`, `.social-wall`. Re-initialises on resize.
- `script/blog.js` — `setFilter()` function wired to the filter bar buttons; shows/hides article and social sections + per-platform filtering of `.social-card` elements
- `script/cms/cms.js` — Strapi API integration (see below)

## CMS integration (cms.js)

`script/cms/cms.js` fetches Strapi on `DOMContentLoaded` and hydrates the DOM. It runs on both pages and detects which page it's on via `window.location.pathname`.

**Key principle:** the HTML always contains real default content as SEO fallback. `cms.js` only overwrites elements when the API returns data. A `try/catch` around every fetch ensures the page stays intact on API failure.

### Hydration hooks

Elements marked with `data-cms="<type>.<Champ>"` are hydrated by `cms.js`:
- Text nodes: `el.textContent = value`
- `<a>` tags: `el.href = value`
- `<img>` tags: `el.src = value`

Collection rendering (projets, postes, articles) replaces the entire `#projets-container`, `#postes-container`, `#section-articles` containers when the API returns data.

### Strapi API endpoints
| Content type | Kind | Endpoint | populate |
|---|---|---|---|
| hero | Single | `/api/hero` | — |
| apropo | Single | `/api/apropo?populate=*` | Photo (media) |
| page-blog | Single | `/api/page-blog` | — (404 until published — expected, caught) |
| projet | Collection | `/api/projets?populate[...]` | Image + stack/badges/liens/logo |
| blog-article | Collection | `/api/blog-articles?populate=*` | image_couverture + blog_tags |
| blog-tag | Collection | (via blog-article populate) | — |
| social-post | Collection | `/api/social-posts` | — |
| poste | Collection | `/api/postes` | — |

The old `article` collection was removed (2026-07) — the blog reads `blog-article` only.

### Strapi field name convention
Legacy content types use PascalCase fields (`Titre`, `Photo`, `Description`, `Image`, `Lien`, `Type`, `Statut`, `Entreprise`, `Localisation`, `Temps`, `Salaire`) with camelCase exceptions (`sousTitre`, `badgeTexte`, `statProjets`, `statExperience`, `statSatisfaction`, `slug`, `stack`). Blog content types use snake_case (`description_courte`, `image_couverture`, `date_publication`, `blog_tags`, `mis_en_avant`, `titre_principal`, `sous_titre`, `date_texte`, `lien_externe`) — except `Titre`. **Immutable typo'd fields on social-post: `Commantaire` and `Repost` (capitalised) — use as-is, never "fix" them.**

The `CONFIG.FIELDS` object in `cms.js` centralises these names — update there if schemas ever change.

### Rich text (blocks)
`apropo.points_forts` and `blog-article.contenu` are Strapi `blocks` (rich text). The `blocksToHTML()` helper in `cms.js` converts them to HTML; it handles `paragraph`, `heading`, `list`, `quote`, `code`, `image` and inline `link` nodes, escaping text via `escapeHTML()`.

### Blog pages
- `pages/blog.html` — header hydrated from `page-blog`, article cards from `blog-articles` (sorted by `date_publication` desc, `mis_en_avant` first as featured card), tag filter chips generated client-side, social wall from `social-posts` (manual-first: Ripoll copies posts into Strapi by hand; any future automation must write into the same collection).
- `pages/article.html?slug=<slug>` — article detail page; fetches `/api/blog-articles?filters[slug][$eq]=...`, renders blocks content, shows `#article-notfound` on unknown slug.

### shared.stack component
The `stack` field on `projet` is a repeatable component with a single `nom` field (string). Each item arrives as `{ nom: "..." }` in the API response.

## Content rules

See `TODO-MANUEL.md` for pending manual actions (Cloudinary credentials, client placeholders). Sections and fields tagged `<!-- À VALIDER PAR LE CLIENT -->` contain content deduced from the client's profession — confirm before publishing.

**Never invent content** about Ripoll Darcia. Missing information must appear as `[À COMPLÉTER PAR LE CLIENT]` placeholders, never as plausible-looking fake content.

## Responsive — do not break

The responsive pass is complete and approved. When editing `index.html` or `pages/blog.html`:
- Only change **text content** and `data-cms` attributes unless structural change is explicitly discussed and approved
- Do not alter classes on grid wrappers (`.projects-grid`, `.postes-grid`, `.services-grid`, etc.) — they are targeted by `telephone.css` and `tablette.css`
- Do not add new CSS breakpoints without checking all four CSS files
- The carousel in `caroussel.js` relies on `grid.children` — adding non-card children to a grid section will break dot counting
