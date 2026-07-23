const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé manquante' });

    const { lat, lng, dist, back } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat/lng requis' });

    const radius = parseInt(dist, 10) || 25;
    const days = parseInt(back, 10) || 14;

    const url = `https://api.ebird.org/v2/data/obs/geo/recent/notable?lat=${lat}&lng=${lng}&dist=${radius}&back=${days}&sppLocale=fr&maxResults=500`;
    try {
        const response = await fetch(url, { headers: { 'X-eBirdApiToken': apiKey } });
        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: text });
        }
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
