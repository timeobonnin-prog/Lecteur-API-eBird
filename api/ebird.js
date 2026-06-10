// api/ebird-proxy.js
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // La clé est stockée côté serveur (variable d'environnement)
    const token = process.env.EBIRD_API_KEY;
    if (!token) return res.status(500).json({ error: "Clé API serveur manquante." });

    const { lat, lng, dist, start, end } = req.query;
    if (!start || !end) {
        return res.status(400).json({ error: 'Paramètres start et end requis.' });
    }

    // Conversion des dates YYYY-MM-DD → YYYY/MM/DD
    const startPath = start.replace(/-/g, '/');
    const endPath   = end.replace(/-/g, '/');

    const url = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
                `?lat=${lat}&lng=${lng}&dist=${dist}&sppLocale=fr&includeProvisional=true`;

    try {
        const response = await fetch(url, {
            headers: { 'X-eBirdApiToken': token }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
