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
  vitesseVoiture: 14,
  vitessevelo: 15,
  activiteOms: 150,   // fixé OMS, non modifiable
  semainesTravail: 47,
  parkingMois: 0,
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

// Traductions économies → expériences
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

// --- ÉTAT ---
let params = { ...DEFAULTS };
let contexte = 'urbain';

// --- DOM : TRAJET ---
const kmSlider      = document.getElementById('kmSlider');
const kmValue       = document.getElementById('kmValue');
const joursSlider   = document.getElementById('joursSlider');
const joursValue    = document.getElementById('joursValue');
const btnUrbain     = document.getElementById('btnUrbain');
const btnPeriurbain = document.getElementById('btnPeriurbain');

// --- DOM : PARAMS INLINE ---
const vehiculeSelect       = document.getElementById('vehiculeSelect');
const parkingSlider        = document.getElementById('parkingMois');
const parkingVal           = document.getElementById('parkingMoisVal');
const semainesSlider       = document.getElementById('semainesTravail');
const semainesVal          = document.getElementById('semainesTravailVal');
const vitesseVoitureSlider = document.getElementById('vitesseVoiture');
const vitesseVoitureVal    = document.getElementById('vitesseVoitureVal');

// --- DOM : RÉSULTATS ---
const valArgent    = document.getElementById('valArgent');
const equivArgent  = document.getElementById('equivArgent');
const valForme     = document.getElementById('valForme');
const shareBtn     = document.getElementById('shareBtn');
const toast        = document.getElementById('toast');

// --- DOM : AMORTISSEMENT ---
let amortMode = 'achat';
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
const valAmort           = document.getElementById('valAmort');
const labelAmort         = document.getElementById('labelAmort');
const equivAmort         = document.getElementById('equivAmort');

// --- DOM : STICKY ---
const stickySummary = document.getElementById('stickySummary');

// --- HELPERS ---
function getEquivalence(euros) {
  return EQUIVALENCES.find(e => euros <= e.max)?.label || EQUIVALENCES.at(-1).label;
}
function formatEuros(n) {
  return n.toLocaleString('fr-FR') + ' €';
}
function bump(card) {
  card.classList.remove('bump');
  void card.offsetWidth;
  card.classList.add('bump');
}

// --- CALCUL ---
function calculate() {
  const kmJour = parseInt(kmSlider.value);
  const jours  = parseInt(joursSlider.value);

  const vitVoiture = contexte === 'urbain' ? params.vitesseVoiture : params.vitesseVoiture * 2.2;
  const vitVelo    = params.vitessevelo;
  const kmAn = kmJour * jours * params.semainesTravail;

  // 1. ARGENT
  const parkingAn     = params.parkingMois * 12;
  const coutVoitureAn = kmAn * params.coutKm + parkingAn;
  const coutVeloAn    = 200;
  const economie      = Math.max(0, Math.round(coutVoitureAn - coutVeloAn));

  // 2. TEMPS
  const minVoitureAn  = (kmAn / vitVoiture) * 60;
  const minVeloAn     = (kmAn / vitVelo) * 60;
  const diffMin       = minVoitureAn - minVeloAn;
  const tempsPositif  = diffMin > 0;

  // 3. FORME (OMS fixé à 150 min/sem)
  const minVeloSemaine = (kmJour * jours / vitVelo) * 60;
  const ratio = Math.round(minVeloSemaine / 150 * 10) / 10;

  // 4. CO₂
  const co2Economise = Math.round((0.180 - 0.010) * kmAn);
  const arbres = Math.round(co2Economise / 25);

  return { economie, diffMin, minVeloAn, tempsPositif, ratio, minVeloSemaine, co2Economise, arbres };
}

// --- MISE À JOUR AMORTISSEMENT ---
function updateAmort(economieMensuelle) {
  if (amortMode === 'achat') {
    const prix    = parseInt(prixVeloSlider.value);
    const duree   = parseInt(dureeAmortSlider.value);
    const gainNet = economieMensuelle - prix / duree;

    if (gainNet >= 0) {
      valAmort.textContent   = '+' + Math.round(gainNet) + ' €/mois';
      labelAmort.textContent = 'de gain net dès maintenant';
      equivAmort.textContent = `vélo amorti sur ${duree} mois · vous êtes gagnant 🎉`;
    } else {
      const moisAmort = Math.ceil(prix / economieMensuelle);
      valAmort.textContent   = moisAmort + ' mois';
      labelAmort.textContent = 'pour amortir le vélo cargo';
      equivAmort.textContent = `ensuite +${Math.round(economieMensuelle)} €/mois dans la poche`;
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

// --- MISE À JOUR UI ---
function updateUI() {
  const { economie, diffMin, minVeloAn, tempsPositif, ratio, minVeloSemaine, co2Economise } = calculate();

  // Argent
  valArgent.textContent = formatEuros(economie);
  equivArgent.textContent = getEquivalence(economie);
  bump(document.getElementById('cardArgent'));

  // Temps
  const heuresVelo  = Math.round(minVeloAn / 60);
  const heuresDelta = Math.round(Math.abs(diffMin) / 60);
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

  // Ninja
  updateNinja(minVeloSemaine);

  // Labels sliders
  kmValue.textContent    = kmSlider.value + ' km';
  joursValue.textContent = joursSlider.value + ' j';

  // Sticky summary
  const amortTxt = valAmort.textContent;
  document.getElementById('stickyArgent').textContent = formatEuros(economie);
  document.getElementById('stickyAmort').textContent  = amortTxt;
  document.getElementById('stickyTemps').textContent  = Math.round(minVeloAn / 60) + ' h';
  document.getElementById('stickyCo2').textContent    = co2Txt;
  document.getElementById('stickyForme').textContent  = ratio + '×';
}

// --- EVENTS : TRAJET ---
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

// --- EVENTS : PARAMS INLINE ---
vehiculeSelect.addEventListener('change', () => {
  params.coutKm = parseFloat(vehiculeSelect.value);
  updateUI();
});

parkingSlider.addEventListener('input', () => {
  const v = parseInt(parkingSlider.value);
  parkingVal.textContent = v === 0 ? '0 €' : v + ' €/mois';
  params.parkingMois = v;
  updateUI();
});

semainesSlider.addEventListener('input', () => {
  params.semainesTravail = parseInt(semainesSlider.value);
  semainesVal.textContent = semainesSlider.value + ' sem';
  updateUI();
});

vitesseVoitureSlider.addEventListener('input', () => {
  params.vitesseVoiture = parseInt(vitesseVoitureSlider.value);
  vitesseVoitureVal.textContent = vitesseVoitureSlider.value + ' km/h';
  updateUI();
});

// --- EVENTS : AMORTISSEMENT ---
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

// --- STICKY SCROLL ---
const resultsSection = document.getElementById('resultsSection');
const observer = new IntersectionObserver(([entry]) => {
  stickySummary.classList.toggle('visible', !entry.isIntersecting);
}, { threshold: 0 });
observer.observe(resultsSection);

// --- PARTAGE ---
shareBtn.addEventListener('click', () => {
  const { economie, ratio, minVeloAn } = calculate();
  const km   = kmSlider.value;
  const jours = joursSlider.value;
  const url  = `${location.origin}?km=${km}&jours=${jours}&ctx=${contexte}`;
  const texte = `J'ai simulé mon trajet sur Cargo Ninja 🚲\n${formatEuros(economie)} économisés/an, ${Math.round(minVeloAn/60)} h à vélo, et ${ratio}× l'activité OMS.\nEt toi ? ${url}`;

  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', { km, jours, contexte, economie, ratio_oms: ratio });
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

// --- DÉMARRAGE ---
initFromUrl();
updateUI();
