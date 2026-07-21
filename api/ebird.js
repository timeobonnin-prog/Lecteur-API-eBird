const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé API eBird manquante.' });

    const { lat, lng, dist, start } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat et lng obligatoires.' });

    const radius = parseInt(dist, 10) || 25;
    const maxResults = 10000;  // Fixé à 10000 pour être sûr

    let back = 30;
    if (start) {
        const startDate = new Date(start.replace(/\//g, '-'));
        const today = new Date(); today.setHours(0,0,0,0);
        if (!isNaN(startDate)) {
            const diffDays = Math.ceil((today - startDate) / 86400000) + 1;
            back = Math.max(1, Math.min(30, diffDays));
        }
    }

    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${radius}&back=${back}&sppLocale=fr&includeProvisional=true&maxResults=${maxResults}`;

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
