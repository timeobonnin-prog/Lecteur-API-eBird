const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Configuration des entêtes de sécurité pour autoriser les requêtes du navigateur
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extraction de la clé API fournie en direct par l'utilisateur
  const userKey = req.headers['x-user-ebird-key'];
  const API_KEY = userKey || process.env.EBIRD_API_KEY;

  if (!API_KEY) {
    return res.status(400).json({ error: 'Clé API eBird manquante pour l\'initialisation.' });
  }

  // Récupération des filtres géographiques (Coordonnées par défaut fixées en Indre-et-Loire)
  const lat = req.query.lat || '47.3941';
  const lng = req.query.lng || '0.6848';
  const dist = req.query.dist || '25';
  const back = req.query.back || '14';
  
  // Le paramètre crucial : force l'envoi des noms d'oiseaux en langue française
  const sppLocale = 'fr'; 

  const url = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&sppLocale=${sppLocale}`;

  try {
    const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
    if (!r.ok) return res.status(r.status).json({ error: `Erreur eBird Code ${r.status}` });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
