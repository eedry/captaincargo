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

// --- VÉHICULES (sources : ADEME + Automobile Club Association 2024) ---
// carburant et entretien en €/km, assurance et controle en €/an
const VEHICLES = {
  'citadine-therm': { label: 'Citadine thermique',  carburant: 0.10, entretien: 0.025, assurance: 500, controle: 120 },
  'berline-therm':  { label: 'Berline thermique',   carburant: 0.13, entretien: 0.035, assurance: 650, controle: 130 },
  'suv-therm':      { label: 'SUV thermique',       carburant: 0.15, entretien: 0.040, assurance: 750, controle: 150 },
  'citadine-elec':  { label: 'Citadine électrique', carburant: 0.03, entretien: 0.020, assurance: 500, controle: 100 },
  'suv-elec':       { label: 'SUV électrique',      carburant: 0.05, entretien: 0.030, assurance: 700, controle: 120 },
};

const BIKE_ENTRETIEN_DEFAULT = 0.03; // €/km — élec + service + pneus + batterie amortie
const SEMAINES               = 47;
const VIT_URBAIN             = 14;   // km/h
const VIT_PERIURBAIN         = 30.8; // km/h
const VIT_VELO               = 17;   // km/h

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
let amortMode = 'achat';
// Overrides utilisateur sur les hypothèses : null = utilise la valeur véhicule par défaut
let overrides = {
  carburant:     null,
  entretienCar: null,
  assurance:     null,
  controle:      null,
  parking:       0,    // €/mois, toujours en override (pas dans le véhicule)
  entretienBike: null,
};

// --- DOM ---
const kmSlider           = document.getElementById('kmSlider');
const kmValue            = document.getElementById('kmValue');
const joursSlider        = document.getElementById('joursSlider');
const joursValue         = document.getElementById('joursValue');
const btnUrbain          = document.getElementById('btnUrbain');
const btnPeriurbain      = document.getElementById('btnPeriurbain');
const vehiculeSelect     = document.getElementById('vehiculeSelect');
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
  if (e <= 0)   return `= passez à plus de km pour voir l'écart ↑`;
  if (e < 500)  return `= ${Math.round(e / 80)} pleins d'essence ⛽`;
  if (e < 1000) return `= des vacances en famille en France 🏖️`;
  if (e < 2000) return `= un mois de loyer 🏠`;
  if (e < 3000) return `= un mois de salaire médian 💰`;
  return `= un voyage au bout du monde ✈️`;
}

function getCo2Equiv(c) {
  return CO2_EQUIV.find(x => c <= x.max)?.label || CO2_EQUIV.at(-1).label;
}

// Récupère la valeur effective (override > défaut véhicule)
function getEffective(v) {
  return {
    carburant:     overrides.carburant     ?? v.carburant,
    entretien:     overrides.entretienCar ?? v.entretien,
    assurance:     overrides.assurance     ?? v.assurance,
    controle:      overrides.controle      ?? v.controle,
    parking:       overrides.parking,
    entretienBike: overrides.entretienBike ?? BIKE_ENTRETIEN_DEFAULT,
  };
}

// --- CALCUL ---
function calculate() {
  const kmJour = parseInt(kmSlider.value);
  const jours  = parseInt(joursSlider.value);
  const kmAn   = kmJour * jours * SEMAINES;
  const v      = VEHICLES[vehiculeSelect.value];
  const eff    = getEffective(v);

  // Coûts voiture (toujours tout)
  const carCarburant = Math.round(eff.carburant * kmAn);
  const carEntretien = Math.round(eff.entretien * kmAn);
  const carAssurance = eff.assurance;
  const carControle  = eff.controle;
  const carParking   = eff.parking * 12;
  const totalCar     = carCarburant + carEntretien + carAssurance + carControle + carParking;

  // Coûts vélo (fonctionnement, sans achat)
  const bikeEntretien = Math.round(eff.entretienBike * kmAn);
  const totalBike     = bikeEntretien;

  // Économie
  const economie          = totalCar - totalBike;
  const economieMensuelle = economie / 12;

  // Temps
  const vitV         = contexte === 'urbain' ? VIT_URBAIN : VIT_PERIURBAIN;
  const heuresCarAn  = Math.round((kmAn / vitV) * 60 / 60);
  const heuresVeloAn = Math.round((kmAn / VIT_VELO) * 60 / 60);
  const diffHeures   = heuresCarAn - heuresVeloAn;

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
    v, eff,
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

// --- HYPOTHÈSES (édition inline) ---
function renderHypotheses(eff) {
  const vit = contexte === 'urbain' ? VIT_URBAIN : VIT_PERIURBAIN;
  return `
    <div class="hypo-row"><span>⛽ Carburant</span>
      <input type="number" class="hypo-input" data-key="carburant" data-scale="100" min="0" step="1" value="${Math.round(eff.carburant * 100)}"><span class="hypo-unit">cts/km</span></div>
    <div class="hypo-row"><span>🔧 Entretien voiture</span>
      <input type="number" class="hypo-input" data-key="entretienCar" data-scale="100" min="0" step="1" value="${Math.round(eff.entretien * 100)}"><span class="hypo-unit">cts/km</span></div>
    <div class="hypo-row"><span>🛡️ Assurance</span>
      <input type="number" class="hypo-input" data-key="assurance" data-scale="1" min="0" step="10" value="${eff.assurance}"><span class="hypo-unit">€/an</span></div>
    <div class="hypo-row"><span>🔍 Contrôle + divers</span>
      <input type="number" class="hypo-input" data-key="controle" data-scale="1" min="0" step="10" value="${eff.controle}"><span class="hypo-unit">€/an</span></div>
    <div class="hypo-row"><span>🅿️ Parking</span>
      <input type="number" class="hypo-input" data-key="parking" data-scale="1" min="0" step="10" value="${eff.parking}"><span class="hypo-unit">€/mois</span></div>
    <div class="hypo-row"><span>🚲 Entretien vélo</span>
      <input type="number" class="hypo-input" data-key="entretienBike" data-scale="100" min="0" step="1" value="${Math.round(eff.entretienBike * 100)}"><span class="hypo-unit">cts/km</span></div>
    <div class="hypo-row hypo-fixed"><span>📅 Base</span><span class="hypo-fixed-val">${SEMAINES} sem/an</span></div>
    <div class="hypo-row hypo-fixed"><span>🏙️ Vitesse voiture</span><span class="hypo-fixed-val">${vit} km/h</span></div>
    <div class="hypo-row hypo-fixed"><span>🚲 Vitesse vélo</span><span class="hypo-fixed-val">${VIT_VELO} km/h</span></div>
    <div class="hypo-sources">📚 Sources : ADEME &amp; Automobile Club Association 2024 — toutes ces valeurs sont ajustables.</div>
  `;
}

function attachHypoListeners() {
  document.querySelectorAll('.hypo-input').forEach(input => {
    input.addEventListener('input', () => {
      const key   = input.dataset.key;
      const scale = parseFloat(input.dataset.scale) || 1;
      const raw   = parseFloat(input.value);
      const val   = isNaN(raw) ? 0 : raw / scale;
      if (key === 'parking') overrides.parking = val;
      else overrides[key] = val;
      updateUI({ skipHypoRender: true });
    });
  });
}

// --- MISE À JOUR UI ---
function updateUI(opts = {}) {
  const r     = calculate();
  const amort = calcAmort(r.economieMensuelle);

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

  // Hypothèses (ne pas re-render si l'utilisateur est en train de taper)
  if (!opts.skipHypoRender) {
    document.getElementById('hypothesesContent').innerHTML = renderHypotheses(r.eff);
    attachHypoListeners();
  }

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
kmSlider.addEventListener('input', () => updateUI());
joursSlider.addEventListener('input', () => updateUI());

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

// Changer de véhicule reset les overrides voiture (pas le parking, qui reste user)
vehiculeSelect.addEventListener('change', () => {
  overrides.carburant     = null;
  overrides.entretienCar = null;
  overrides.assurance     = null;
  overrides.controle      = null;
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
