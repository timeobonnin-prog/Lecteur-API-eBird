async function lancerRecherche() {
    const keyInput = document.getElementById('userKey');
    const key = keyInput.value.trim();
    const zoneResultats = document.getElementById('resultats');
    
    if (!key) {
        zoneResultats.innerHTML = "<div class='status-msg' style='color: #f87171;'>⚠️ Tu dois coller ta clé API eBird pour interroger la base de données.</div>";
        return;
    }

    zoneResultats.innerHTML = "<div class='status-msg'>🌲 Connexion aux serveurs eBird en cours...</div>";

    try {
        // Envoi de la requête vers ton fichier serverless /api/ebird.js
        const response = await fetch('/api/ebird?lat=47.3941&lng=0.6848&dist=20&back=14', {
            headers: { 
                'x-user-ebird-key': key 
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur du serveur distant (${response.status})`);
        }

        const data = await response.json();
        
        if (data.error) {
            zoneResultats.innerHTML = `<div class='status-msg' style='color: #f87171;'>⚠️ Erreur API : ${data.error}</div>`;
            return;
        }

        if (!data || data.length === 0) {
            zoneResultats.innerHTML = "<div class='status-msg'>🍂 Aucun oiseau n'a été répertorié dans ce rayon ces 14 derniers jours.</div>";
            return;
        }

        // Construction dynamique des fiches d'oiseaux
        let html = "";
        data.forEach(oiseau => {
            // Formatage de la date proprement
            const dateObs = new Date(oiseau.obsDt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="bird-card">
                    <div class="bird-icon">🐦</div>
                    <div class="bird-info">
                        <h3>${oiseau.comName}</h3>
                        <div class="sci-name">${oiseau.sciName}</div>
                        <div class="loc-name">📍 ${oiseau.locName}</div>
                        <div class="card-footer">
                            <span class="count">Quantité : x${oiseau.howMany || 1}</span>
                            <span class="date">${dateObs}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        zoneResultats.innerHTML = html;

    } catch (err) {
        zoneResultats.innerHTML = `<div class='status-msg' style='color: #f87171;'>❌ Impossible de charger les données : ${err.message}</div>`;
    }
}
