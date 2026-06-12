// api/ebird.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante.' });
    }

    const { lat, lng, dist, start, end, debug } = req.query;

    // Dates par défaut : 30 derniers jours
    let startDate = start, endDate = end;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (!start || !end) {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
    } else {
        if (new Date(end).setHours(0,0,0,0) >= today.setHours(0,0,0,0)) {
            endDate = yesterday.toISOString().split('T')[0];
        }
    }

    // Endpoint historique avec dates dans l'URL
    const startPath = startDate.replace(/-/g, '/');
    const endPath   = endDate.replace(/-/g, '/');
    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/historic/${startPath}/${endPath}` +
        `?lat=${lat}&lng=${lng}&dist=${dist}`;

    if (debug === '1') {
        return res.status(200).json({
            debug: true,
            url: ebirdUrl,
            params: { lat, lng, dist, startDate, endDate, rawStart: start, rawEnd: end }
        });
    }

    try {
        const response = await fetch(ebirdUrl, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: `Erreur eBird (${response.status}) : ${errorText}`,
                debugHint: 'Ajoutez &debug=1 pour voir l\'URL.'
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            error: `Échec de la connexion à l'API eBird : ${error.message}`
        });
    }
};
