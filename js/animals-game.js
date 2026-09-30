// Benji's animals: a big picture, and three taps: say the name, play the real sound, next animal.
const $ = (s) => document.querySelector(s);
const root = $('#view-animals');
const els = {
  pic: $('#animal-pic'), img: $('#animal-img'), name: $('#animal-name'),
  lblName: $('#lbl-name'), lblSound: $('#lbl-sound'), lblNext: $('#lbl-next'),
  credits: $('#credits'), list: $('#credits-list'),
};
const UI = {
  en: { name: 'Name', sound: 'Sound', next: 'Next', speech: 'en-US' },
  es: { name: 'Nombre', sound: 'Sonido', next: 'Siguiente', speech: 'es-ES' },
};
const BACKGROUNDS = ['#ffe9b8', '#d6f0ff', '#e3f6d5', '#ffdfe6', '#e9e0ff', '#ffe2c7'];

let animals = [], index = 0, lang = 'en', audio = null, bound = false, loading = null;
try { if (localStorage.getItem('lang') === 'es') lang = 'es'; } catch (e) { /* default English */ }

export async function enter() {
  loading ??= fetch('data/animals.json', { cache: 'no-cache' }).then((r) => r.json()).then((list) => {
    animals = list;
    // warm the files so the first tap plays instantly
    list.forEach((a) => { const i = new Image(); i.src = `images/animals/${a.id}.svg`; });
    els.list.innerHTML = list.map((a) => `<li>${a.en}: “${a.credit.title}”, ${a.credit.artist}, ${a.credit.license} — <a href="${a.credit.url}" target="_blank" rel="noopener">source</a></li>`).join('');
  });
  await loading;
  if (!bound) bind();
  setLang(lang);
  show(index);
}

export function leave() { stopAudio(); speechSynthesis?.cancel(); els.credits.hidden = true; }

function show(i) {
  index = (i + animals.length) % animals.length;
  const a = animals[index];
  stopAudio(); speechSynthesis?.cancel();
  els.img.src = `images/animals/${a.id}.svg`;
  els.img.alt = a[lang];
  els.name.textContent = a[lang];
  root.style.setProperty('--animal-bg', BACKGROUNDS[index % BACKGROUNDS.length]);
  // preload this animal's sound
  audio = new Audio(a.sound); audio.preload = 'auto';
}

function stopAudio() { if (audio) { audio.pause(); audio.currentTime = 0; } }

function bounce() {
  els.pic.classList.remove('tap'); void els.pic.offsetWidth; els.pic.classList.add('tap');
}

function playSound() {
  speechSynthesis?.cancel();
  bounce();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function sayName() {
  if (!('speechSynthesis' in window)) return;
  stopAudio(); speechSynthesis.cancel(); bounce();
  const u = new SpeechSynthesisUtterance(animals[index][lang]);
  u.lang = UI[lang].speech; u.rate = 0.75;
  speechSynthesis.speak(u);
}

function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch (e) { /* not saved */ }
  root.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  els.lblName.textContent = UI[l].name; els.lblSound.textContent = UI[l].sound; els.lblNext.textContent = UI[l].next;
  if (animals.length) { const a = animals[index]; els.name.textContent = a[l]; els.img.alt = a[l]; }
  speechSynthesis?.cancel();
}

function bind() {
  bound = true;
  els.pic.addEventListener('click', playSound);
  $('#btn-sound').addEventListener('click', playSound);
  $('#btn-name').addEventListener('click', sayName);
  $('#btn-next').addEventListener('click', () => show(index + 1));
  root.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-credits').addEventListener('click', () => { els.credits.hidden = false; });
  $('#credits-close').addEventListener('click', () => { els.credits.hidden = true; });
  els.credits.addEventListener('click', (e) => { if (e.target === els.credits) els.credits.hidden = true; });
}
