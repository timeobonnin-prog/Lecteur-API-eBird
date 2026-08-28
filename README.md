<p align="center"> <img src="https://github.com/user-attachments/assets/6898c3ef-8f53-4ff2-8874-dd5ea4ed84e8" alt="Lecteur API eBird" width="300"/> </p> <h1 align="center">Lecteur API eBird</h1> <p align="center"> <strong>Explorez les observations d'oiseaux en temps réel</strong><br> Une interface cartographique libre connectée à l'API eBird 2.0 pour explorer la biodiversité autour de vous. </p> <p align="center"> <a href="https://lecteur-api-ebird.vercel.app">🌐 Site en ligne</a> • <a href="https://github.com/timeobonnin-prog/Lecteur-API-eBird">💻 Code source</a> • <a href="https://ebird.org/api/keygen">🔑 Obtenir une clé API</a> • <a href="https://github.com/timeobonnin-prog/Lecteur-API-eBird/blob/main/LICENSE">📄 Licence</a> </p> <p align="center"> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" /> <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" /> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" /> <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" /> <img src="https://img.shields.io/badge/eBird%20API-2.0-4CAF50?style=for-the-badge" alt="eBird API 2.0" /> <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /> <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" /> <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" /> </p>

[!IMPORTANT]
Une clé API eBird est nécessaire pour utiliser l'application.
Vous pouvez obtenir gratuitement une clé API depuis la page officielle eBird
.

[!WARNING]
L'utilisation de l'API eBird est soumise à leurs conditions d'utilisation
. Veillez à respecter leurs limites de requêtes et leurs conditions d'utilisation.

📖 Présentation

Lecteur API eBird est une application web libre permettant d'explorer les observations d'oiseaux disponibles via l'API eBird 2.0.

L'application propose une interface cartographique interactive permettant de rechercher des observations autour d'un lieu, de filtrer les résultats par espèce et de consulter les checklists disponibles.

L'objectif est de proposer une expérience simple et accessible pour découvrir la biodiversité locale, tout en permettant aux utilisateurs plus avancés d'exporter leurs données pour les analyser.

[!NOTE]
L'application est entièrement responsive et fonctionne aussi bien sur ordinateur que sur smartphone.

✨ Fonctionnalités principales
🗺️ Carte interactive
Navigation libre sur la carte.
Centrage automatique sur votre position.
Plusieurs fonds de carte disponibles :
🌙 Sombre
☀️ Clair
🛰️ Satellite
🗻 Topographique
Affichage des observations directement sur la carte.
Exploration des observations autour d'une zone géographique.
🐦 Recherche par espèce
Recherche d'oiseaux par nom.
Autocomplétion basée sur la taxonomie eBird.
Prise en charge des noms français.
Filtrage des observations selon la distance.
Consultation des checklists associées aux observations.
📍 Recherche de lieu
Recherche d'un lieu partout dans le monde.
Autocomplétion géographique.
Suggestions lors de la saisie.
Centrage automatique de la carte sur le lieu sélectionné.
📋 Checklists détaillées
Consultation des checklists eBird.
Affichage de l'ensemble des espèces observées.
Accès aux informations détaillées des observations.
Prise en compte des checklists anciennes.
Enrichissement progressif des données en arrière-plan.
📷 Photos des espèces

Les espèces peuvent être accompagnées de photographies provenant notamment de :

Macaulay Library
iNaturalist en solution de secours

Un système de proxy permet de gérer les problématiques liées au CORS.

📤 Export des données

Les observations peuvent être exportées dans plusieurs formats :

📊 CSV
📝 TXT
🔧 JSON

Les exports utilisent les colonnes correspondant au standard des données eBird afin de faciliter leur réutilisation et leur analyse.

🔐 Sécurité & confidentialité
Validation de la clé API.
Protection CAPTCHA à la première utilisation.
La clé API n'est pas stockée sur un serveur.
Conservation locale des préférences nécessaires au fonctionnement de l'application.
Gestion des requêtes API côté application.
🎨 Personnalisation
🌙 Mode sombre.
☀️ Mode clair.
🗺️ Plusieurs styles de cartes.
Interface pensée pour s'adapter aux préférences de l'utilisateur.
📱 Responsive

L'interface est conçue pour fonctionner sur :

💻 Ordinateur
💊 Tablette
📱 Smartphone

Sur mobile, le panneau d'observation peut être escamoté afin de laisser davantage de place à la carte.

🔄 Fonctionnement

Le fonctionnement général de l'application est le suivant :

Utilisateur
    │
    ▼
🔐 Clé API + CAPTCHA
    │
    ▼
🗺️ Sélection d'une zone
    │
    ├── 📍 Recherche de lieu
    │
    └── 🐦 Recherche d'espèce
    │
    ▼
🌐 API eBird 2.0
    │
    ▼
📋 Checklists & observations
    │
    ├── 📷 Photos
    ├── 🐦 Espèces
    └── 📍 Localisation
    │
    ▼
📤 Export CSV / TXT / JSON

📊 Avancement du projet
Fonctionnalité	État
🔐 Authentification / clé API	✅ 100%
🤖 Protection CAPTCHA	✅ 100%
🗺️ Carte interactive	✅ 100%
🐦 Intégration API eBird	✅ 100%
📋 Checklists	✅ 100%
📷 Photos des espèces	✅ 100%
🔍 Recherche par espèce	✅ 100%
📍 Recherche de lieu	✅ 100%
🎨 Thèmes et cartes	✅ 100%
📤 Export des données	✅ 100%
📱 Responsive	✅ 100%
🚀 Mise à jour automatique	✅ 100%
📚 Documentation	🟡 80%
🚀 Utilisation
1. Obtenir une clé API eBird

Rendez-vous sur la page officielle de génération de clé API :

👉 https://ebird.org/api/keygen

L'inscription et l'obtention d'une clé sont gratuites.

2. Accéder à l'application

Ouvrez le lecteur eBird :

👉 https://lecteur-api-ebird.vercel.app

3. Entrer votre clé API

Collez votre clé API eBird dans le champ prévu à cet effet.

4. Valider le CAPTCHA

Résolvez le CAPTCHA afin d'accéder à l'application.

5. Explorer les observations

Vous pouvez ensuite :

rechercher un lieu ;
utiliser votre position ;
naviguer sur la carte ;
rechercher une espèce ;
consulter les checklists ;
visualiser les photos ;
exporter les observations.
💻 Installation locale
Prérequis
Node.js
 v16 ou supérieur
Une clé API eBird
Git
Cloner le projet
git clone https://github.com/timeobonnin-prog/Lecteur-API-eBird.git
cd Lecteur-API-eBird

Installer les dépendances
npm install

Lancer le serveur de développement
npm run dev


L'application sera ensuite accessible depuis l'adresse locale indiquée par Vite.

🛠️ Technologies utilisées
Front-end
JavaScript
HTML5
CSS3
Leaflet
APIs & services
eBird API 2.0 — données ornithologiques
Macaulay Library — photographies
iNaturalist — solution de secours pour les photographies
hCaptcha — protection anti-bots
Hébergement
Vercel
🌐 Ressources
🌐 Application en ligne
💻 Dépôt GitHub
🔑 Obtenir une clé API eBird
📚 Documentation de l'API eBird
🐦 eBird
📷 Macaulay Library
🌱 iNaturalist
🔒 Confidentialité

La clé API fournie par l'utilisateur n'est pas enregistrée dans une base de données du projet.

Les préférences nécessaires au fonctionnement de l'application sont conservées localement dans le navigateur.

L'application utilise également un système CAPTCHA afin de limiter les utilisations automatisées et abusives.

⚠️ Limites de l'API

L'application dépend directement des services eBird. Les performances et la disponibilité des données peuvent donc dépendre :

des limites de requêtes imposées par eBird ;
de la disponibilité de l'API ;
de la quantité de données demandées ;
de la disponibilité des photographies.

[!TIP]
Si vous rencontrez une erreur liée à l'API, vérifiez en premier lieu que votre clé eBird est valide et que vous n'avez pas dépassé les limites de requêtes.

🤝 Contribution

Les contributions sont les bienvenues !

Pour proposer une amélioration :

# Forkez le projet

# Clonez votre fork
git clone https://github.com/VOTRE-UTILISATEUR/Lecteur-API-eBird.git

# Créez une branche
git checkout -b feature/ma-fonctionnalite

# Effectuez vos modifications

# Committez
git commit -m "Ajout de ma fonctionnalité"

# Poussez votre branche
git push origin feature/ma-fonctionnalite


Vous pouvez ensuite ouvrir une Pull Request sur GitHub.

📄 Licence

Ce projet est distribué sous licence MIT.

Vous êtes libre de :

utiliser le projet ;
modifier le code ;
redistribuer le projet ;
l'utiliser à des fins personnelles ou commerciales.

Consultez le fichier LICENSE pour plus d'informations.

👨‍💻 Auteur

Timéo Bonnin

Projet open source développé avec pour objectif de rendre l'exploration des observations eBird plus simple, accessible et agréable.

<p align="center"> 🐦 <strong>Lecteur API eBird</strong> — Explorez la biodiversité autour de vous. </p> <p align="center"> Fait avec ❤️ par <strong>Timéo Bonnin</strong> </p>
