// api/ebird.js  (Vercel / Netlify compatible)
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const API_KEY = process.env.EBIRD_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'EBIRD_API_KEY not set on server' });
  }

  // CORS pour le frontend public
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query.q;
  const speciesCode = req.query.speciesCode;
  try {
    if (q) {
      // Recherche taxonomie (query by name)
      const url = `https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=en&query=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      return res.json(data);
    }

    if (speciesCode) {
      // Observations récentes autour d'un point
      const lat = req.query.lat || '48.8566'; // fallback Paris
      const lng = req.query.lng || '2.3522';
      const dist = req.query.dist || '50'; // km
      const back = req.query.back || '30'; // jours
      const maxResults = req.query.maxResults || '500';
      const url = `https://api.ebird.org/v2/data/obs/geo/recent/${encodeURIComponent(speciesCode)}?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&maxResults=${maxResults}`;
      const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      return res.json(data);
    }

    return res.status(400).json({ error: 'missing query parameter q or speciesCode' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
