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
};

// Traductions économies → expériences (pas de voyage en avion)
const EQUIVALENCES = [
  { max: 200,  label: "= un bon resto en amoureux 🍷" },
  { max: 350,  label: "= une caisse de bon vin 🍾" },
  { max: 500,  label: "= un week-end spa pour deux 🧖" },
  { max: 700,  label: "= un vélo pour le gamin 🚲" },
  { max: 900,  label: "= un pass festival (Hellfest, Solidays…) 🎸" },
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

  const kmAn = kmJour * jours * 52;

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

  return { economie, joursGagnes, tempsPositif, diffMin, minVeloAn, ratio, minVeloSemaine };
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
  const { economie, joursGagnes, tempsPositif, diffMin, minVeloAn, ratio, minVeloSemaine } = calculate();

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

btnReset.addEventListener('click', () => {
  params = { ...DEFAULTS };
  vehiculeSelect.value = '0.52';
  coutKmInput.value = DEFAULTS.coutKm;
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
  localStorage.setItem('captaincargo_params', JSON.stringify(params));
  modalOverlay.classList.remove('open');
  updateUI();
});

// --- PARTAGE ---
shareBtn.addEventListener('click', () => {
  const { economie, joursGagnes, tempsPositif, diffMin, minVeloAn, ratio, minVeloSemaine } = calculate();
  const km = kmSlider.value;
  const jours = joursSlider.value;
  const ctx = contexte;

  const url = `${location.origin}?km=${km}&jours=${jours}&ctx=${ctx}`;
  const texte = `J'ai simulé mon trajet sur CaptainCargo 🚲\n${joursGagnes} jours/an en moins dans les transports, ${formatEuros(economie)} économisés, et ${ratio}× l'activité physique recommandée.\nEt toi ? ${url}`;

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
