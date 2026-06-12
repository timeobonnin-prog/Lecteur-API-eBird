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

    // Calcul du paramètre "back" (nombre de jours)
    let back = 14; // valeur par défaut
    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();
        // Limiter la date de fin à aujourd'hui
        const effectiveEnd = endDate > today ? today : endDate;
        const diffTime = effectiveEnd - startDate;
        back = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (back <= 0) back = 1;
        if (back > 30) back = 30;
    }

    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/recent` +
        `?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&sppLocale=fr&includeProvisional=true`;

    if (debug === '1') {
        return res.status(200).json({
            debug: true,
            url: ebirdUrl,
            params: { lat, lng, dist, back, start, end }
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
