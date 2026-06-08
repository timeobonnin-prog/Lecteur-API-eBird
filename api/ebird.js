const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Gestion des permissions CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Récupération de la clé API (priorité à celle entrée par l'utilisateur)
  const userKey = req.headers['x-user-ebird-key'];
  const API_KEY = userKey || process.env.EBIRD_API_KEY;

  if (!API_KEY) {
    return res.status(400).json({ error: 'Clé API eBird manquante.' });
  }

  // Paramètres de recherche (Par défaut : Indre-et-Loire, rayon de 20km, 14 jours en arrière)
  const lat = req.query.lat || '47.3941';
  const lng = req.query.lng || '0.6848';
  const dist = req.query.dist || '20';
  const back = req.query.back || '14';

  const url = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}`;

  try {
    const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
    if (!r.ok) return res.status(r.status).json({ error: `Erreur eBird : ${r.statusText}` });
    
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
