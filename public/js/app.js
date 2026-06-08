async function lancerRecherche() {
    const key = document.getElementById('userKey').value;
    // Appel vers ton fichier api/ebird.js
    const response = await fetch('/api/ebird?speciesCode=comkin&lat=47.39&lng=0.68', {
        headers: { 'x-user-ebird-key': key }
    });
    const data = await response.json();
    document.getElementById('resultats').innerText = JSON.stringify(data, null, 2);
}
