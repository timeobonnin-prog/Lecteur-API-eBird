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

    const { lat, lng, dist, start, end } = req.query;

    // Dates par défaut : 30 derniers jours, mais fin au plus hier
    let startDate = start, endDate = end;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (!start || !end) {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0]; // hier au lieu d’aujourd’hui
    } else {
        // Si la date de fin est aujourd’hui ou dans le futur, on la limite à hier
        const providedEnd = new Date(end);
        if (providedEnd >= today) {
            endDate = yesterday.toISOString().split('T')[0];
        }
    }

    // Format YYYY/MM/DD pour l'URL eBird
    const startPath = startDate.replace(/-/g, '/');
    const endPath   = endDate.replace(/-/g, '/');

    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
        `?lat=${lat}&lng=${lng}&dist=${dist}&sppLocale=fr&includeProvisional=true`;

    console.log('eBird URL:', ebirdUrl); // visible dans les logs Vercel

    try {
        const response = await fetch(ebirdUrl, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('eBird error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Erreur eBird (${response.status}) : ${errorText}`
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Fetch error:', error);
        return res.status(500).json({
            error: `Échec de la connexion à l'API eBird : ${error.message}`
        });
    }
};
