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
        // ✅ Endpoint CORRECT pour récupérer les observations d'une checklist
        const url = `https://api.ebird.org/v2/data/obs/checklist/${subId}`;
        const response = await fetch(url, {
            headers: { 'X-eBirdApiToken': apiKey }
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `eBird ${response.status}: ${text}` });
        }

        // La réponse est directement un tableau d'observations
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
