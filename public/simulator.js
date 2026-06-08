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

// --- CONSTANTES ---
const DEFAULTS = {
  coutKm: 0.52,
  vitesseVoiture: 14,
  vitessevelo: 15,
  semainesTravail: 47,
  parkingMois: 0,
};

const CO2_EQUIV = [
  { max: 0.005, label: "= 1 image générée par IA 🤖" },
  { max: 0.25,  label: "= 1 A/R boulangerie en voiture 🥖" },
  { max: 0.5,   label: "= 1 café (production + transport) ☕" },
  { max: 3,     label: "= 1 Big Mac 🍔" },
  { max: 6.5,   label: "= 1 poulet fermier du marché 🐔" },
  { max: 8,     label: "= 1 steak de bœuf 250g 🥩" },
  { max: 35,    label: "= fabrication d'un jean neuf 👖" },
  { max: 50,    label: "= 1 smartphone neuf (fabrication) 📱" },
  { max: 120,   label: "= 40 burgers 🍔" },
  { max: 180,   label: "= A/R Paris-Rennes en voiture 🚗" },
  { max: 320,   label: "= fabrication d'une grande TV 55\" 📺" },
  { max: 420,   label: "= A/R Paris-Berlin en road trip 🚗" },
  { max: 700,   label: "= fabrication d'un canapé 3 places 🛋️" },
  { max: 1000,  label: "= fabrication d'un frigo américain 🧊" },
  { max: 1300,  label: "= A/R Paris-Marrakech en voiture 🗺️" },
  { max: 1800,  label: "= fabrication d'une moto neuve 🏍️" },
  { max: Infinity, label: "= 1 vache entière 🐄" },
];

const ARGENT_EQUIV = [
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
let amortMode = 'achat';

// --- DOM ---
const kmSlider      = document.getElementById('kmSlider');
const kmValue       = document.getElementById('kmValue');
const joursSlider   = document.getElementById('joursSlider');
const joursValue    = document.getElementById('joursValue');
const btnUrbain     = document.getElementById('btnUrbain');
const btnPeriurbain = document.getElementById('btnPeriurbain');

const vehiculeSelect       = document.getElementById('vehiculeSelect');
const parkingSlider        = document.getElementById('parkingMois');
const parkingVal           = document.getElementById('parkingMoisVal');
const semainesSlider       = document.getElementById('semainesTravail');
const semainesVal          = document.getElementById('semainesTravailVal');
const vitesseVoitureSlider = document.getElementById('vitesseVoiture');
const vitesseVoitureVal    = document.getElementById('vitesseVoitureVal');

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

const shareBtn = document.getElementById('shareBtn');
const toast    = document.getElementById('toast');

// --- HELPERS ---
const fmt = n => n.toLocaleString('fr-FR') + ' €';
const bump = card => { card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump'); };
const getArgentEquiv = e => ARGENT_EQUIV.find(x => e <= x.max)?.label || ARGENT_EQUIV.at(-1).label;
const getCo2Equiv   = c => CO2_EQUIV.find(x => c <= x.max)?.label || CO2_EQUIV.at(-1).label;

// --- CALCUL ---
function calculate() {
  const kmJour = parseInt(kmSlider.value);
  const jours  = parseInt(joursSlider.value);
  const vitV   = contexte === 'urbain' ? params.vitesseVoiture : params.vitesseVoiture * 2.2;
  const vitVelo = params.vitessevelo;
  const kmAn   = kmJour * jours * params.semainesTravail;

  const economie     = Math.max(0, Math.round(kmAn * params.coutKm + params.parkingMois * 12 - 200));
  const minVoitureAn = (kmAn / vitV) * 60;
  const minVeloAn    = (kmAn / vitVelo) * 60;
  const diffMin      = minVoitureAn - minVeloAn;
  const minVeloSem   = (kmJour * jours / vitVelo) * 60;
  const ratio        = Math.round(minVeloSem / 150 * 10) / 10;
  const co2          = Math.round((0.180 - 0.010) * kmAn);

  return { economie, minVeloAn, diffMin, ratio, minVeloSem, co2 };
}

function calcAmort(economieMensuelle) {
  if (amortMode === 'achat') {
    const prix  = parseInt(prixVeloSlider.value);
    const duree = parseInt(dureeAmortSlider.value);
    const gain  = economieMensuelle - prix / duree;
    if (gain >= 0) return { val: '+' + Math.round(gain) + ' €/mois', label: 'de gain net dès maintenant', equiv: `amorti sur ${duree} mois · vous êtes gagnant 🎉` };
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
  const { economie, minVeloAn, diffMin, ratio, minVeloSem, co2 } = calculate();

  const heuresVelo  = Math.round(minVeloAn / 60);
  const heuresDelta = Math.round(Math.abs(diffMin) / 60);
  const tempsDelta  = diffMin > 0
    ? `dont ${heuresDelta} h économisées vs voiture 🚗`
    : `0 h économisées vs voiture 🚗`;
  const co2Txt   = co2 >= 1000 ? (co2/1000).toFixed(1).replace('.', ',') + ' t' : co2 + ' kg';
  const amort    = calcAmort(economie / 12);

  // --- Bloc 1 : jaune + temps ---
  document.getElementById('valArgent').textContent   = fmt(economie);
  document.getElementById('equivArgent').textContent = getArgentEquiv(economie);
  bump(document.getElementById('cardArgent'));

  document.getElementById('valTempsVelo').textContent  = heuresVelo + ' h';
  document.getElementById('valTempsDelta').textContent = tempsDelta;
  bump(document.getElementById('cardTemps'));

  // --- Bloc 2 : jaune + temps + vert + rose ---
  document.getElementById('valArgent2').textContent   = fmt(economie);
  document.getElementById('equivArgent2').textContent = getArgentEquiv(economie);
  bump(document.getElementById('cardArgent2'));

  document.getElementById('valTempsVelo2').textContent  = heuresVelo + ' h';
  document.getElementById('valTempsDelta2').textContent = tempsDelta;
  bump(document.getElementById('cardTemps2'));

  document.getElementById('valCo2').textContent   = co2Txt;
  document.getElementById('equivCo2').textContent = getCo2Equiv(co2);
  bump(document.getElementById('cardCo2'));

  document.getElementById('valForme').textContent = ratio + '×';
  bump(document.getElementById('cardForme'));

  // --- Amort ---
  document.getElementById('valAmort').textContent   = amort.val;
  document.getElementById('labelAmort').textContent = amort.label;
  document.getElementById('equivAmort').textContent = amort.equiv;
  bump(document.getElementById('cardAmort'));

  // --- Ninja ---
  updateNinja(minVeloSem);

  // --- Labels sliders ---
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
  const { economie, ratio, minVeloAn } = calculate();
  const url   = `${location.origin}?km=${kmSlider.value}&jours=${joursSlider.value}&ctx=${contexte}`;
  const texte = `J'ai simulé mon trajet sur Cargo Ninja 🚲\n${fmt(economie)} économisés/an, ${Math.round(minVeloAn/60)} h à vélo, et ${ratio}× la recommandation OMS.\nEt toi ? ${url}`;
  if (typeof gtag !== 'undefined') gtag('event', 'share', { km: kmSlider.value, jours: joursSlider.value, contexte, economie, ratio_oms: ratio });
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
