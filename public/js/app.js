let carteFenetre;
let groupeMarqueurs;
let zoneGeographique = { lat: 47.3941, lng: 0.6848 }; // Par défaut : Indre-et-Loire
let listeOiseauxApi = [];
let cleEbirdActive = "";

// Petit logo type "Maps Pin" vert fluo
const iconeMapsPersonnalisee = L.divIcon({
    className: 'maps-pin-container',
    html: `
        <svg class="maps-svg-pin" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26]
});

// Étape 1 : Initialisation de la carte au chargement de la page
function preparerCarte() {
    carteFenetre = L.map('map', { zoomControl: false }).setView([zoneGeographique.lat, zoneGeographique.lng], 11);
    
    L.control.zoom({ position: 'bottomright' }).addTo(carteFenetre);

    // Source stable de carte sombre CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(carteFenetre);

    groupeMarqueurs = L.layerGroup().addTo(carteFenetre);

    // Permet de cliquer sur la carte (PC ou mobile) pour changer de zone d'étude
    carteFenetre.on('click', function(e) {
        zoneGeographique = { lat: e.latlng.lat, lng: e.latlng.lng };
        declencherRecherche();
    });
}

// Étape 2 : Clic sur le bouton de connexion
function validerCleEtScanner() {
    const cleSaisie = document.getElementById('apiSecretKey').value.trim();
    if (!cleSaisie) {
        alert("Entre ta clé API eBird pour démarrer le radar !");
        return;
    }

    cleEbirdActive = cleSaisie;
    
    // Fait disparaître l'écran d'accueil transparent
    document.getElementById('authOverlay').classList.add('activated');
    
    // RESOLUTION DU BUG MOBILE : On force Leaflet à recalculer sa taille d'écran
    setTimeout(() => {
        carteFenetre.invalidateSize();
        declencherRecherche();
    }, 300);
}

// Étape 3 : Appel API Vercel
async function declencherRecherche() {
    if (!cleEbirdActive) return;

    const nbrJours = document.getElementById('daysFilter').value;
    const rayonKm = document.getElementById('radiusFilter').value;

    groupeMarqueurs.clearLayers();

    // Cercle radar d'exploration
    L.circle([zoneGeographique.lat, zoneGeographique.lng], {
        color: '#10b981', fillColor: '#10b981', fillOpacity: 0.04, radius: rayonKm * 1000, weight: 1
    }).addTo(groupeMarqueurs);

    try {
        const url = `/api/ebird?lat=${zoneGeographique.lat}&lng=${zoneGeographique.lng}&dist=${rayonKm}&back=${nbrJours}`;
        const reponse = await fetch(url, {
            headers: { 'x-user-ebird-key': cleEbirdActive }
        });

        const donnees = await reponse.json();
        
        if (donnees.error) {
            alert(donnees.error);
            return;
        }

        listeOiseauxApi = donnees;
        filtrerMarqueurs();

    } catch (err) {
        console.error("Erreur de communication :", err);
        alert("Impossible de joindre le serveur de scan.");
    }
}

// Étape 4 : Filtrage et pose des logos "Maps Pin"
function filtrerMarqueurs() {
    const motCle = document.getElementById('birdSearch').value.toLowerCase();

    // Nettoie les anciens pins, garde le cercle
    groupeMarqueurs.eachLayer((layer) => {
        if (!layer.options.radius) groupeMarqueurs.removeLayer(layer);
    });

    const oiseauxFiltres = listeOiseauxApi.filter(o => 
        (o.comName && o.comName.toLowerCase().includes(motCle)) || 
        (o.sciName && o.sciName.toLowerCase().includes(motCle))
    );

    oiseauxFiltres.forEach(oiseau => {
        const nomFr = oiseau.comName || "Oiseau inconnu";
        const marqueur = L.marker([oiseau.lat, oiseau.lng], { icon: iconeMapsPersonnalisee });

        marqueur.bindPopup(`
            <div style="text-align: center; font-family: sans-serif;">
                <h4 style="color:#10b981; margin-bottom:4px;">${nomFr}</h4>
                <p style="color:#94a3b8; font-size:0.8rem; font-style:italic; margin-bottom:8px;">${oiseau.sciName}</p>
                <div style="font-size:0.8rem; border-top:1px solid #333; padding-top:6px;">
                    📍 ${oiseau.locName}<br>
                    🔢 Quantité : <b>${oiseau.howMany || 1}</b>
                </div>
            </div>
        `);

        marqueur.addTo(groupeMarqueurs);
    });
}

window.onload = preparerCarte;
