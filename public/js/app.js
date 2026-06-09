let map;
let calquePoints;
let centreCarte = { lat: 47.3941, lng: 0.6848 }; // Centre sur l'Indre-et-Loire par défaut
let oiseauxRecuperes = [];

// Création du petit logo Maps en vert fluo pour chaque oiseau
const logoMaps = L.divIcon({
    className: 'pin-wrapper',
    html: `
        <svg class="maps-pin" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Initialisation de la carte sombre
function initCarte() {
    map = L.map('map').setView([centreCarte.lat, centreCarte.lng], 10);
    
    // Style de carte sombre épuré
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    calquePoints = L.layerGroup().addTo(map);

    // Relance la recherche là où tu cliques sur la carte !
    map.on('click', function(e) {
        centreCarte = { lat: e.latlng.lat, lng: e.latlng.lng };
        lancerScan();
    });
}

// Fonction pour envoyer la requête à ton API locale
async function lancerScan() {
    const cle = document.getElementById('cleApiInput').value.trim();
    if (!cle) {
        alert("N'oublie pas de coller ta clé API eBird en haut à droite !");
        return;
    }

    const jours = document.getElementById('filtreJours').value;
    const rayon = document.getElementById('filtreRayon').value;

    calquePoints.clearLayers();

    // Petit cercle radar vert pour montrer la zone scannée
    L.circle([centreCarte.lat, centreCarte.lng], {
        color: '#10b981', fillColor: '#10b981', fillOpacity: 0.05, radius: rayon * 1000
    }).addTo(calquePoints);

    try {
        const reponse = await fetch(`/api/ebird?lat=${centreCarte.lat}&lng=${centreCarte.lng}&dist=${rayon}&back=${jours}`, {
            headers: { 'x-user-ebird-key': cle }
        });
        
        if (!reponse.ok) throw new Error("Erreur de récupération des données");
        
        oiseauxRecuperes = await reponse.json();
        filtrerCarte(); // Affiche tout de suite les oiseaux sur la carte

    } catch (erreur) {
        console.error("Erreur de scan :", erreur);
        alert("Erreur de connexion. Vérifie ta clé API.");
    }
}

// Fonction de la barre de recherche au centre
function filtrerCarte() {
    const texte = document.getElementById('rechercheEspece').value.toLowerCase();
    
    // On nettoie les anciens logos Maps (mais on garde le grand cercle vert du radar)
    calquePoints.eachLayer((couche) => {
        if (!couche.options.radius) calquePoints.removeLayer(couche);
    });

    const oiseauxFiltres = oiseauxRecuperes.filter(o => 
        (o.comName && o.comName.toLowerCase().includes(texte)) || 
        (o.sciName && o.sciName.toLowerCase().includes(texte))
    );

    oiseauxFiltres.forEach(oiseau => {
        const nom = oiseau.comName || "Espèce Inconnue";
        
        // Place le petit logo Maps
        const marqueur = L.marker([oiseau.lat, oiseau.lng], { icon: logoMaps });
        
        // Affiche les infos quand on clique dessus
        marqueur.bindPopup(`
            <div style="text-align: center;">
                <h3 style="color: #34d399; margin-bottom: 5px;">${nom}</h3>
                <em style="color: #94a3b8;">${oiseau.sciName}</em><br>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    📍 ${oiseau.locName}<br>
                    👁️ Vue(s) : ${oiseau.howMany || 1}
                </div>
            </div>
        `);
        
        marqueur.addTo(calquePoints);
    });
}

// Démarre la carte quand la page se charge
window.onload = initCarte;
