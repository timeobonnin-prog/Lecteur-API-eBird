// On récupère les éléments
const keyInput = document.getElementById('userKey');

// Fonction pour appeler ton API sécurisée
async function loadObservations(speciesCode, lat, lng, distKm) {
    const response = await fetch(`/api/ebird?speciesCode=${speciesCode}&lat=${lat}&lng=${lng}&dist=${distKm}`, {
        method: 'GET',
        headers: { 
            'x-user-ebird-key': keyInput.value.trim() 
        }
    });
    const data = await response.json();
    console.log(data);
    // Ici, tu pourras ajouter ton code pour afficher les oiseaux sur la page
}
