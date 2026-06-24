# Actions manuelles requises — Ripoll Darcia

## P3 — Renseigner les credentials Cloudinary dans Railway

**Pourquoi :** Les variables `CLOUDINARY_NAME`, `CLOUDINARY_KEY` et `CLOUDINARY_SECRET` sont vides
dans le `.env` local et probablement absentes du panel Railway. Sans elles, tout upload d'image
dans le panel Strapi échoue avec une erreur 401 Cloudinary.

**Où :** Panel Railway → projet `ripolldarcia-backend` → onglet **Variables**

**Quoi ajouter :**
| Variable | Valeur |
|----------|--------|
| `CLOUDINARY_NAME` | *(cloud name de votre compte Cloudinary)* |
| `CLOUDINARY_KEY` | *(API key Cloudinary)* |
| `CLOUDINARY_SECRET` | *(API secret Cloudinary)* |

**Comment obtenir ces valeurs :**
1. Se connecter sur https://cloudinary.com/console
2. Copier les 3 valeurs affichées sur le dashboard d'accueil

**Après avoir renseigné les variables :** redémarrer le service Railway pour que Strapi
les prenne en compte.

---

## Autres placeholders à compléter par le client

- `[VILLE, PAYS — À CONFIRMER]` dans `index.html` section Contact : remplacer par la vraie ville
- Témoignages dans la section Partenaires : remplacer les 3 placeholders `[Témoignage — À COMPLÉTER]`
- Logos partenaires `[À COMPLÉTER]` dans la bande défilante
- Facebook / Twitter / Instagram de Ripoll Darcia : URLs à renseigner dans `index.html` et dans le CMS Strapi (apropo → Facebook, Twitter, Instagram)
- Image Open Graph `og-cover.jpg` : déposer une image dans `assets/image/og-cover.jpg` (1200×630px recommandé)
- Statistiques blog.html (48 articles, 12k abonnés) : à valider ou corriger par le client
