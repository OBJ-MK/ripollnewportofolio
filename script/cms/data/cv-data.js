/* data/cv-data.js
 * Role: contenu brut du CV de Ripoll Darcia Bissambou, séparé de la logique
 * de génération PDF/Word — modifiable sans toucher au code.
 */

export const CV_DATA = {
  nom: 'Ripoll Darcia Bissambou',
  contact: {
    localisation: 'Pointe-Noire, Congo',
    telephone: '+242 06 786 92 31',
    email: 'ripollbis@gmail.com',
    linkedin: '@ripolldarcia',
    portfolio: 'http://ripolldarcia.netlify.app',
  },
  formation: [
    {
      periode: '2017-2019',
      titre: 'Licence en Journalisme et Communication',
      etablissement:
        "Université Catholique de l'Afrique de l'Ouest — Unité Universitaire à Bamako (UCAO-UUBa)",
    },
  ],
  experiences: [
    {
      poste: 'Community Manager / Stratège de Contenus Web',
      entreprise: 'Mamy-Délices, Pâtisserie-Glacier, Bamako',
      periode: '2022-2025',
      taches: [
        'Élaboration et mise en œuvre de la stratégie de contenus digitaux',
        'Gestion des plateformes : Facebook, Instagram, Tik-Tok et Site E-commerce',
        'Production de contenus promotionnels orientés vers la visibilité et la conversion',
        'Analyse des performances et optimisation continue des campagnes',
        "Renforcement de l'image de marque et de la présence digitale",
        'Reporting des résultats obtenus : forces et faiblesses',
      ],
    },
    {
      poste: 'Community Manager / Freelance',
      entreprise: 'LeMarchand, Supermarché, Bamako',
      periode: '2024-2025',
      taches: [
        'Animation des communautés Facebook, Instagram et Tik-Tok',
        'Création de contenus produits et campagnes promotionnelles',
      ],
    },
    {
      poste: 'Community Manager & Journaliste Institutionnel',
      entreprise: 'DFA-Communication, Bamako',
      periode: '2021-2022',
      taches: [
        'Gestion des réseaux sociaux du Conseil National du Patronat du Mali (CNPM)',
        'Mise en place de stratégies éditoriales institutionnelles',
        'Rédaction de newsletters institutionnelles',
        "Réalisation de reportages pour des clients grands comptes : Orange Mali, Fondation Orange, CNPM, Banque Malienne de Solidarité et Mouvement Benkan",
      ],
    },
    {
      poste: 'Journaliste & Responsable Réseaux Sociaux',
      entreprise: "RUE14 ML, Plateforme d'informations générales, Bamako",
      periode: '2021-2022',
      taches: [
        "Recueil, traitement et diffusion de l'information",
        'Gestion des réseaux sociaux de la plateforme',
        'Tournage et réalisation de reportages audiovisuels',
      ],
    },
    {
      poste: 'Journaliste Web',
      entreprise: "Afribone, Fournisseur d'accès internet, Bamako",
      periode: '2019-2020',
      taches: [
        "Rédaction d'articles web, dossiers et interviews",
        "Participation à l'élaboration du plan de communication médias",
        'Diffusion et valorisation des contenus en ligne',
      ],
    },
  ],
  competences: [
    'Stratégie de contenus digitaux (réseaux sociaux & web)',
    'Community management et gestion de communautés',
    'Rédaction web, storytelling et journalisme digital',
    'Création de contenus visuels et vidéos',
    'Analyse de performance & reporting social media',
  ],
  outils: [
    'Canva, Photoshop',
    'Adobe Premiere Pro, CapCut',
    'Meta Business Suite',
    'Metricool, Brand24, Mention',
    'ChatGPT, Gemini (IA générative)',
    'Audacity, Adobe Audition',
  ],
  certifications: [
    {
      annee: '2023',
      type: 'Certificat',
      titre: "Créer une campagne d'emailing",
      organisme: 'Trace Academia / Grow With Google',
    },
    {
      annee: '2023',
      type: 'Certificat',
      titre: 'Storytelling',
      organisme: 'Trace Academia / UNESCO',
    },
    {
      annee: '2019',
      type: 'Formation',
      titre: "Gouvernance de l'Internet au Mali",
      organisme: "Forum sur la Gouvernance de l'Internet (FGI)",
    },
  ],
  qualites: [
    "Créativité et sens de l'innovation",
    'Organisation et rigueur',
    "Esprit d'équipe et adaptabilité",
    'Aisance communicationnelle',
  ],
  references: [
    {
      nom: 'Dr Thérèse Samaké',
      role: 'Directrice académique, UCAO-UUBa',
      contact: '(+223) 76 05 49 57',
    },
    {
      nom: 'Dr Alexis Dembélé',
      role: 'Doyen Faculté J/Co, UCAO-UUBa',
      contact: '(+223) 70 22 29 98 · zufodembele@gmail.com',
    },
  ],
};

/* Profils d'orientation : chaque profil définit l'entête (headline),
 * l'accroche ("À propos") et l'ordre de mise en avant des compétences en
 * fonction de l'intitulé du poste cliqué. Le matching se fait par mot-clé
 * insensible à la casse sur poste.Titre — pas besoin d'un champ dédié
 * côté Strapi, ça fonctionne avec les intitulés déjà en place.
 */
const CV_PROFILES = [
  {
    match: /r[ée]dac|[ée]ditorial/i,
    headline: 'Rédaction en Chef & Stratégie Éditoriale',
    accroche:
      "Journaliste de formation avec plus de 5 ans d'expérience dans le pilotage de lignes éditoriales et la production de contenus à forte valeur ajoutée pour des marques et institutions. Une expertise reconnue en structuration éditoriale, rédaction et coordination de contenus.",
    prioritaires: [
      'Rédaction web, storytelling et journalisme digital',
      'Stratégie de contenus digitaux (réseaux sociaux & web)',
      'Analyse de performance & reporting social media',
    ],
  },
  {
    match: /community/i,
    headline: 'Community Manager & Stratège de Contenus Digitaux',
    accroche:
      "Plus de 5 ans d'expérience dans la gestion de communautés et le pilotage de stratégies de contenus digitaux pour des marques et institutions. Une expertise complète en animation de communautés, création de contenus et croissance organique de l'audience.",
    prioritaires: [
      'Community management et gestion de communautés',
      'Stratégie de contenus digitaux (réseaux sociaux & web)',
      'Création de contenus visuels et vidéos',
    ],
  },
  {
    match: /social media/i,
    headline: 'Social Media Manager & Stratège de Contenus',
    accroche:
      "Spécialiste de la stratégie social media avec plus de 5 ans d'expérience dans le pilotage de campagnes digitales et l'analyse de performance pour des marques et institutions.",
    prioritaires: [
      'Stratégie de contenus digitaux (réseaux sociaux & web)',
      'Analyse de performance & reporting social media',
      'Community management et gestion de communautés',
    ],
  },
  {
    match: /journalis/i,
    headline: 'Journaliste & Communicant Digital',
    accroche:
      "Diplômé en journalisme et communication avec plus de 5 ans d'expérience dans le traitement et la diffusion de l'information, la rédaction web et la réalisation de reportages.",
    prioritaires: [
      'Rédaction web, storytelling et journalisme digital',
      'Création de contenus visuels et vidéos',
      'Stratégie de contenus digitaux (réseaux sociaux & web)',
    ],
  },
  {
    match: /graphis|design.?visuel|graphic/i,
    headline: 'Graphiste & Créateur de Contenus Visuels',
    accroche:
      "Créateur de contenus visuels avec plus de 5 ans d'expérience dans la conception graphique et la production de contenus pour des marques et institutions, au service d'une identité visuelle forte et cohérente.",
    prioritaires: [
      'Création de contenus visuels et vidéos',
      'Stratégie de contenus digitaux (réseaux sociaux & web)',
      'Rédaction web, storytelling et journalisme digital',
    ],
  },
];

const DEFAULT_PROFILE = {
  headline: 'Chargé de Communication Digitale & Médias',
  accroche:
    "Plus de 5 ans d'expérience dans la création et le pilotage de stratégies de contenus digitaux pour des marques et institutions. Une expertise complète en communication digitale & médias, community management, création de contenus et performances web.",
  prioritaires: [],
};

export function getCvProfile(titrePoste) {
  const found = CV_PROFILES.find((p) => p.match.test(titrePoste || ''));
  return found || DEFAULT_PROFILE;
}

/* Réordonne les compétences pour mettre en tête celles du profil
 * sélectionné, sans dupliquer ni perdre les autres. */
export function getCompetencesOrdonnees(profile) {
  const { competences } = CV_DATA;
  if (!profile.prioritaires.length) return competences;
  const reste = competences.filter((c) => !profile.prioritaires.includes(c));
  return [...profile.prioritaires, ...reste];
}