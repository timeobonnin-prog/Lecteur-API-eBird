<p align="center">
  <img src="https://github.com/user-attachments/assets/6898c3ef-8f53-4ff2-8874-dd5ea4ed84e8" alt="Lecteur API eBird" width="300"/>
</p>

<p align="center">
  <strong>Exploration en temps réel des observations d'oiseaux</strong><br>
  Interface cartographique connectée à l'API eBird 2.0, protégée par CAPTCHA et hébergée sur Vercel.
</p>

<p align="center">
  <a href="https://lecteur-api-ebird.vercel.app">🌐 Site en ligne</a> •
  <a href="https://ebird.org/api/keygen">🔑 Obtenir une clé API eBird</a> •
  <a href="https://github.com/timeobonnin-prog/Lecteur-API-eBird/blob/main/LICENSE">📄 Licence</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge" alt="Apache 2.0" />
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" />
</p>

---

> [!IMPORTANT]
> **Ce projet nécessite une clé API eBird** pour fonctionner. Obtenez-la gratuitement [ici](https://ebird.org/api/keygen).

> [!WARNING]
> L'utilisation de l'API eBird est soumise à leurs [conditions d'utilisation](https://www.birds.cornell.edu/home/terms-of-use/). Respectez les limites de requêtes.

---

## 📖 Présentation

**Lecteur API eBird** est une application web moderne qui permet d'explorer les observations d'oiseaux en temps réel via l'API eBird 2.0. Elle offre une interface cartographique interactive, une authentification sécurisée, une protection anti-bots (hCaptcha) et de nombreuses options de personnalisation.

> [!NOTE]
> L'application est entièrement responsive et s'adapte aux écrans mobiles et desktop.

---

## ✨ Fonctionnalités clés

- 🔐 **Authentification sécurisée** – Saisie unique de la clé API eBird, vérifiée côté serveur, stockée localement (auto-connexion).
- 🤖 **Protection anti-bots** – CAPTCHA hCaptcha obligatoire à la première utilisation.
- 🗺️ **Carte interactive** – Zoom, centrage automatique sur votre position, recherche de lieu par nom (géocodage avec suggestions).
- 🐦 **Checklists complètes** – Affichage de toutes les espèces d'une checklist (y compris les observations > 30 jours).
- 📷 **Photos des espèces** – Visualisation des photos via Macaulay Library (proxy CORS) + fallback iNaturalist.
- 🔍 **Recherche par espèce** – Autocomplétion des noms français grâce à la taxonomie eBird, résultats filtrés par distance.
- 🚀 **Mise à jour automatique** – Enrichissement des checklists en arrière-plan (gestion intelligente des limites de taux API).
- 🎨 **Thèmes multiples** – Mode sombre / clair, fonds de carte variés (clair, satellite, topographique).
- 📤 **Export des données** – Export en CSV, TXT ou JSON avec les colonnes officielles eBird.
- 📱 **Responsive** – Interface adaptée aux mobiles avec un panneau escamotable.

---

## 📊 Avancement du projet

- 🔐 Authentification et sécurité – ✅ 100%
- 🗺️ Carte interactive (Leaflet) – ✅ 100%
- 🐦 Intégration API eBird – ✅ 100%
- 📷 Photos des espèces – ✅ 100%
- 🔍 Recherche et géocodage – ✅ 100%
- 🎨 Thèmes et personnalisation – ✅ 100%
- 📤 Export de données – ✅ 100%
- 📱 Responsive – ✅ 100%
- 🚀 Mise à jour automatique – ✅ 100%
- 📄 Documentation – 🟡 80%

---

## 🚀 Installation locale

### Prérequis
- [Node.js](https://nodejs.org/) (v16 ou supérieur)

### Installation

```bash
git clone https://github.com/timeobonnin-prog/Lecteur-API-eBird.git
cd Lecteur-API-eBird
npm install
npm run dev
