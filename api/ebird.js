const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Autoriser le navigateur à lire les données
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-ebird-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = req.headers['x-user-ebird-key'];
    if (!apiKey) return res.status(400).json({ error: 'Clé API manquante.' });

    // Récupération des paramètres envoyés par le site web
    const lat = req.query.lat || '47.3941';
    const lng = req.query.lng || '0.6848';
    const dist = req.query.dist || '25';
    const start = req.query.start;   // format YYYY-MM-DD
    const end = req.query.end;       // format YYYY-MM-DD

    // Vérifier que les dates sont fournies (le frontend les envoie toujours maintenant)
    if (!start || !end) {
        return res.status(400).json({ error: 'Paramètres start et end requis.' });
    }

    // Transformer les dates pour l'URL eBird : "YYYY-MM-DD" → "YYYY/MM/DD"
    const startPath = start.replace(/-/g, '/');
    const endPath   = end.replace(/-/g, '/');

    // URL de l'endpoint historique eBird
    let url = `https://api.ebird.org/v2/data/obs/geo/${startPath}/${endPath}` +
              `?lat=${lat}&lng=${lng}&dist=${dist}&sppLocale=fr&includeProvisional=true`;

    // Note : l'endpoint historique ne supporte pas le filtre par espèce.
    // Si tu souhaites filtrer par espèce, il faudrait le faire manuellement après coup.
    // Pour l'instant, on ignore le paramètre `species`.

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
