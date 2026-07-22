const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(400).json({ error: 'Clé API eBird manquante.' });
    }

    try {
        const response = await fetch(
            'https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=fr',
            { headers: { 'X-eBirdApiToken': apiKey } }
        );

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({
                error: `Erreur eBird (${response.status}) : ${text}`
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({
            error: `Échec de connexion : ${error.message}`
        });
    }
};
