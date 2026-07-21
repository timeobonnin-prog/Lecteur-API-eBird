const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante dans le header x-user-ebird-key.' });
    }

    const { lat, lng, dist, start, end, maxResults } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Les paramètres lat et lng sont obligatoires.' });
    }

    const radius = parseInt(dist, 10) || 25;
    const max = parseInt(maxResults, 10) || 10000; // 🔥 on garde une valeur haute

    let back = 30; // par défaut 30 jours
    if (start && end) {
        const startDate = new Date(start.replace(/\//g, '-'));
        const endDate = new Date(end.replace(/\//g, '-'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(startDate) && !isNaN(endDate)) {
            // Calcule le nombre de jours entre aujourd'hui et la date de début
            const diffTime = today - startDate;
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) diffDays = 0;
            back = Math.min(30, diffDays + 1); // +1 pour inclure le jour même
            if (back < 1) back = 1;
        }
    }

    const ebirdUrl =
        `https://api.ebird.org/v2/data/obs/geo/recent` +
        `?lat=${lat}&lng=${lng}&dist=${radius}&back=${back}` +
        `&sppLocale=fr&includeProvisional=true&maxResults=${max}`;

    try {
        const response = await fetch(ebirdUrl, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: `Erreur eBird (${response.status}) : ${errorText}`
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({
            error: `Échec de connexion à l'API eBird : ${error.message}`
        });
    }
};
