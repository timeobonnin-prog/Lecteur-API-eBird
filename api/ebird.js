const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Entêtes de sécurité indispensables pour autoriser les requêtes mobiles et navigateurs
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

  // Gestion du protocole de vérification OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Récupération de la clé API envoyée par le téléphone
  const userKey = req.headers['x-user-ebird-key'];
  const API_KEY = userKey || process.env.EBIRD_API_KEY;

  if (!API_KEY) {
    return res.status(400).json({ error: 'Clé API eBird introuvable. Saisis-la dans le champ du radar.' });
  }

  // Coordonnées géographiques et temporelles de ciblage
  const lat = req.query.lat || '47.3941';
  const lng = req.query.lng || '0.6848';
  const dist = req.query.dist || '25';
  const back = req.query.back || '14'; // Reçoit la valeur de jours déjà calculée par le front-end

  // URL eBird officielle avec traduction française activée (sppLocale=fr)
  const url = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&sppLocale=fr`;

  try {
    const response = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Erreur eBird (${response.status}): ${errorText}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: `Erreur interne du serveur Vercel : ${err.message}` });
  }
};
