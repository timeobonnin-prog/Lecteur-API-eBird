const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token CAPTCHA manquant' });

    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) return res.status(500).json({ error: 'Clé secrète non configurée' });

    try {
        const verifyRes = await fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
        });

        const data = await verifyRes.json();
        if (data.success) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: 'CAPTCHA invalide', details: data['error-codes'] });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Erreur de vérification CAPTCHA' });
    }
};
