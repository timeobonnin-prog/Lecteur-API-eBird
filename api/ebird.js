// api/ebird.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { lat, lng, dist, start, end, debug } = req.query;

    // Mode debug : renvoie l'URL sans clé
    if (debug === '1') {
        let startDate = start, endDate = end;
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        if (!start || !end) {
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0];
            endDate = yesterday.toISOString().split('T')[0];
        } else {
            // Si la date de fin est aujourd'hui ou plus tard, on la ramène à hier
            if (new Date(end).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)) {
                endDate = yesterday.toISOString().split('T')[0];
            }
        }
        const startPath = startDate.replace(/-/g, '/');
        const endPath   = endDate.replace(/-/g, '/');
        const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
            `?lat=${lat}&lng=${lng}&dist=${dist}&includeProvisional=true`;

        return res.status(200).json({
            debug: true,
            url: ebirdUrl,
            params: { lat, lng, dist, startDate, endDate, rawStart: start, rawEnd: end }
        });
    }

    // Mode normal
    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante.' });
    }

    let startDate = start, endDate = end;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (!start || !end) {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
    } else {
        // Comparer les dates sans l'heure
        if (new Date(end).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)) {
            endDate = yesterday.toISOString().split('T')[0];
        }
    }

    const startPath = startDate.replace(/-/g, '/');
    const endPath   = endDate.replace(/-/g, '/');
    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
        `?lat=${lat}&lng=${lng}&dist=${dist}&includeProvisional=true`;

    try {
        const response = await fetch(ebirdUrl, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: `Erreur eBird (${response.status}) : ${errorText}`,
                debugHint: 'Ajoutez &debug=1 à l\'URL pour voir l\'URL utilisée.'
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
