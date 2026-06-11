// api/ebird.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const token = process.env.EBIRD_API_KEY;
    if (!token) {
        return res.status(500).json({ error: "Clé API serveur manquante. Ajoute EBIRD_API_KEY dans Vercel." });
    }

    const { lat, lng, dist, start, end } = req.query;
    if (!start || !end) {
        const today = new Date();
        const past = new Date(today.getTime() - 30 * 86400000);
        const startDate = past.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        const startPath = startDate.replace(/-/g, '/');
        const endPath = endDate.replace(/-/g, '/');

        const url = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
                    `?lat=${lat}&lng=${lng}&dist=${dist}&sppLocale=fr&includeProvisional=true`;

        try {
            const response = await fetch(url, { headers: { 'X-eBirdApiToken': token } });
            const data = await response.json();
            if (!response.ok) return res.status(response.status).json({ error: `Erreur eBird : ${JSON.stringify(data)}` });
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Échec de la connexion à l'API eBird." });
        }
    }

    const startPath = start.replace(/-/g, '/');
    const endPath = end.replace(/-/g, '/');

    const url = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
                `?lat=${lat}&lng=${lng}&dist=${dist}&sppLocale=fr&includeProvisional=true`;

    try {
        const response = await fetch(url, { headers: { 'X-eBirdApiToken': token } });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: `Erreur eBird : ${JSON.stringify(data)}` });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Échec de la connexion à l'API eBird." });
    }
};
