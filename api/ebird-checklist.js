// api/ebird-checklist.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Autoriser uniquement les requêtes GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'Clé API manquante' });
    }

    const { subId } = req.query;
    if (!subId) {
        return res.status(400).json({ error: 'subId requis' });
    }

    try {
        const url = `https://api.ebird.org/v2/product/checklist/view/${subId}`;
        const response = await fetch(url, {
            headers: { 'X-eBirdApiToken': apiKey }
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
