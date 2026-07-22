const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé API eBird manquante.' });

    const { lat, lng, code, back, maxResults } = req.query;
    if (!lat || !lng || !code) return res.status(400).json({ error: 'lat, lng et code obligatoires.' });

    const backDays = parseInt(back, 10) || 14;
    const max = parseInt(maxResults, 10) || 2000;  // valeur suffisante pour un filtrage local

    const ebirdUrl =
        `https://api.ebird.org/v2/data/nearest/geo/recent/${code}` +
        `?lat=${lat}&lng=${lng}&back=${backDays}&maxResults=${max}&sppLocale=fr`;

    try {
        const response = await fetch(ebirdUrl, { headers: { 'X-eBirdApiToken': apiKey } });
        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `eBird ${response.status}: ${text}` });
        }
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
