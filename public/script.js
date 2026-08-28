const escapeHtml = (str) => String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g,'').toLowerCase();

let userApiKey = null;
let map, layerGroup, tileLayer;
let center = [47.3941, 0.6848];
let rawObservations = [];
let checklists = {};
let markerRefs = {};
let cardRefs = {};
let nightMode = true;
let autocompleteTimer;
let locationAutocompleteTimer;
let taxonomy = [];
let currentSpeciesCode = null;
let speciesChecklists = {};
let userPosition = null;

// Cache pour les photos (Macaulay Library)
const photoCache = new Map();

// Récupère une photo pour un speciesCode
async function fetchBirdPhoto(speciesCode) {
    if (!speciesCode) return null;
    if (photoCache.has(speciesCode)) return photoCache.get(speciesCode);

    try {
        const url = `https://search.macaulaylibrary.org/catalog.json?taxonCode=${speciesCode}&mediaType=photo&sort=rating_rank_desc&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.length > 0 && data[0].assets && data[0].assets.length > 0) {
            const photoUrl = data[0].assets[0].thumb;
            photoCache.set(speciesCode, photoUrl);
            return photoUrl;
        }
    } catch (e) {
        console.warn('Photo introuvable pour', speciesCode);
    }
    photoCache.set(speciesCode, null);
    return null;
}

// Récupère la liste COMPLÈTE d'une checklist
async function fetchFullChecklist(subId) {
    if (!userApiKey) { 
        alert('Pas de clé API'); 
        return null; 
    }
    try {
        const res = await fetch(`/api/ebird-checklist?subId=${subId}`, {
            headers: { 'x-user-ebird-key': userApiKey }
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Erreur ${res.status}: ${errorText}`);
        }
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        console.error('Erreur fetchFullChecklist:', err);
        alert('Erreur lors du chargement de la checklist : ' + err.message);
        return null;
    }
}

// ---------------------------------------------------
// Fonds de carte (sans "dark")
// ---------------------------------------------------
const mapLayers = {
    light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};
let currentMapLayer = 'light';
let markerColor = '#000000';

function updateMarkerColor() {
    markerColor = (currentMapLayer === 'satellite') ? '#ffffff' : '#000000';
}

function getMarkerIcon() {
    return L.divIcon({
        className: 'map-marker',
        html: `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${markerColor}"/></svg>`,
        iconSize: [26,26],
        iconAnchor: [13,26],
        popupAnchor: [0,-26]
    });
}

function changeMapLayer(layerName) {
    currentMapLayer = layerName;
    localStorage.setItem('mapLayer', layerName);
    updateMarkerColor();
    if (tileLayer) map.removeLayer(tileLayer);
    let attribution = '';
    if (layerName === 'satellite') {
        attribution = 'Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (layerName === 'topo') {
        attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © OpenTopoMap';
    } else {
        attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
    tileLayer = L.tileLayer(mapLayers[layerName], { attribution }).addTo(map);
    if (Object.keys(checklists).length > 0 || Object.keys(speciesChecklists).length > 0) {
        renderChecklists();
    }
}

function toggleTheme(force = null) {
    nightMode = force !== null ? force : !nightMode;
    localStorage.setItem('themeMode', nightMode ? 'dark' : 'light');
    document.body.className = nightMode ? '' : 'light';
    document.getElementById('themeBtn').innerText = nightMode ? '🌙' : '☀️';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function centerOnUser() {
    if (!navigator.geolocation) { alert("Géolocalisation indisponible"); return; }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            center = [userPosition.lat, userPosition.lng];
            map.setView(center, 12);
            renderChecklists();
        },
        (err) => { alert("Position impossible à obtenir"); console.error(err); }
    );
}

async function tryAutoLogin() {
    const savedKey = localStorage.getItem('ebirdApiKey');
    if (!savedKey) return false;
    try {
        const testRes = await fetch('/api/ebird-taxonomy', { headers: { 'x-user-ebird-key': savedKey } });
        if (!testRes.ok) { localStorage.removeItem('ebirdApiKey'); return false; }
        userApiKey = savedKey;
        document.getElementById('authScreen').classList.add('hidden');
        await loadTaxonomy();
        setTimeout(() => { map.invalidateSize(); runScan(); }, 400);
        return true;
    } catch (err) {
        localStorage.removeItem('ebirdApiKey');
        return false;
    }
}

function logout() {
    localStorage.removeItem('ebirdApiKey');
    userApiKey = null;
    rawObservations = [];
    checklists = {};
    speciesChecklists = {};
    currentSpeciesCode = null;
    if (layerGroup) layerGroup.clearLayers();
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('apiKeyField').value = '';
    document.getElementById('apiKeyError').style.display = 'none';
    document.getElementById('apiKeyField').focus();
    if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
    document.getElementById('checklistContainer').innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">Prêt à scanner…</div>';
    document.getElementById('speciesTotal').textContent = '0 espèce distincte';
    document.getElementById('totalBirdsCount').textContent = '0 individus';
    document.getElementById('checklistCount').textContent = '0';
}

async function startRadar() {
    const token = document.getElementById('apiKeyField').value.trim();
    const errorDiv = document.getElementById('apiKeyError');
    errorDiv.style.display = 'none';

    if (!token) { errorDiv.textContent = 'Veuillez saisir une clé API.'; errorDiv.style.display = 'block'; return; }
    const hcaptchaResponse = hcaptcha.getResponse();
    if (!hcaptchaResponse) { errorDiv.textContent = 'Veuillez résoudre le CAPTCHA.'; errorDiv.style.display = 'block'; return; }

    try {
        const verifyRes = await fetch('/api/verify-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: hcaptchaResponse })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) throw new Error(verifyData.error || 'CAPTCHA invalide');
    } catch (err) {
        errorDiv.textContent = 'Échec vérification CAPTCHA : ' + err.message;
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const testRes = await fetch('/api/ebird-taxonomy', { headers: { 'x-user-ebird-key': token } });
        if (!testRes.ok) {
            if (testRes.status === 401 || testRes.status === 403) throw new Error('Clé API invalide');
            else throw new Error('Erreur de connexion');
        }
    } catch (err) {
        errorDiv.textContent = err.message === 'Clé API invalide' ? 'Clé API invalide. Vérifiez votre clé.' : 'Impossible de vérifier la clé.';
        errorDiv.style.display = 'block';
        return;
    }

    localStorage.setItem('ebirdApiKey', token);
    userApiKey = token;
    document.getElementById('authScreen').classList.add('hidden');
    loadTaxonomy();
    setTimeout(() => { map.invalidateSize(); runScan(); }, 400);
}

async function loadTaxonomy() {
    try {
        const res = await fetch('/api/ebird-taxonomy', { headers: { 'x-user-ebird-key': userApiKey } });
        if (!res.ok) throw new Error('Erreur taxonomie');
        taxonomy = await res.json();
    } catch (err) { console.error('Taxonomie indisponible'); }
}

function findSpeciesCode(frenchName) {
    const normalizedInput = normalize(frenchName);
    const match = taxonomy.find(s => normalize(s.comName) === normalizedInput);
    return match ? match.speciesCode : null;
}

function showLoading() {
    document.getElementById('checklistContainer').innerHTML = '<div class="spinner"></div>';
}

async function runScan() {
    if (!userApiKey || currentSpeciesCode) return;
    showLoading();
    const radius = document.getElementById('radiusSelect').value;
    const url = `/api/ebird?lat=${center[0]}&lng=${center[1]}&dist=${radius}&maxResults=10000`;
    try {
        const res = await fetch(url, { headers: { 'x-user-ebird-key': userApiKey } });
        if (!res.ok) throw new Error("Erreur serveur : " + await res.text());
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        rawObservations = data;
        buildChecklists();
    } catch (err) {
        document.getElementById('checklistContainer').innerHTML = `<div style="padding:20px; color:#f87171;">${escapeHtml(err.message)}</div>`;
    }
}

function buildChecklists() {
    checklists = {};
    rawObservations.forEach(obs => {
        const subId = obs.subId; if (!subId) return;
        if (!checklists[subId]) {
            checklists[subId] = {
                id: subId, name: obs.locName || 'Lieu inconnu', lat: obs.lat, lng: obs.lng,
                observer: obs.userDisplayName || 'Anonyme', lastDate: obs.obsDt,
                dateObj: new Date(obs.obsDt), species: [], totalBirds: 0
            };
        }
        const existing = checklists[subId].species.find(s => s.name === obs.comName);
        if (existing) existing.count += (obs.howMany || 1);
        else checklists[subId].species.push({ 
            name: obs.comName || 'Inconnu', 
            sci: obs.sciName || '', 
            count: obs.howMany || 1,
            speciesCode: obs.speciesCode || ''
        });
        checklists[subId].totalBirds += (obs.howMany || 1);
        if (new Date(obs.obsDt) > checklists[subId].dateObj) {
            checklists[subId].dateObj = new Date(obs.obsDt);
            checklists[subId].lastDate = obs.obsDt;
        }
    });
    layerGroup.clearLayers();
    L.circle(center, { color:'#10b981', fillColor:'#10b981', fillOpacity:0.04, radius: document.getElementById('radiusSelect').value*1000, weight:1 }).addTo(layerGroup);
    renderChecklists();
}

function updateAutocomplete() {
    clearTimeout(autocompleteTimer);
    autocompleteTimer = setTimeout(() => {
        const input = document.getElementById('searchInput');
        const query = normalize(input.value.trim());
        const list = document.getElementById('autocompleteList');
        if (!query) {
            list.style.display = 'none';
            if (currentSpeciesCode) { currentSpeciesCode = null; speciesChecklists = {}; renderChecklists(); }
            return;
        }
        const suggestions = [];
        if (taxonomy.length > 0) {
            taxonomy.filter(s => normalize(s.comName).includes(query)).slice(0,5).forEach(s => suggestions.push(s.comName));
        }
        if (suggestions.length === 0) {
            const unique = new Set();
            Object.values(checklists).forEach(cl => cl.species.forEach(s => { if (normalize(s.name).includes(query)) unique.add(s.name); }));
            Array.from(unique).slice(0,5).forEach(s => suggestions.push(s));
        }
        if (suggestions.length) {
            list.innerHTML = suggestions.map(s => `<div class="autocomplete-item">${escapeHtml(s)}</div>`).join('');
            list.querySelectorAll('.autocomplete-item').forEach(item => item.addEventListener('click', () => {
                const name = item.textContent;
                input.value = name; list.style.display = 'none';
                const code = findSpeciesCode(name);
                if (code) { currentSpeciesCode = code; fetchSpeciesChecklists(code); }
                else alert('Code espèce introuvable.');
            }));
            list.style.display = 'block';
        } else list.style.display = 'none';
    }, 300);
}

async function fetchSpeciesChecklists(speciesCode) {
    showLoading();
    const radius = parseInt(document.getElementById('radiusSelect').value, 10);
    const url = `/api/ebird-nearest?lat=${center[0]}&lng=${center[1]}&code=${speciesCode}&back=30&maxResults=2000`;
    try {
        const res = await fetch(url, { headers: { 'x-user-ebird-key': userApiKey } });
        const data = await res.json();
        const filteredData = data.filter(obs => calculateDistance(center[0], center[1], obs.lat, obs.lng) <= radius);
        buildSpeciesChecklists(filteredData);
    } catch (err) {
        document.getElementById('checklistContainer').innerHTML = `<div style="padding:20px; color:#f87171;">${escapeHtml(err.message)}</div>`;
    }
}

function buildSpeciesChecklists(observations) {
    speciesChecklists = {};
    observations.forEach(obs => {
        const subId = obs.subId; if (!subId) return;
        if (!speciesChecklists[subId]) {
            speciesChecklists[subId] = {
                id: subId, name: obs.locName || 'Lieu inconnu', lat: obs.lat, lng: obs.lng,
                observer: obs.userDisplayName || 'Anonyme', lastDate: obs.obsDt,
                dateObj: new Date(obs.obsDt), species: [], totalBirds: 0
            };
        }
        const existing = speciesChecklists[subId].species.find(s => s.name === obs.comName);
        if (existing) existing.count += (obs.howMany || 1);
        else speciesChecklists[subId].species.push({ 
            name: obs.comName || 'Inconnu', 
            sci: obs.sciName || '', 
            count: obs.howMany || 1,
            speciesCode: obs.speciesCode || ''
        });
        speciesChecklists[subId].totalBirds += (obs.howMany || 1);
        if (new Date(obs.obsDt) > speciesChecklists[subId].dateObj) {
            speciesChecklists[subId].dateObj = new Date(obs.obsDt);
            speciesChecklists[subId].lastDate = obs.obsDt;
        }
    });
    renderSpeciesChecklists();
}

// Fonction générique pour afficher une checklist (utilisée pour les deux types)
function renderChecklistCards(filtered, container, showSci) {
    filtered.forEach(cl => {
        const marker = L.marker([cl.lat, cl.lng], { icon: getMarkerIcon() }).addTo(layerGroup);
        markerRefs[cl.id] = marker;
        marker.on('click', () => {
            const card = cardRefs[cl.id];
            if (card) { card.scrollIntoView({ behavior:'smooth', block:'center' }); card.classList.add('highlight'); if(!card.classList.contains('expanded')) card.classList.add('expanded'); setTimeout(() => card.classList.remove('highlight'), 1500); }
        });
        let distanceHtml = '';
        if (userPosition) {
            const dist = calculateDistance(userPosition.lat, userPosition.lng, cl.lat, cl.lng).toFixed(1);
            distanceHtml = ` · 📏 ${dist} km`;
        }
        const card = document.createElement('div'); card.className = 'checklist-card';

        const speciesHtml = cl.species.map(s => `
            <li>
                <span>
                    <span class="bird-name">${escapeHtml(s.name)} ${showSci ? `<em>(${escapeHtml(s.sci)})</em>` : ''}</span>
                    <span class="photo-trigger" data-code="${escapeHtml(s.speciesCode || '')}" style="cursor:pointer; margin-left:6px; font-size:0.7rem; color:var(--neon);" title="Voir la photo">📷</span>
                    <span class="photo-preview" style="display:none; margin-left:6px;"><img src="" style="max-width:40px; max-height:40px; border-radius:4px; vertical-align:middle;" /></span>
                </span>
                <span class="qty">x${s.count}</span>
            </li>
        `).join('');

        card.innerHTML = `
            <div class="checklist-name">${escapeHtml(cl.name)}</div>
            <div class="checklist-sub">🕒 ${formatDate(cl.lastDate)} · 👤 ${escapeHtml(cl.observer)}${distanceHtml}<br>🦅 ${cl.species.length} espèce(s) · 🔢 ${cl.totalBirds} indiv.</div>
            <div class="species-list">
                <ul>${speciesHtml}</ul>
                <a href="https://ebird.org/checklist/${cl.id}" target="_blank" class="ebird-link">🔗 Voir eBird</a>
                <button class="full-checklist-btn" data-subid="${cl.id}" style="margin-top:8px; background:var(--neon); color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:0.7rem; cursor:pointer;">📋 Voir la liste complète</button>
            </div>`;
        card.addEventListener('mouseenter', () => map.setView([cl.lat, cl.lng], map.getZoom(), { animate: true, duration: 0.3 }));
        card.addEventListener('click', (e) => {
            // Ne pas déclencher sur les boutons, liens ou déclencheurs de photo (ils ont leur propre stopPropagation)
            if (e.target.closest('button, a, .photo-trigger, .photo-preview')) return;
            map.setView([cl.lat, cl.lng], 12);
            card.classList.toggle('expanded');
        });
        cardRefs[cl.id] = card;
        container.appendChild(card);
    });
}

function renderSpeciesChecklists() {
    layerGroup.eachLayer(l => { if (l instanceof L.Marker) layerGroup.removeLayer(l); });
    markerRefs = {}; cardRefs = {};
    const container = document.getElementById('checklistContainer'); container.innerHTML = '';
    const sort = document.getElementById('sortSelect').value;
    const showSci = document.getElementById('showSciNames').checked;
    let filtered = Object.values(speciesChecklists);
    const distinct = new Set(); filtered.forEach(cl => cl.species.forEach(s => distinct.add(s.name)));
    const totalBirds = filtered.reduce((sum, cl) => sum + cl.totalBirds, 0);
    document.getElementById('speciesTotal').textContent = distinct.size + ' espèce(s) distincte(s)';
    document.getElementById('totalBirdsCount').textContent = totalBirds + ' individus';
    document.getElementById('checklistCount').textContent = filtered.length;
    if (!filtered.length) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">Aucune checklist pour cette espèce.</div>';
        return;
    }
    if (sort === 'alpha') filtered.sort((a,b) => a.name.localeCompare(b.name));
    else if (sort === 'count') filtered.sort((a,b) => b.totalBirds - a.totalBirds);
    else if (sort === 'date') filtered.sort((a,b) => b.dateObj - a.dateObj);
    renderChecklistCards(filtered, container, showSci);
}

function renderChecklists() {
    if (currentSpeciesCode) { renderSpeciesChecklists(); return; }
    layerGroup.eachLayer(l => { if (l instanceof L.Marker) layerGroup.removeLayer(l); });
    markerRefs = {}; cardRefs = {};
    const container = document.getElementById('checklistContainer'); container.innerHTML = '';
    const query = normalize(document.getElementById('searchInput').value);
    const sort = document.getElementById('sortSelect').value;
    const showSci = document.getElementById('showSciNames').checked;
    let filtered = Object.values(checklists).filter(cl => {
        return normalize(cl.name).includes(query) || cl.species.some(s => normalize(s.name).includes(query));
    });
    const distinct = new Set(); filtered.forEach(cl => cl.species.forEach(s => distinct.add(s.name)));
    const totalBirds = filtered.reduce((sum, cl) => sum + cl.totalBirds, 0);
    document.getElementById('speciesTotal').textContent = distinct.size + ' espèce(s) distincte(s)';
    document.getElementById('totalBirdsCount').textContent = totalBirds + ' individus';
    document.getElementById('checklistCount').textContent = filtered.length;
    if (!filtered.length) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">Aucune checklist.</div>';
        return;
    }
    if (sort === 'alpha') filtered.sort((a,b) => a.name.localeCompare(b.name));
    else if (sort === 'count') filtered.sort((a,b) => b.totalBirds - a.totalBirds);
    else if (sort === 'date') filtered.sort((a,b) => b.dateObj - a.dateObj);
    renderChecklistCards(filtered, container, showSci);
}

async function updateLocationAutocomplete() {
    clearTimeout(locationAutocompleteTimer);
    locationAutocompleteTimer = setTimeout(async () => {
        const input = document.getElementById('locationSearch');
        const query = input.value.trim();
        const list = document.getElementById('locationAutocompleteList');
        if (query.length < 2) { list.style.display = 'none'; return; }

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            const places = await res.json();
            if (places.length === 0) { list.style.display = 'none'; return; }

            list.innerHTML = places.map(p => `<div class="autocomplete-item" data-lat="${p.lat}" data-lon="${p.lon}" data-name="${escapeHtml(p.display_name)}">${escapeHtml(p.display_name)}</div>`).join('');
            list.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => {
                    const lat = parseFloat(item.dataset.lat);
                    const lon = parseFloat(item.dataset.lon);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        center = [lat, lon];
                        map.setView(center, 12);
                        input.value = item.dataset.name;
                        list.style.display = 'none';
                        runScan();
                    }
                });
            });
            list.style.display = 'block';
        } catch (err) {
            console.error(err);
            list.style.display = 'none';
        }
    }, 300);
}

async function geocodeAndGo() {
    const query = document.getElementById('locationSearch').value.trim();
    if (!query) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            center = [lat, lon];
            map.setView(center, 12);
            document.getElementById('locationSearch').value = data[0].display_name;
            runScan();
        } else {
            alert('Lieu introuvable.');
        }
    } catch (err) {
        alert('Erreur lors de la recherche du lieu.');
    }
}

function openExportModal() { document.getElementById('exportModal').classList.add('active'); }
function closeModal() {
    document.getElementById('exportModal').classList.remove('active');
    document.getElementById('modalTitle').textContent = 'Exporter les observations';
    document.getElementById('modalBody').innerHTML = `
        <p style="text-align:center; margin-bottom:12px;">Format :</p>
        <div class="format-options">
            <label><input type="radio" name="exportFormat" value="csv" checked> CSV</label>
            <label><input type="radio" name="exportFormat" value="txt"> TXT</label>
            <label><input type="radio" name="exportFormat" value="json"> JSON</label>
        </div>
        <button class="modal-btn" onclick="doExport()">📥 Télécharger</button>
        <button style="background:transparent; border:1px solid var(--border); color:var(--text); padding:8px 16px; border-radius:8px; margin-top:8px; width:100%; cursor:pointer;" onclick="closeModal()">Annuler</button>
    `;
}

function doExport() {
    let dataSource;
    if (currentSpeciesCode) {
        dataSource = Object.values(speciesChecklists).flatMap(cl => cl.species.map(s => ({
            ...s, locName: cl.name, lat: cl.lat, lng: cl.lng, obsDt: cl.lastDate, subId: cl.id, observer: cl.observer
        })));
    } else {
        const query = normalize(document.getElementById('searchInput').value);
        const filtered = Object.values(checklists).filter(cl => normalize(cl.name).includes(query) || cl.species.some(s => normalize(s.name).includes(query)));
        const subIds = new Set(filtered.map(cl => cl.id));
        dataSource = rawObservations.filter(obs => subIds.has(obs.subId));
    }
    if (dataSource.length === 0) { alert('Aucune donnée à exporter.'); return; }

    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const headers = [
        "GLOBAL UNIQUE IDENTIFIER","LAST EDITED DATE","TAXONOMIC ORDER","CATEGORY",
        "TAXON CONCEPT ID","COMMON NAME","SCIENTIFIC NAME","SUBSPECIES COMMON NAME",
        "SUBSPECIES SCIENTIFIC NAME","EXOTIC CODE","OBSERVATION COUNT","BREEDING CODE",
        "BREEDING CATEGORY","BEHAVIOR CODE","AGE/SEX","COUNTRY","COUNTRY CODE",
        "STATE","STATE CODE","COUNTY","COUNTY CODE","IBA CODE","BCR CODE",
        "USFWS CODE","ATLAS BLOCK","LOCALITY","LOCALITY ID","LOCALITY TYPE",
        "LATITUDE","LONGITUDE","OBSERVATION DATE","TIME OBSERVATIONS STARTED",
        "OBSERVER ID","OBSERVER ORCID ID","SAMPLING EVENT IDENTIFIER","OBSERVATION TYPE",
        "PROTOCOL NAME","PROTOCOL CODE","PROJECT NAMES","PROJECT IDENTIFIERS",
        "DURATION MINUTES","EFFORT DISTANCE KM","EFFORT AREA HA","NUMBER OBSERVERS",
        "ALL SPECIES REPORTED","GROUP IDENTIFIER","HAS MEDIA","APPROVED","REVIEWED",
        "REASON","CHECKLIST COMMENTS","SPECIES COMMENTS"
    ];

    const lines = [];
    if (format !== 'json') lines.push(headers.join(format === 'txt' ? '\t' : ','));

    dataSource.forEach(obs => {
        const row = {
            "GLOBAL UNIQUE IDENTIFIER": obs.subId ? `URN:CornellLabOfOrnithology:EBIRD:OBS${obs.subId}` : '',
            "LAST EDITED DATE": '',
            "TAXONOMIC ORDER": '',
            "CATEGORY": 'species',
            "TAXON CONCEPT ID": obs.sciName || '',
            "COMMON NAME": obs.comName || '',
            "SCIENTIFIC NAME": obs.sciName || '',
            "SUBSPECIES COMMON NAME": '',
            "SUBSPECIES SCIENTIFIC NAME": '',
            "EXOTIC CODE": '',
            "OBSERVATION COUNT": obs.howMany || 1,
            "BREEDING CODE": '',
            "BREEDING CATEGORY": '',
            "BEHAVIOR CODE": '',
            "AGE/SEX": '',
            "COUNTRY": '',
            "COUNTRY CODE": '',
            "STATE": '',
            "STATE CODE": '',
            "COUNTY": '',
            "COUNTY CODE": '',
            "IBA CODE": '',
            "BCR CODE": '',
            "USFWS CODE": '',
            "ATLAS BLOCK": '',
            "LOCALITY": obs.locName || '',
            "LOCALITY ID": obs.locId || '',
            "LOCALITY TYPE": '',
            "LATITUDE": obs.lat || '',
            "LONGITUDE": obs.lng || '',
            "OBSERVATION DATE": obs.obsDt ? obs.obsDt.split(' ')[0] : '',
            "TIME OBSERVATIONS STARTED": obs.obsDt ? obs.obsDt.split(' ')[1] || '' : '',
            "OBSERVER ID": obs.observer || obs.userDisplayName || '',
            "OBSERVER ORCID ID": '',
            "SAMPLING EVENT IDENTIFIER": obs.subId || '',
            "OBSERVATION TYPE": 'Recent',
            "PROTOCOL NAME": '',
            "PROTOCOL CODE": '',
            "PROJECT NAMES": '',
            "PROJECT IDENTIFIERS": '',
            "DURATION MINUTES": '',
            "EFFORT DISTANCE KM": '',
            "EFFORT AREA HA": '',
            "NUMBER OBSERVERS": '',
            "ALL SPECIES REPORTED": '',
            "GROUP IDENTIFIER": '',
            "HAS MEDIA": '',
            "APPROVED": '',
            "REVIEWED": '',
            "REASON": '',
            "CHECKLIST COMMENTS": '',
            "SPECIES COMMENTS": ''
        };
        lines.push(headers.map(h => {
            let val = row[h] !== undefined ? row[h] : '';
            if (format === 'csv') return '"' + String(val).replace(/"/g, '""') + '"';
            else if (format === 'txt') return String(val).replace(/\t/g, ' ');
            else return val;
        }).join(format === 'txt' ? '\t' : ','));
    });

    let content = lines.join('\n');
    if (format === 'json') {
        const jsonData = dataSource.map(obs => {
            const obj = {};
            headers.forEach(h => obj[h] = (obs[h] || ''));
            return obj;
        });
        content = JSON.stringify(jsonData, null, 2);
    }

    const mimeMap = { csv: 'text/csv;charset=utf-8;', txt: 'text/plain;charset=utf-8;', json: 'application/json;charset=utf-8;' };
    const blob = new Blob([content], { type: mimeMap[format] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `ebird_export_${today}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    closeModal();
}

function formatDate(dt) {
    if (!dt) return '?';
    const [date, time] = dt.split(' ');
    const [y,m,d] = date.split('-');
    return `${d}/${m}/${y} ${time||''}`;
}

const toggleBtn = document.getElementById('toggleListBtn');
const sidebar = document.getElementById('sidebar');
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '▲' : '▼';
    if (sidebar.classList.contains('collapsed')) map.invalidateSize();
    else setTimeout(() => map.invalidateSize(), 300);
});

document.addEventListener('click', (e) => {
    const speciesList = document.getElementById('autocompleteList');
    const speciesInput = document.getElementById('searchInput');
    if (e.target !== speciesInput && e.target !== speciesList) speciesList.style.display = 'none';

    const locationList = document.getElementById('locationAutocompleteList');
    const locationInput = document.getElementById('locationSearch');
    if (e.target !== locationInput && e.target !== locationList) locationList.style.display = 'none';
});

document.addEventListener("DOMContentLoaded", async () => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'light') {
        nightMode = false;
        document.body.className = 'light';
        document.getElementById('themeBtn').innerText = '☀️';
    } else if (savedTheme === 'dark') {
        nightMode = true;
        document.body.className = '';
        document.getElementById('themeBtn').innerText = '🌙';
    } else {
        const hour = new Date().getHours();
        nightMode = !(hour >= 6 && hour < 21);
        document.body.className = nightMode ? '' : 'light';
        document.getElementById('themeBtn').innerText = nightMode ? '🌙' : '☀️';
        localStorage.setItem('themeMode', nightMode ? 'dark' : 'light');
    }

    let savedMapLayer = localStorage.getItem('mapLayer');
    if (savedMapLayer === 'dark') savedMapLayer = 'light';
    const initialLayer = savedMapLayer || 'light';
    currentMapLayer = initialLayer;
    document.getElementById('mapLayerSelect').value = initialLayer;
    updateMarkerColor();

    map = L.map('map', { zoomControl: false, maxZoom: 14 }).setView(center, 10);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    layerGroup = L.layerGroup().addTo(map);
    changeMapLayer(initialLayer);

    document.getElementById('apiKeyField').focus();
    document.getElementById('apiKeyField').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); startRadar(); }
    });

    map.on('click', (e) => {
        center = [e.latlng.lat, e.latlng.lng];
        currentSpeciesCode = null;
        speciesChecklists = {};
        document.getElementById('searchInput').value = '';
        if (userApiKey) runScan();
    });

    const githubContainer = document.getElementById('githubContainer');
    const githubPopup = document.getElementById('githubPopup');
    let githubTimeout;
    githubContainer.addEventListener('mouseenter', () => { clearTimeout(githubTimeout); githubPopup.style.display = 'block'; });
    githubContainer.addEventListener('mouseleave', () => { githubTimeout = setTimeout(() => githubPopup.style.display = 'none', 200); });
    githubPopup.addEventListener('mouseenter', () => clearTimeout(githubTimeout));
    githubPopup.addEventListener('mouseleave', () => { githubTimeout = setTimeout(() => githubPopup.style.display = 'none', 200); });

    document.getElementById('searchInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('autocompleteList').style.display = 'none';
            clearTimeout(autocompleteTimer);
            if (currentSpeciesCode) fetchSpeciesChecklists(currentSpeciesCode);
            else renderChecklists();
        }
    });

    // -------------------------------------------------
    // Gestion des photos et listes complètes (délégation)
    // 🛠️ CORRECTION : ajout de e.stopPropagation() pour éviter la fermeture de la carte
    // -------------------------------------------------
    const container = document.getElementById('checklistContainer');
    
    // Clic sur 📷 (photo)
    container.addEventListener('click', async (e) => {
        const trigger = e.target.closest('.photo-trigger');
        if (!trigger) return;
        e.stopPropagation(); // 🔥 EMPÊCHE LA CARTE DE SE REFERMER

        const code = trigger.dataset.code;
        if (!code) {
            trigger.textContent = '❌';
            trigger.title = 'Pas de code espèce';
            return;
        }
        const preview = trigger.parentElement.querySelector('.photo-preview');
        if (!preview) return;
        if (preview.style.display !== 'none') return; // déjà affichée
        
        const img = preview.querySelector('img');
        const url = await fetchBirdPhoto(code);
        if (url) {
            img.src = url;
            preview.style.display = 'inline-block';
        } else {
            trigger.textContent = '❌';
            trigger.title = 'Aucune photo trouvée';
        }
    });

    // Clic sur "Voir la liste complète"
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('.full-checklist-btn');
        if (!btn) return;
        e.stopPropagation(); // 🔥 EMPÊCHE LA CARTE DE SE REFERMER

        const subId = btn.dataset.subid;
        if (!subId) return;

        // Si le bouton est déjà en erreur, on réessaie
        btn.textContent = '⏳ Chargement...';
        btn.disabled = true;

        const checklistData = await fetchFullChecklist(subId);
        if (!checklistData) {
            btn.textContent = '❌ Erreur';
            btn.disabled = false;
            return;
        }

        const card = btn.closest('.checklist-card');
        const listContainer = card.querySelector('.species-list');
        if (!listContainer) return;
        const ul = listContainer.querySelector('ul');
        if (!ul) return;

        // Reconstruire la liste avec toutes les observations
        const speciesHtml = checklistData.observations
            .map(obs => {
                const code = obs.speciesCode || '';
                return `
                <li>
                    <span>
                        ${escapeHtml(obs.comName || 'Inconnu')} 
                        ${obs.sciName ? `<em>(${escapeHtml(obs.sciName)})</em>` : ''}
                        ${code ? `<span class="photo-trigger" data-code="${escapeHtml(code)}" style="cursor:pointer; margin-left:6px; font-size:0.7rem; color:var(--neon);" title="Voir la photo">📷</span><span class="photo-preview" style="display:none; margin-left:6px;"><img src="" style="max-width:40px; max-height:40px; border-radius:4px; vertical-align:middle;" /></span>` : ''}
                    </span>
                    <span class="qty">x${obs.howMany || 1}</span>
                </li>
            `}).join('');

        ul.innerHTML = speciesHtml;
        btn.style.display = 'none';
        const info = document.createElement('div');
        info.style.cssText = 'margin-top:6px; font-size:0.7rem; color:var(--neon);';
        info.textContent = `✅ Liste complète (${checklistData.observations.length} observations) chargée depuis eBird`;
        listContainer.appendChild(info);
        btn.textContent = '✅ OK';
        btn.disabled = false;
    });

    // Connexion automatique
    const autoLoggedIn = await tryAutoLogin();
    if (!autoLoggedIn) {
        document.getElementById('authScreen').classList.remove('hidden');
    } else {
        map.invalidateSize();
    }
});
