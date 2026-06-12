const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Configuration des en-têtes CORS pour autoriser ton frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    // Réponse immédiate pour la requête de pré-vérification (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Récupération sécurisée de la clé eBird de l'utilisateur
    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante dans le header x-user-ebird-key.' });
    }

    const { lat, lng, dist, start, end } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Les paramètres lat et lng sont obligatoires.' });
    }

    // Calcul sécurisé du paramètre "back" (nombre de jours)
    let back = 14; 
    if (start && end) {
        // Remplacement des slashes par des tirets pour éviter les bugs de parsing de dates
        const startDate = new Date(start.replace(/\//g, '-'));
        const endDate = new Date(end.replace(/\//g, '-'));
        const today = new Date();

        if (!isNaN(startDate) && !isNaN(endDate)) {
            const effectiveEnd = endDate > today ? today : endDate;
            const diffTime = effectiveEnd - startDate;
            back = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // eBird limite le paramètre back entre 1 et 30 jours
            if (back <= 0) back = 1;
            if (back > 30) back = 30;
        }
    }

    // Construction de l'URL finale stable de l'API eBird
    const radius = parseInt(dist, 10) || 25;
    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/recent` +
        `?lat=${lat}&lng=${lng}&dist=${radius}&back=${back}&sppLocale=fr&includeProvisional=true`;

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
