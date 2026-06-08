// api/ebird.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Récupère la clé : priorité à la clé utilisateur envoyée dans l'en-tête
    const userKey = req.headers['x-user-ebird-key'];
    const serverKey = process.env.EBIRD_API_KEY;
    const API_KEY = (userKey && userKey.trim()) ? userKey.trim() : serverKey;

    if (!API_KEY) {
      return res.status(400).json({ error: 'No eBird API key provided (server or user).' });
    }

    // Ne jamais logger la clé
    // Construire l'URL selon les paramètres
    const q = req.query.q;
    const speciesCode = req.query.speciesCode;

    if (q) {
      const url = `https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=en&query=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      res.setHeader('Cache-Control','s-maxage=60'); // court cache
      return res.json(data);
    }

    if (speciesCode) {
      const lat = req.query.lat || '48.8566';
      const lng = req.query.lng || '2.3522';
      const dist = req.query.dist || '50';
      const back = req.query.back || '30';
      const maxResults = req.query.maxResults || '500';
      const url = `https://api.ebird.org/v2/data/obs/geo/recent/${encodeURIComponent(speciesCode)}?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&maxResults=${maxResults}`;
      const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      res.setHeader('Cache-Control','s-maxage=60');
      return res.json(data);
    }

    return res.status(400).json({ error: 'missing query parameter q or speciesCode' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
