// api/ebird.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Récupération de la clé envoyée par le frontend
    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante.' });
    }

    const { lat, lng, dist, start, end } = req.query;

    // Si les dates ne sont pas fournies, utiliser les 30 derniers jours
    let startDate = start, endDate = end;
    if (!start || !end) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
    }

    // Transformer les dates YYYY-MM-DD → YYYY/MM/DD
    const startPath = startDate.replace(/-/g, '/');
    const endPath   = endDate.replace(/-/g, '/');

    const ebirdUrl = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
                     `?lat=${lat}&lng=${lng}&dist=${dist}&sppLocale=fr&includeProvisional=true`;

    console.log('Calling eBird URL:', ebirdUrl); // visible dans les logs Vercel

    try {
        const response = await fetch(ebirdUrl, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('eBird API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Erreur eBird (${response.status}) : ${errorText}`
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        // Erreur réseau, DNS, timeout, etc.
        console.error('Proxy fetch error:', error);
        return res.status(500).json({
            error: `Échec de la connexion à l'API eBird : ${error.message}`
        });
    }
};
