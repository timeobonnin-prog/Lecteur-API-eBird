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
    const max = parseInt(maxResults, 10) || 10000; // valeur haute pour tout récupérer

    let ebirdUrl;
    const baseParams = `&sppLocale=fr&includeProvisional=true&maxResults=${max}`;

    if (start && end) {
        const startDate = new Date(start.replace(/\//g, '-'));
        const endDate = new Date(end.replace(/\//g, '-'));
        const today = new Date();

        if (!isNaN(startDate) && !isNaN(endDate)) {
            const effectiveEnd = endDate > today ? today : endDate;
            const diffTime = effectiveEnd - startDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Si la période dépasse 30 jours, on passe en mode "historic"
            if (diffDays > 30) {
                ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/historic` +
                    `?lat=${lat}&lng=${lng}&dist=${radius}` +
                    `&startDate=${startDate.toISOString().split('T')[0]}` +
                    `&endDate=${effectiveEnd.toISOString().split('T')[0]}` +
                    baseParams;
            } else {
                // Période ≤ 30 jours → endpoint "recent" avec back
                let back = diffDays;
                if (back <= 0) back = 1;
                ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/recent` +
                    `?lat=${lat}&lng=${lng}&dist=${radius}&back=${back}` +
                    baseParams;
            }
        } else {
            // Dates invalides, on met une valeur par défaut (14 jours)
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
