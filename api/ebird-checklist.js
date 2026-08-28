// api/ebird-checklist.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(401).json({ error: 'Clé API eBird manquante.' });

    const { subId } = req.query;
    if (!subId) return res.status(400).json({ error: 'subId requis.' });

    try {
        // ✅ Ajout du paramètre includeObservations=true
        const url = `https://api.ebird.org/v2/product/checklist/view/${subId}?includeObservations=true`;
        const response = await fetch(url, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `eBird ${response.status}: ${text}` });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
