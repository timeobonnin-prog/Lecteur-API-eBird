const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Configuration des en-têtes de sécurité et partages CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé API manquante.' });

    // Extraction des paramètres géographiques
    const lat = req.query.lat || '47.3941';
    const lng = req.query.lng || '0.6848';
    const dist = req.query.dist || '25';
    const back = req.query.back || '14';
    const species = req.query.species || '';

    // Construction de l'appel vers l'API eBird
    let url = `https://api.ebird.org/v2/data/obs/geo/recent`;
    if (species !== '') {
        url += `/${species}`;
    }
    
    url += `?lat=${lat}&lng=${lng}&dist=${dist}&back=${back}&sppLocale=fr`;

    try {
        const reponse = await fetch(url, { headers: { 'x-ebirdapitoken': apiKey } });
        
        if (!reponse.ok) {
            const erreurTexte = await reponse.text();
            return res.status(reponse.status).json({ error: `Erreur eBird : ${erreurTexte}` });
        }

        const data = await reponse.json();
        return res.status(200).json(data);

    } catch (erreur) {
        return res.status(500).json({ error: 'Erreur de connexion au serveur eBird.' });
    }
};
