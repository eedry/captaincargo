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
  document.getElementById('ninjaName').textContent   = ninja.label;

  const avatar = document.getElementById('ninjaAvatar');
  if (ninja.img) {
    avatar.innerHTML = `<img src="${ninja.img}" alt="${ninja.label}">`;
  } else {
    avatar.textContent = ninja.emoji;
  }
}

// --- CONSTANTES PAR DÉFAUT ---
const DEFAULTS = {
  coutKm: 0.52,
  vitesseVoiture: 14, // porte-à-porte urbain : embouteillages + parking + marche
  vitessevelo: 15,
  activiteOms: 150,
  semainesTravail: 47,
};

// Traductions CO₂ économisé → équivalences fun
const CO2_EQUIVALENCES = [
  { max: 0.005, label: "= 1 image générée par IA 🤖" },
  { max: 0.25,  label: "= 1 A/R boulangerie en voiture 🥖" },
  { max: 0.5,   label: "= 1 café expresso (production + transport) ☕" },
  { max: 3,     label: "= 1 Big Mac 🍔" },
  { max: 6.5,   label: "= 1 poulet fermier du marché 🐔" },
  { max: 8,     label: "= 1 steak de bœuf 250g 🥩" },
  { max: 35,    label: "= fabrication d'un jean neuf 👖" },
  { max: 50,    label: "= 1 smartphone neuf (fabrication) 📱" },
  { max: 120,   label: "= 40 burgers 🍔" },
  { max: 180,   label: "= A/R Paris-Rennes chez les parents en voiture 🚗" },
  { max: 320,   label: "= fabrication d'une grande TV 55\" 📺" },
  { max: 420,   label: "= A/R Paris-Berlin en road trip 🚗" },
  { max: 700,   label: "= fabrication d'un canapé 3 places 🛋️" },
  { max: 1000,  label: "= fabrication d'un frigo américain 🧊" },
  { max: 1300,  label: "= A/R Paris-Marrakech en voiture 🗺️" },
  { max: 1800,  label: "= fabrication d'une moto neuve 🏍️" },
  { max: Infinity, label: "= 1 vache entière 🐄" },
];

// Traductions économies → expériences (pas de voyage en avion)
const EQUIVALENCES = [
  { max: 200,  label: "= un bon resto en amoureux 🍷" },
  { max: 350,  label: "= une caisse de bon vin 🍾" },
  { max: 420,  label: "= un pass festival (Hellfest, Solidays…) 🎸" },
  { max: 600,  label: "= un week-end spa pour deux 🧖" },
  { max: 800,  label: "= un vélo pour le gamin 🚲" },
  { max: 1100, label: "= une console + jeux pour Noël 🎮" },
  { max: 1400, label: "= un week-end en van sur les routes 🚐" },
  { max: 1800, label: "= une semaine en gîte pour la famille 🏡" },
  { max: 2200, label: "= une cuisine refaite ✨" },
  { max: 2800, label: "= deux semaines en van aménagé 🚐" },
  { max: 3500, label: "= un interrail Europe 1 mois 🚂" },
  { max: Infinity, label: "= une vraie transformation de vie 🚀" },
];

// État
let params = { ...DEFAULTS };
let contexte = 'urbain';

// DOM
const kmSlider     = document.getElementById('kmSlider');
const kmValue      = document.getElementById('kmValue');
const joursSlider  = document.getElementById('joursSlider');
const joursValue   = document.getElementById('joursValue');
const btnUrbain    = document.getElementById('btnUrbain');
const btnPeriurbain = document.getElementById('btnPeriurbain');
const valArgent    = document.getElementById('valArgent');
const equivArgent  = document.getElementById('equivArgent');
// valTemps remplacé par valTempsVelo + valTempsDelta
const valForme     = document.getElementById('valForme');
const shareBtn     = document.getElementById('shareBtn');
const settingsBtn  = document.getElementById('settingsBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const btnReset     = document.getElementById('btnReset');
const btnApply     = document.getElementById('btnApply');
const vehiculeSelect = document.getElementById('vehiculeSelect');
const coutKmInput  = document.getElementById('coutKm');
const vitesseVoitureSlider = document.getElementById('vitesseVoiture');
const vitesseVoitureVal    = document.getElementById('vitesseVoitureVal');
const vitesseveloSlider    = document.getElementById('vitessevelo');
const vitesseveloVal       = document.getElementById('vitesseveloVal');
const activiteOmsSlider    = document.getElementById('activiteOms');
const activiteOmsVal       = document.getElementById('activiteOmsVal');
const toast        = document.getElementById('toast');

// --- CALCUL ---
function calculate() {
  const kmJour  = parseInt(kmSlider.value);
  const jours   = parseInt(joursSlider.value);

  // Coefficients selon contexte
  const vitVoiture = contexte === 'urbain' ? params.vitesseVoiture : params.vitesseVoiture * 2.2;
  const vitVelo    = params.vitessevelo;

  const kmAn = kmJour * jours * params.semainesTravail;

  // 1. ARGENT
  const coutVoitureAn = kmAn * params.coutKm;
  const coutVeloAn    = 200; // entretien forfait
  const economieBrute = coutVoitureAn - coutVeloAn;
  const economie = Math.max(0, Math.round(economieBrute));

  // 2. TEMPS
  const minVoitureAn = (kmAn / vitVoiture) * 60;
  const minVeloAn    = (kmAn / vitVelo) * 60;
  const diffMin      = minVoitureAn - minVeloAn;
  const joursGagnes  = Math.abs(Math.round(diffMin / 60)); // en heures désormais
  const tempsPositif = diffMin > 0;

  // 3. FORME
  const minVeloSemaine = (kmJour * jours / vitVelo) * 60;
  const ratio = Math.round(minVeloSemaine / params.activiteOms * 10) / 10;

  // 4. CO₂ (ADEME)
  // SUV thermique moyen : 180g CO₂/km (cycle mixte + fabrication amorti)
  // Vélo cargo : ~10g CO₂/km (fabrication amorti sur 10 ans)
  const co2SUVkm  = 0.180; // kg/km
  const co2Velokm = 0.010; // kg/km
  const co2Economise = Math.round((co2SUVkm - co2Velokm) * kmAn); // kg/an
  // 1 arbre absorbe ~25 kg CO₂/an
  const arbres = Math.round(co2Economise / 25);

  return { economie, joursGagnes, tempsPositif, diffMin, minVeloAn, ratio, minVeloSemaine, co2Economise, arbres };
}

function getEquivalence(euros) {
  return EQUIVALENCES.find(e => euros <= e.max)?.label || EQUIVALENCES.at(-1).label;
}

function formatEuros(n) {
  return n.toLocaleString('fr-FR') + ' €';
}

// --- MISE À JOUR UI ---
function bump(card) {
  card.classList.remove('bump');
  void card.offsetWidth;
  card.classList.add('bump');
}

function updateUI() {
  const { economie, joursGagnes, tempsPositif, diffMin, minVeloAn, ratio, minVeloSemaine, co2Economise, arbres } = calculate();

  // Argent
  valArgent.textContent = formatEuros(economie);
  equivArgent.textContent = getEquivalence(economie);
  bump(document.getElementById('cardArgent'));

  // Temps — toujours les deux lignes
  const heuresVelo   = Math.round(minVeloAn / 60);
  const heuresDelta  = Math.round(Math.abs(diffMin) / 60);
  document.getElementById('valTempsVelo').textContent = heuresVelo + ' h';
  document.getElementById('valTempsDelta').textContent = tempsPositif
    ? `dont ${heuresDelta} h économisées vs voiture 🚗`
    : `0 h économisées vs voiture 🚗`;
  bump(document.getElementById('cardTemps'));

  // Forme
  valForme.textContent = ratio + '×';
  bump(document.getElementById('cardForme'));

  // CO₂
  const co2Txt = co2Economise >= 1000
    ? (co2Economise / 1000).toFixed(1).replace('.', ',') + ' t'
    : co2Economise + ' kg';
  document.getElementById('valCo2').textContent = co2Txt;
  const co2Equiv = CO2_EQUIVALENCES.find(e => co2Economise <= e.max)?.label || CO2_EQUIVALENCES.at(-1).label;
  document.getElementById('equivCo2').textContent = co2Equiv;
  bump(document.getElementById('cardCo2'));

  // Amortissement
  updateAmort(economie / 12);

  // Ninja level
  updateNinja(minVeloSemaine);

  // Slider labels
  kmValue.textContent = kmSlider.value + ' km';
  joursValue.textContent = joursSlider.value + ' j';
}

// --- EVENTS INPUTS ---
kmSlider.addEventListener('input', updateUI);
joursSlider.addEventListener('input', updateUI);


btnUrbain.addEventListener('click', () => {
  contexte = 'urbain';
  btnUrbain.classList.add('active');
  btnPeriurbain.classList.remove('active');
  updateUI();
});
btnPeriurbain.addEventListener('click', () => {
  contexte = 'periurbain';
  btnPeriurbain.classList.add('active');
  btnUrbain.classList.remove('active');
  updateUI();
});

// --- PARAMÈTRES ---
settingsBtn.addEventListener('click', () => modalOverlay.classList.add('open'));
modalClose.addEventListener('click', () => modalOverlay.classList.remove('open'));
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('open');
});

vehiculeSelect.addEventListener('change', () => {
  coutKmInput.value = vehiculeSelect.value;
});

vitesseVoitureSlider.addEventListener('input', () => {
  vitesseVoitureVal.textContent = vitesseVoitureSlider.value + ' km/h';
});
vitesseveloSlider.addEventListener('input', () => {
  vitesseveloVal.textContent = vitesseveloSlider.value + ' km/h';
});
activiteOmsSlider.addEventListener('input', () => {
  activiteOmsVal.textContent = activiteOmsSlider.value + ' min/sem (OMS)';
});

const semainesSlider = document.getElementById('semainesTravail');
const semainesVal    = document.getElementById('semainesTravailVal');
semainesSlider.addEventListener('input', () => {
  const vacances = 52 - parseInt(semainesSlider.value);
  semainesVal.textContent = `${semainesSlider.value} sem (${vacances} sem de vacances)`;
});

btnReset.addEventListener('click', () => {
  params = { ...DEFAULTS };
  vehiculeSelect.value = '0.52';
  coutKmInput.value = DEFAULTS.coutKm;
  semainesSlider.value = DEFAULTS.semainesTravail;
  semainesVal.textContent = `${DEFAULTS.semainesTravail} sem (${52 - DEFAULTS.semainesTravail} sem de vacances)`;
  vitesseVoitureSlider.value = DEFAULTS.vitesseVoiture;
  vitesseVoitureVal.textContent = DEFAULTS.vitesseVoiture + ' km/h';
  vitesseveloSlider.value = DEFAULTS.vitessevelo;
  vitesseveloVal.textContent = DEFAULTS.vitessevelo + ' km/h';
  activiteOmsSlider.value = DEFAULTS.activiteOms;
  activiteOmsVal.textContent = DEFAULTS.activiteOms + ' min/sem (OMS)';
});

btnApply.addEventListener('click', () => {
  params.coutKm = parseFloat(coutKmInput.value) || DEFAULTS.coutKm;
  params.vitesseVoiture = parseInt(vitesseVoitureSlider.value);
  params.vitessevelo = parseInt(vitesseveloSlider.value);
  params.activiteOms = parseInt(activiteOmsSlider.value);
  params.semainesTravail = parseInt(semainesSlider.value);
  localStorage.setItem('captaincargo_params', JSON.stringify(params));
  modalOverlay.classList.remove('open');
  updateUI();
});

// --- PARTAGE ---
shareBtn.addEventListener('click', () => {
  const { economie, joursGagnes, tempsPositif, diffMin, minVeloAn, ratio, minVeloSemaine, co2Economise, arbres } = calculate();
  const km = kmSlider.value;
  const jours = joursSlider.value;
  const ctx = contexte;

  const url = `${location.origin}?km=${km}&jours=${jours}&ctx=${ctx}`;
  const texte = `J'ai simulé mon trajet sur CaptainCargo 🚲\n${joursGagnes} jours/an en moins dans les transports, ${formatEuros(economie)} économisés, et ${ratio}× l'activité physique recommandée.\nEt toi ? ${url}`;

  // Track partage
  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', {
      km: km, jours: jours, contexte: ctx,
      economie: economie, ratio_oms: ratio
    });
  }

  if (navigator.share) {
    navigator.share({ text: texte, url });
  } else {
    navigator.clipboard.writeText(texte).then(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    });
  }
});

// --- INIT DEPUIS URL ---
function initFromUrl() {
  const p = new URLSearchParams(location.search);
  if (p.get('km'))    kmSlider.value = p.get('km');
  if (p.get('jours')) joursSlider.value = p.get('jours');
  if (p.get('ctx') === 'periurbain') {
    contexte = 'periurbain';
    btnPeriurbain.classList.add('active');
    btnUrbain.classList.remove('active');
  }
}

// --- INIT PARAMS SAUVEGARDÉS ---
function loadSavedParams() {
  try {
    const saved = localStorage.getItem('captaincargo_params');
    if (saved) {
      params = { ...DEFAULTS, ...JSON.parse(saved) };
      coutKmInput.value = params.coutKm;
      vitesseVoitureSlider.value = params.vitesseVoiture;
      vitesseVoitureVal.textContent = params.vitesseVoiture + ' km/h';
      vitesseveloSlider.value = params.vitessevelo;
      vitesseveloVal.textContent = params.vitessevelo + ' km/h';
      activiteOmsSlider.value = params.activiteOms;
      activiteOmsVal.textContent = params.activiteOms + ' min/sem (OMS)';
    }
  } catch(e) {}
}

// --- AMORTISSEMENT ---
let amortMode = 'achat'; // 'achat' | 'location'
let amortVisible = false;

const amortToggle      = document.getElementById('amortToggle');
const amortChevron     = document.getElementById('amortChevron');
const amortSection     = document.getElementById('amortSection');
const amortResultWrapper = document.getElementById('amortResultWrapper');
const btnAchat         = document.getElementById('btnAchat');
const btnLocation      = document.getElementById('btnLocation');
const amortAchatBlock  = document.getElementById('amortAchatBlock');
const amortLocationBlock = document.getElementById('amortLocationBlock');
const prixVeloSlider   = document.getElementById('prixVelo');
const prixVeloVal      = document.getElementById('prixVeloVal');
const dureeAmortSlider = document.getElementById('dureeAmort');
const dureeAmortVal    = document.getElementById('dureeAmortVal');
const loyerSlider      = document.getElementById('loyerMensuel');
const loyerVal         = document.getElementById('loyerMensuelVal');
const valAmort         = document.getElementById('valAmort');
const labelAmort       = document.getElementById('labelAmort');
const equivAmort       = document.getElementById('equivAmort');

amortToggle.addEventListener('click', () => {
  amortVisible = !amortVisible;
  amortSection.style.display = amortVisible ? 'flex' : 'none';
  amortResultWrapper.style.display = amortVisible ? 'flex' : 'none';
  amortChevron.classList.toggle('open', amortVisible);
  if (amortVisible) updateUI();
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

function updateAmort(economieMensuelle) {
  if (!amortVisible) return;

  if (amortMode === 'achat') {
    const prix     = parseInt(prixVeloSlider.value);
    const duree    = parseInt(dureeAmortSlider.value);
    const coutMois = prix / duree;
    const gainNet  = economieMensuelle - coutMois;

    if (gainNet >= 0) {
      valAmort.textContent   = '+' + Math.round(gainNet) + ' €/mois';
      labelAmort.textContent = 'de gain net dès maintenant';
      equivAmort.textContent = `vélo amorti sur ${duree} mois · vous êtes déjà gagnant 🎉`;
    } else {
      const moisAmort = Math.ceil(prix / economieMensuelle);
      valAmort.textContent   = moisAmort + ' mois';
      labelAmort.textContent = "pour amortir le vélo cargo";
      equivAmort.textContent = `ensuite +${Math.round(economieMensuelle)} €/mois dans votre poche`;
    }
  } else {
    const loyer   = parseInt(loyerSlider.value);
    const gainNet = economieMensuelle - loyer;
    if (gainNet >= 0) {
      valAmort.textContent   = '+' + Math.round(gainNet) + ' €/mois';
      labelAmort.textContent = 'de gain net (loyer inclus)';
      equivAmort.textContent = 'la location se finance toute seule 🎉';
    } else {
      valAmort.textContent   = Math.round(Math.abs(gainNet)) + ' €/mois';
      labelAmort.textContent = 'restent à votre charge après économies';
      equivAmort.textContent = `soit ${Math.round(Math.abs(gainNet) * 12)} €/an nets`;
    }
  }
  bump(document.getElementById('cardAmort'));
}

// --- DÉMARRAGE ---
loadSavedParams();
initFromUrl();
updateUI();
