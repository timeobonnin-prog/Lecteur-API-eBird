// api/bird-photo.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { q } = req.query; // Nom scientifique (ex: "Turdus merula")
    if (!q) return res.status(400).json({ error: 'Nom scientifique requis' });

    try {
        // 1️⃣ Tentative avec iNaturalist (très riche, CORS friendly)
        const searchUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(q)}&per_page=1`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.results && searchData.results.length > 0) {
            const taxon = searchData.results[0];
            if (taxon.default_photo && taxon.default_photo.medium_url) {
                return res.json({ url: taxon.default_photo.medium_url });
            }
        }

        // 2️⃣ Fallback : Wikipedia / Wikimedia Commons
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(q)}&pithumbsize=200&origin=*`;
        const wikiRes = await fetch(wikiUrl);
        const wikiData = await wikiRes.json();
        const pages = wikiData.query?.pages;
        if (pages) {
            for (const key in pages) {
                if (pages[key].thumbnail && pages[key].thumbnail.source) {
                    return res.json({ url: pages[key].thumbnail.source });
                }
            }
        }

        // Aucune photo trouvée
        return res.json({ url: null });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
