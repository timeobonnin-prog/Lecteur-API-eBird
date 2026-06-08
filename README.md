# eBird Search and Map

Site statique frontend plus fonction serverless pour interroger l'API eBird de façon sécurisée.

## Structure
- index.html : frontend public
- api/ebird.js : fonction serverless pour Vercel
- netlify/functions/ebird.js : fonction serverless pour Netlify
- package.json : dépendances

## Déploiement Vercel
1. Créer un repo GitHub et pousser les fichiers.
2. Sur Vercel, New Project, connecter le repo.
3. Dans Project Settings > Environment Variables ajouter EBIRD_API_KEY avec ta clé eBird.
4. Déployer. L'endpoint sera `https://<ton-projet>.vercel.app/api/ebird`.

## Déploiement Netlify
1. Créer un repo GitHub et pousser les fichiers.
2. Sur Netlify, New site from Git, connecter le repo.
3. Dans Site settings > Build & deploy > Environment ajouter EBIRD_API_KEY.
4. Déployer. L'endpoint sera `https://<ton-site>/.netlify/functions/ebird`.

## Utilisation frontend
- Pour Vercel laisser `API_BASE = '/api/ebird'` dans index.html.
- Pour Netlify remplacer `API_BASE = '/.netlify/functions/ebird'` dans index.html.

## Sécurité
Ne jamais mettre EBIRD_API_KEY dans le code client ou dans un repo public. Toujours stocker la clé dans les variables d'environnement de la plateforme.

## Tests locaux
- Vercel CLI : `vercel dev`
- Netlify CLI : `netlify dev`
