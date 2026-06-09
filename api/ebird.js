const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userKey = req.headers['x-user-ebird-key'];
  const API_KEY = userKey || process.env.EBIRD_API_KEY;

  if (!API_KEY) {
    return res.status(400).json({ error: 'Clé API introuvable.' });
  }

  const lat = req.query.lat || '47.3941';
  const lng = req.query.lng || '0.6848';
  const dist = req.query.dist || '25';
  const back = req.query.back || '14';
  
  // NOUVEAU : Récupération du code de l'espèce si le ciblage profond est activé
  const speciesCode = req.query.species || '';
  let url = '';

  // S'il y a un code d'espèce, on demande au satellite eBird TOUTES les observations de cette espèce
  if (speciesCode) {
    url = `https://api.ebird.org/v2/data/obs/geo/recent/${speciesCode}?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&sppLocale=fr`;
  } else {
  // Sinon, on demande le scan global classique (la dernière observation de chaque espèce)
    url = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&sppLocale=fr`;
  }

  try {
    const response = await fetch(url, { headers: { 'x-ebirdapitoken': API_KEY } });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Erreur eBird (${response.status}): ${errorText}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: `Erreur serveur : ${err.message}` });
  }
};
