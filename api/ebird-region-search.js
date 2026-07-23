const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-ebird-key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé API manquante.' });

    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Terme trop court.' });

    try {
        // Étape 1 : rechercher les régions correspondantes
        const searchUrl = `https://api.ebird.org/v2/ref/region/list?regionType=subnational2&q=${encodeURIComponent(q)}`;
        const searchRes = await fetch(searchUrl, { headers: { 'X-eBirdApiToken': apiKey } });
        if (!searchRes.ok) throw new Error(`Erreur recherche région : ${searchRes.status}`);
        const regions = await searchRes.json();

        // Étape 2 : pour chaque région, obtenir les coordonnées (limité à 5 résultats pour la rapidité)
        const results = [];
        for (const region of regions.slice(0, 5)) {
            try {
                const infoUrl = `https://api.ebird.org/v2/ref/region/info/${region.code}`;
                const infoRes = await fetch(infoUrl, { headers: { 'X-eBirdApiToken': apiKey } });
                if (infoRes.ok) {
                    const info = await infoRes.json();
                    results.push({
                        code: region.code,
                        name: region.name,
                        lat: info.result?.lat,
                        lng: info.result?.lng
                    });
                }
            } catch (infoErr) {
                // ignorer cette région si l'appel info échoue
            }
        }

        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
