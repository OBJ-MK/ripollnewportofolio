/* config/config.js
 * Role: Expose the CONFIG constant and small API helpers (apiUrl, fetchJSON).
 * Keep the original CONFIG name and structure intact (do not rename fields).
 */

export const CONFIG = {
  STRAPI_URL: 'https://api.ripolldarcia.com',
  WHATSAPP_NUMBER: '242 06 786 9231',
  FIELDS: {
    hero: {
      Entete: 'Entete',           // remappé : était Titre — le schéma l'appelle Entete (richtext)
      sousTitre: 'sousTitre',
      badgeTexte: 'badgeTexte',
      statProjets: 'statProjets',
      statExperience: 'statExperience',
      statSatisfaction: 'statSatisfaction',
    },
    apropo: {
      // Titre supprimé  : n'existe pas dans le schéma
      // Contenu supprimé : n'existe pas — remplacé par Paragraphe1 + Paragraphe2
      Paragraphe1: 'Paragraphe1', // remappé : était Contenu — texte richtext (string)
      Paragraphe2: 'Paragraphe2', // nouveau : second paragraphe (string)
      points_forts: 'points_forts', // nouveau : rich-text blocks → liste .value-item
      Photo: 'Photo', 
      cv_pdf: 'cv_pdf',            // inchangé : media plat { url, ... }
      Email: 'Email',
      LinkedIn: 'LinkedIn',
      Facebook: 'Facebook',
      Twitter: 'Twitter',
      Instagram: 'Instagram',
    },
    projet: {
      Titre: 'Titre',
      Type: 'Type',
      Categorie: 'Categorie',
      descriptionCourte: 'descriptionCourte',
      descriptionLongue: 'descriptionLongue', // rich text Markdown (string)
      Lien: 'Lien',
      Image: 'Image',   // Multiple Media → tableau de { url, ... }
      logo: 'logo',     // Single Media → objet plat { url, formats } ou null
      badges: 'badges', // répétable : { label, Type }
      liens: 'liens',   // répétable : { Label, URL }
      stack: 'stack',   // répétable : { nom }
    },
    blogArticle: {
      Titre: 'Titre',
      slug: 'slug',
      description_courte: 'description_courte',
      contenu: 'contenu',                 // richtext Markdown (string) — voir loadArticleDetail      
      image_couverture: 'image_couverture', // Single Media plat { url, formats }
      date_publication: 'date_publication',
      blog_tags: 'blog_tags',             // relation manyToMany → [{ nom }]
      mis_en_avant: 'mis_en_avant',
    },
    blogTag: {
      nom: 'nom',
    },
    pageBlog: {
      titre_principal: 'titre_principal',
      sous_titre: 'sous_titre',
      image: 'image', // Single Media plat { url, formats } — bannière du blog-hero
      annne_exp: 'annne_exp', // nombre d'années d'expérience (int)
      abonner_reseaux: 'abonner_reseaux', // nombre de personnes abonnées aux réseaux (int)
    },
    socialPost: {
      plateforme: 'plateforme',   // enum : Instagram | Twitter | LinkedIn | Facebook
      date_texte: 'date_texte',
      contenu: 'contenu',
      lien_externe: 'lien_externe',
    },
    poste: {
      Titre: 'Titre',
      Description: 'Description',
      Localisation: 'Localisation',
      Temps: 'Temps',
      Salaire: 'Salaire',
      Statut: 'Statut',
      Entreprise: 'Entreprise',
    },
    service: {
      Titre: 'Titre',
      Description: 'Description',
      tags: 'tags',
      Image: 'Image',
      Ordre: 'Ordre',
    },
    outil: {
      Nom: 'Nom',
      Image: 'Image',
      Pourcentage: 'Pourcentage',
      Vedette: 'Vedette',
      Ordre: 'Ordre',
    },
    partenaire: {
      NomDuDomaine: 'NomDuDomaine',
      Description: 'Description',
      Image: 'Image',
    },
    temoignage: {
      Citation: 'Citation',
      Auteur: 'Auteur',
      Fonction: 'Fonction',
      Entreprise: 'Entreprise',
      Note: 'Note',
      Photo: 'Photo',
    },
  },
};

export function apiUrl(path) {
  return `${CONFIG.STRAPI_URL}${path}`;
}

export async function fetchJSON(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
}