const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé API manquante' });

    const { locId } = req.query;
    if (!locId) return res.status(400).json({ error: 'locId requis' });

    const url = `https://api.ebird.org/v2/product/stats/${locId}?maxResults=200`;
    try {
        const response = await fetch(url, { headers: { 'X-eBirdApiToken': apiKey } });
        if (!response.ok) throw new Error(`Erreur eBird ${response.status}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
