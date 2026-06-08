const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const userKey = req.headers['x-user-ebird-key'];
  const API_KEY = userKey || process.env.EBIRD_API_KEY;

  if (!API_KEY) return res.status(400).json({ error: 'Clé API manquante' });

  const { speciesCode, lat, lng, dist, back } = req.query;
  const url = `https://api.ebird.org/v2/data/obs/geo/recent/${speciesCode || ''}?lat=${lat || '47.39'}&lng=${lng || '0.68'}&dist=${dist || '20'}&back=${back || '30'}`;

  try {
    const r = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
