// api/macaulay-photo.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code requis' });
z
    try {
        const url = `https://search.macaulaylibrary.org/catalog.json?taxonCode=${code}&mediaType=photo&sort=rating_rank_desc&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        let photoUrl = null;
        if (data && data.length > 0 && data[0].assets && data[0].assets.length > 0) {
            photoUrl = data[0].assets[0].thumb;
        }
        res.json({ url: photoUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
