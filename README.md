<img width="1080" height="1080" alt="image" src="https://github.com/user-attachments/assets/6898c3ef-8f53-4ff2-8874-dd5ea4ed84e8" />

# eBird Search and Map

Site statique frontend plus fonction serverless pour interroger l'API eBird de façon sécurisée.

vous pouvez dempander une clé api ebird [ici](https://ebird.org/api/keygen) 

## Structure
- index.html : frontend public
- api/ebird.js : fonction serverless pour Vercel
- package.json : dépendances

## Déploiement Vercel
1. Créer un repo GitHub et pousser les fichiers.
2. Sur Vercel, New Project, connecter le repo.
3. Dans Project Settings > Environment Variables ajouter EBIRD_API_KEY avec ta clé eBird.
4. Déployer. L'endpoint sera `https://<ton-projet>.vercel.app/api/ebird`.

## Utilisation frontend
- Pour Vercel laisser `API_BASE = '/api/ebird'` dans index.html.

## Sécurité
Ne jamais mettre EBIRD_API_KEY dans le code client ou dans un repo public. Toujours stocker la clé dans les variables d'environnement de la plateforme.

## Tests locaux
- Vercel CLI : `vercel dev`
