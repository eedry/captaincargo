// --- NIVEAUX NINJA ---
const NINJA_LEVELS = [
  { min: 0,   label: 'Bébé Ninja',     level: 1, emoji: '🥷', img: null },
  { min: 60,  label: 'Ninja en Herbe', level: 2, emoji: '🥷', img: null },
  { min: 150, label: 'Cargo Ninja',    level: 3, emoji: '🥷', img: null },
  { min: 300, label: 'Ninja en Chef',  level: 4, emoji: '🥷', img: null },
  { min: 500, label: 'Ninja GOAT 🐐',  level: 5, emoji: '🥷', img: null },
];
let currentNinjaLevel = 0;

function updateNinja(minSemaine) {
  let idx = 0;
  for (let i = NINJA_LEVELS.length - 1; i >= 0; i--) {
    if (minSemaine >= NINJA_LEVELS[i].min) { idx = i; break; }
  }
  const ninja = NINJA_LEVELS[idx];
  const badge = document.getElementById('ninjaBadge');
  if (idx !== currentNinjaLevel) {
    badge.classList.remove('levelup');
    void badge.offsetWidth;
    badge.classList.add('levelup');
    currentNinjaLevel = idx;
  }
  document.getElementById('ninjaLevel').textContent = `Niv. ${ninja.level}`;
  document.getElementById('ninjaName').textContent  = ninja.label;
  const avatar = document.getElementById('ninjaAvatar');
  avatar.innerHTML = ninja.img ? `<img src="${ninja.img}" alt="${ninja.label}">` : ninja.emoji;
}

// --- VÉHICULES ---
const VEHICLES = {
  'citadine-therm': { label: 'Citadine thermique',  carburant: 0.09, entretien: 0.03, assurance: 550, controle: 130 },
  'berline-therm':  { label: 'Berline thermique',   carburant: 0.12, entretien: 0.04, assurance: 700, controle: 150 },
  'suv-therm':      { label: 'SUV thermique',       carburant: 0.15, entretien: 0.05, assurance: 900, controle: 150 },
  'citadine-elec':  { label: 'Citadine électrique', carburant: 0.03, entretien: 0.02, assurance: 500, controle: 100 },
  'suv-elec':       { label: 'SUV électrique',      carburant: 0.05, entretien: 0.03, assurance: 800, controle: 120 },
};

const BIKE_ENTRETIEN_KM = 0.05; // €/km
const SEMAINES          = 47;
const VIT_URBAIN        = 14;   // km/h
const VIT_PERIURBAIN    = 30.8; // km/h
const VIT_VELO          = 17;   // km/h

// --- CO₂ ÉQUIVALENCES ---
const CO2_EQUIV = [
  { max: 50,       label: "= fabrication d'un smartphone 📱" },
  { max: 120,      label: "= 40 burgers 🍔" },
  { max: 180,      label: "= A/R Paris-Rennes en voiture 🚗" },
  { max: 420,      label: "= A/R Paris-Berlin en road trip 🚗" },
  { max: 700,      label: "= fabrication d'un canapé 🛋️" },
  { max: 1300,     label: "= A/R Paris-Marrakech en voiture 🗺️" },
  { max: Infinity, label: "= 1 vache entière 🐄" },
];

// --- ÉTAT ---
let contexte  = 'urbain';
let carMode   = 'garde';
let amortMode = 'achat';

// --- DOM ---
const kmSlider           = document.getElementById('kmSlider');
const kmValue            = document.getElementById('kmValue');
const joursSlider        = document.getElementById('joursSlider');
const joursValue         = document.getElementById('joursValue');
const btnUrbain          = document.getElementById('btnUrbain');
const btnPeriurbain      = document.getElementById('btnPeriurbain');
const vehiculeSelect     = document.getElementById('vehiculeSelect');
const btnGarde           = document.getElementById('btnGarde');
const btnVend            = document.getElementById('btnVend');
const parkingBlock       = document.getElementById('parkingBlock');
const parkingSlider      = document.getElementById('parkingMois');
const parkingVal         = document.getElementById('parkingMoisVal');
const btnAchat           = document.getElementById('btnAchat');
const btnLocation        = document.getElementById('btnLocation');
const amortAchatBlock    = document.getElementById('amortAchatBlock');
const amortLocationBlock = document.getElementById('amortLocationBlock');
const prixVeloSlider     = document.getElementById('prixVelo');
const prixVeloVal        = document.getElementById('prixVeloVal');
const dureeAmortSlider   = document.getElementById('dureeAmort');
const dureeAmortVal      = document.getElementById('dureeAmortVal');
const loyerSlider        = document.getElementById('loyerMensuel');
const loyerVal           = document.getElementById('loyerMensuelVal');
const shareBtn           = document.getElementById('shareBtn');
const toast              = document.getElementById('toast');

// --- HELPERS ---
const fmt  = n => Math.round(n).toLocaleString('fr-FR') + ' €';
const fmtH = n => Math.round(n) + ' h';
const bump = card => { if (!card) return; card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump'); };

function getArgentEquiv(e) {
  if (e < 500)  return `= ${Math.round(e / 80)} pleins d'essence ⛽`;
  if (e < 1000) return `= des vacances en famille en France 🏖️`;
  if (e < 2000) return `= un mois de loyer 🏠`;
  if (e < 3000) return `= un mois de salaire médian 💰`;
  return `= un voyage au bout du monde ✈️`;
}

function getCo2Equiv(c) {
  return CO2_EQUIV.find(x => c <= x.max)?.label || CO2_EQUIV.at(-1).label;
}

// --- CALCUL ---
function calculate() {
  const kmJour  = parseInt(kmSlider.value);
  const jours   = parseInt(joursSlider.value);
  const kmAn    = kmJour * jours * SEMAINES;
  const v       = VEHICLES[vehiculeSelect.value];
  const sell    = (carMode === 'vend');
  const parking = sell ? parseInt(parkingSlider.value) * 12 : 0;

  // Coûts voiture
  const carCarburant = Math.round(v.carburant * kmAn);
  const carEntretien = Math.round(v.entretien * kmAn);
  const carAssurance = sell ? v.assurance : 0;
  const carControle  = sell ? v.controle  : 0;
  const carParking   = parking;
  const totalCar     = carCarburant + carEntretien + carAssurance + carControle + carParking;

  // Coûts vélo (fonctionnement, sans achat)
  const bikeEntretien = Math.round(BIKE_ENTRETIEN_KM * kmAn);
  const totalBike     = bikeEntretien;

  // Économie sur coûts courants
  const economie          = totalCar - totalBike;
  const economieMensuelle = economie / 12;

  // Temps
  const vitV        = contexte === 'urbain' ? VIT_URBAIN : VIT_PERIURBAIN;
  const heuresCarAn  = Math.round((kmAn / vitV) * 60 / 60);
  const heuresVeloAn = Math.round((kmAn / VIT_VELO) * 60 / 60);
  const diffHeures   = heuresCarAn - heuresVeloAn; // positif = vélo plus rapide

  // CO₂ & OMS
  const co2        = Math.round((0.180 - 0.010) * kmAn);
  const minVeloSem = (kmJour * jours / VIT_VELO) * 60;
  const ratio      = Math.round(minVeloSem / 150 * 10) / 10;

  return {
    kmAn, economie, economieMensuelle,
    carCarburant, carEntretien, carAssurance, carControle, carParking, totalCar,
    bikeEntretien, totalBike,
    heuresCarAn, heuresVeloAn, diffHeures,
    co2, ratio, minVeloSem,
    v, sell,
  };
}

function calcAmort(economieMensuelle) {
  if (amortMode === 'achat') {
    const prix  = parseInt(prixVeloSlider.value);
    const duree = parseInt(dureeAmortSlider.value);
    const gain  = economieMensuelle - prix / duree;
    if (gain >= 0) return { val: '+' + Math.round(gain) + ' €/mois', label: 'de gain net dès maintenant', equiv: `amorti sur ${duree} mois · vous êtes gagnant 🎉` };
    if (economieMensuelle <= 0) return { val: '∞', label: 'amortissement', equiv: 'augmentez les km ou les jours ↑' };
    return { val: Math.ceil(prix / economieMensuelle) + ' mois', label: 'pour amortir le vélo', equiv: `ensuite +${Math.round(economieMensuelle)} €/mois dans la poche` };
  } else {
    const loyer = parseInt(loyerSlider.value);
    const gain  = economieMensuelle - loyer;
    if (gain >= 0) return { val: '+' + Math.round(gain) + ' €/mois', label: 'de gain net (loyer inclus)', equiv: 'la location se finance toute seule 🎉' };
    return { val: Math.round(Math.abs(gain)) + ' €/mois', label: 'restent à votre charge', equiv: `soit ${Math.round(Math.abs(gain) * 12)} €/an nets` };
  }
}

// --- MISE À JOUR UI ---
function updateUI() {
  const r     = calculate();
  const amort = calcAmort(r.economieMensuelle);

  // Lignes "vend" : afficher/masquer
  document.querySelectorAll('.sell-row').forEach(row => {
    row.style.display = r.sell ? 'grid' : 'none';
  });
  parkingBlock.style.display = r.sell ? 'block' : 'none';

  // Big savings
  document.getElementById('valArgent').textContent   = fmt(r.economie);
  document.getElementById('equivArgent').textContent = getArgentEquiv(r.economie);
  bump(document.getElementById('cardArgent'));

  // Tableau match
  document.getElementById('mCarburant').textContent     = fmt(r.carCarburant);
  document.getElementById('mEntretien').textContent     = fmt(r.carEntretien);
  document.getElementById('mBikeEntretien').textContent = fmt(r.bikeEntretien);
  document.getElementById('mAssurance').textContent     = fmt(r.carAssurance);
  document.getElementById('mControle').textContent      = fmt(r.carControle);
  document.getElementById('mParking').textContent       = fmt(r.carParking);
  document.getElementById('mTotalCar').textContent      = fmt(r.totalCar);
  document.getElementById('mTotalBike').textContent     = fmt(r.totalBike);
  document.getElementById('mTempsCar').textContent      = fmtH(r.heuresCarAn);
  document.getElementById('mTempsBike').textContent     = fmtH(r.heuresVeloAn);

  // Note temps
  const timeNote = document.getElementById('matchTimeNote');
  if (r.diffHeures > 0) {
    timeNote.textContent = `⚡ Le vélo vous fait gagner ${r.diffHeures} h/an sur vos trajets.`;
    timeNote.style.display = 'block';
  } else if (r.diffHeures < 0) {
    timeNote.textContent = `🚲 Le vélo prend ${Math.abs(r.diffHeures)} h/an de plus — mais sans stress ni parking.`;
    timeNote.style.display = 'block';
  } else {
    timeNote.style.display = 'none';
  }

  // Hypothèses
  const vit = contexte === 'urbain' ? VIT_URBAIN : VIT_PERIURBAIN;
  document.getElementById('hypothesesContent').innerHTML = `
    <div>⛽ Carburant · ${Math.round(r.v.carburant * 100)} cts/km</div>
    <div>🔧 Entretien voiture · ${Math.round(r.v.entretien * 100)} cts/km</div>
    <div>🛡️ Assurance · ${r.v.assurance.toLocaleString('fr-FR')} €/an</div>
    <div>🔍 Contrôle · ${r.v.controle} €/an</div>
    <div>🚲 Entretien vélo · 5 cts/km</div>
    <div>📅 Base · ${SEMAINES} semaines/an</div>
    <div>🏙️ Vitesse voiture · ${vit} km/h</div>
    <div>🚲 Vitesse vélo · ${VIT_VELO} km/h</div>
  `;

  // Amortissement
  document.getElementById('valAmort').textContent   = amort.val;
  document.getElementById('labelAmort').textContent = amort.label;
  document.getElementById('equivAmort').textContent = amort.equiv;
  bump(document.getElementById('cardAmort'));

  // CO₂ & sport
  const co2Txt = r.co2 >= 1000 ? (r.co2 / 1000).toFixed(1).replace('.', ',') + ' t' : r.co2 + ' kg';
  document.getElementById('valCo2').textContent   = co2Txt;
  document.getElementById('equivCo2').textContent = getCo2Equiv(r.co2);
  document.getElementById('valForme').textContent = r.ratio + '×';

  // Ninja
  updateNinja(r.minVeloSem);

  // Labels sliders
  kmValue.textContent    = kmSlider.value + ' km';
  joursValue.textContent = joursSlider.value + ' j';
}

// --- EVENTS ---
kmSlider.addEventListener('input', updateUI);
joursSlider.addEventListener('input', updateUI);

btnUrbain.addEventListener('click', () => {
  contexte = 'urbain';
  btnUrbain.classList.add('active'); btnPeriurbain.classList.remove('active');
  updateUI();
});
btnPeriurbain.addEventListener('click', () => {
  contexte = 'periurbain';
  btnPeriurbain.classList.add('active'); btnUrbain.classList.remove('active');
  updateUI();
});

vehiculeSelect.addEventListener('change', updateUI);

btnGarde.addEventListener('click', () => {
  carMode = 'garde';
  btnGarde.classList.add('active'); btnVend.classList.remove('active');
  updateUI();
});
btnVend.addEventListener('click', () => {
  carMode = 'vend';
  btnVend.classList.add('active'); btnGarde.classList.remove('active');
  updateUI();
});

parkingSlider.addEventListener('input', () => {
  const v = parseInt(parkingSlider.value);
  parkingVal.textContent = v === 0 ? '0 €' : v + ' €/mois';
  updateUI();
});

btnAchat.addEventListener('click', () => {
  amortMode = 'achat';
  btnAchat.classList.add('active'); btnLocation.classList.remove('active');
  amortAchatBlock.style.display = 'block'; amortLocationBlock.style.display = 'none';
  updateUI();
});
btnLocation.addEventListener('click', () => {
  amortMode = 'location';
  btnLocation.classList.add('active'); btnAchat.classList.remove('active');
  amortLocationBlock.style.display = 'block'; amortAchatBlock.style.display = 'none';
  updateUI();
});
prixVeloSlider.addEventListener('input', () => {
  prixVeloVal.textContent = parseInt(prixVeloSlider.value).toLocaleString('fr-FR') + ' €';
  updateUI();
});
dureeAmortSlider.addEventListener('input', () => {
  dureeAmortVal.textContent = dureeAmortSlider.value + ' mois';
  updateUI();
});
loyerSlider.addEventListener('input', () => {
  loyerVal.textContent = loyerSlider.value + ' €/mois';
  updateUI();
});

// --- PARTAGE ---
shareBtn.addEventListener('click', () => {
  const r   = calculate();
  const url = `${location.origin}?km=${kmSlider.value}&jours=${joursSlider.value}&ctx=${contexte}`;
  const texte = `J'ai simulé mon trajet sur Cargo Ninja 🚲\n${fmt(r.economie)} économisés/an, ${r.heuresVeloAn} h à vélo, et ${r.ratio}× la reco OMS.\nEt toi ? ${url}`;
  if (typeof gtag !== 'undefined') gtag('event', 'share', { km: kmSlider.value, jours: joursSlider.value, contexte, economie: r.economie });
  if (navigator.share) {
    navigator.share({ text: texte, url });
  } else {
    navigator.clipboard.writeText(texte).then(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    });
  }
});

// --- INIT ---
const p = new URLSearchParams(location.search);
if (p.get('km'))    kmSlider.value = p.get('km');
if (p.get('jours')) joursSlider.value = p.get('jours');
if (p.get('ctx') === 'periurbain') {
  contexte = 'periurbain';
  btnPeriurbain.classList.add('active'); btnUrbain.classList.remove('active');
}
updateUI();
