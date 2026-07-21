const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante.' });
    }

    const { lat, lng, dist, start, end, maxResults } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat et lng obligatoires.' });
    }

    const radius = parseInt(dist, 10) || 25;
    const max = parseInt(maxResults, 10) || 10000;

    let ebirdUrl;
    const baseParams = `&sppLocale=fr&includeProvisional=true&maxResults=${max}`;

    if (start && end) {
        const startDate = new Date(start.replace(/\//g, '-'));
        const endDate = new Date(end.replace(/\//g, '-'));
        const today = new Date();

        if (!isNaN(startDate) && !isNaN(endDate)) {
            const effectiveEnd = endDate > today ? today : endDate;
            // Toujours utiliser l'endpoint historic pour respecter la plage exacte
            ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/historic` +
                `?lat=${lat}&lng=${lng}&dist=${radius}` +
                `&startDate=${startDate.toISOString().split('T')[0]}` +
                `&endDate=${effectiveEnd.toISOString().split('T')[0]}` +
                baseParams;
        } else {
            // Dates invalides → fallback 14 jours via recent
            ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/recent` +
                `?lat=${lat}&lng=${lng}&dist=${radius}&back=14` +
                baseParams;
        }
    } else {
        // Pas de dates → 14 jours par défaut
        ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/recent` +
            `?lat=${lat}&lng=${lng}&dist=${radius}&back=14` +
            baseParams;
    }

    try {
        const response = await fetch(ebirdUrl, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: `Erreur eBird (${response.status}) : ${errorText}` });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: `Échec de connexion à l'API eBird : ${error.message}` });
    }
};
