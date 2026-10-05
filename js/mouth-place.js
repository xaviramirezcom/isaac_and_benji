// A little helper page (#/benji/numbers/place): tap the two ends of each animal's mouth, see it open and close, copy the numbers.
import { MOUTH } from './mouths.js';
const $ = (s) => document.querySelector(s);
let animals = [], i = 0, a = null, b = null, tmr = 0;
const res = JSON.parse(localStorage.getItem('mouths2') || 'null') ?? JSON.parse(JSON.stringify(MOUTH));
const box = $('#pl-box'), mo = $('#pl-mouth');

function apply(id) {
  const m = res[id] ?? [50, 60, 10, 0, 6]; mo.style.left = `${m[0]}%`; mo.style.top = `${m[1]}%`; mo.style.width = `${m[2]}%`; mo.style.height = `${m[4]}%`; mo.style.setProperty('--rot', `${m[3]}deg`);
}
function show() {
  const an = animals[i]; $('#pl-name').textContent = an.en; $('#pl-count').textContent = `${i + 1}/${animals.length}`; $('#pl-img').src = `images/animals/${an.id}.png`; apply(an.id); a = b = null; $('#pl-a').style.display = $('#pl-b').style.display = 'none';
  $('#pl-help').textContent = 'Tap the two ends of the mouth (the red shape is the current guess)';
}
function save() { localStorage.setItem('mouths2', JSON.stringify(res)); $('#pl-out').textContent = JSON.stringify(res); }
function pct(e) { const r = box.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100]; }

function bind() {
  box.addEventListener('pointerdown', (e) => {
    const p = pct(e), id = animals[i].id;
    if (!a || b) { a = p; b = null; $('#pl-a').style.cssText = `display:block;left:${p[0]}%;top:${p[1]}%`; $('#pl-b').style.display = 'none'; $('#pl-help').textContent = 'Now tap the other end of the mouth'; return; }
    b = p; $('#pl-b').style.cssText = `display:block;left:${p[0]}%;top:${p[1]}%`;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); let ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    const old = res[id] ?? [50, 60, 10, 0, 6]; res[id] = [+((a[0] + b[0]) / 2).toFixed(1), +((a[1] + b[1]) / 2).toFixed(1), +len.toFixed(1), +ang.toFixed(0), old[4]]; apply(id); save();
    $('#pl-help').textContent = 'Saved. Use Taller / Shorter for the opening, then Next.';
  });
  const tall = (d) => { const id = animals[i].id; res[id][4] = Math.max(2, +(res[id][4] + d).toFixed(1)); apply(id); save(); };
  $('#pl-tall').addEventListener('click', () => tall(1)); $('#pl-short').addEventListener('click', () => tall(-1));
  $('#pl-next').addEventListener('click', () => { i = (i + 1) % animals.length; show(); }); $('#pl-prev').addEventListener('click', () => { i = (i + animals.length - 1) % animals.length; show(); });
  $('#pl-copy').addEventListener('click', () => { save(); const out = $('#pl-out'); out.hidden = false; try { navigator.clipboard.writeText(out.textContent); } catch { /* select by hand */ } });
}
let bound = false;
export async function enter() {
  if (!animals.length) animals = await fetch('data/animals.json').then((r) => r.json());
  if (!bound) { bound = true; bind(); }
  show(); clearInterval(tmr); let open = 0; tmr = setInterval(() => { open = open ? 0 : 1; mo.style.setProperty('--open', open); }, 800);
}
export function leave() { clearInterval(tmr); }
