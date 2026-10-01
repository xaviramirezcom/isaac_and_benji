# Isaac & Benji

A tiny web app of calm, simple games for two brothers. Works on tablet and iPhone, installs to the home screen, and works offline.

- **Home** – pick Isaac or Benji.
- **Isaac → World Map** – a 3D globe where every country is painted with its flag. Drag to spin, pinch (or use ＋/－) to zoom, tap a country to see its flag, name and capital. 🔊 reads it aloud, 🎲 jumps to a random country.
- **Isaac → Insects** – three insects in 3D (whymper's chafer beetle *Paulosawaya whymperi*, honey bee, carpenter ant), built in code with real anatomy: swipe to turn, pinch to zoom, tap a part to learn about it, remove parts, show only one part, or explode the whole insect. EN/ES, spoken names.
- **Benji → Animals** – a big picture of an animal with three big taps: say the name (🗣️), play the real animal sound (🔊), next animal (➡️). Tapping the picture also plays the sound. EN/ES switch, credits under ⓘ. 17 animals.

## Run it

No build step and no Node needed:

```bash
python3 -m http.server 8123
```

Open http://localhost:8123. To try it on an iPad/iPhone on the same Wi-Fi, open `http://<your-mac-ip>:8123` in Safari.

For the offline / "Add to Home Screen" (full-screen app) experience, host the folder anywhere with HTTPS (Netlify Drop, Cloudflare Pages, GitHub Pages…), open it in Safari → Share → **Add to Home Screen**.

## Layout

```
index.html, css/style.css      shell + styling
js/app.js                      hash router (#/ · #/isaac · #/benji · #/isaac/map)
js/map-game.js                 the globe game
sw.js, manifest.webmanifest    offline + installable app
data/ flags/ vendor/ icons/    downloaded once by tools/fetch_data.py and tools/make_icons.py
js/insects-game.js            Isaac's 3D insect viewer; models in js/insects/ (lib.js toolkit, beetle.js, bee.js, ant.js)
js/animals-game.js             Benji's animals game (data/animals.json, sounds/animals/, images/animals/)
tools/build_animal_audio.py    finds real recordings (BigSoundBank CC0, Wikimedia Commons), trims them, builds audition pages
tools/fetch_animal_images.py    downloads the animal pictures (Microsoft Fluent Emoji 3D, MIT)
tools/pick_animals.py          copies the clips chosen by ear into sounds/animals/ and writes data/animals.json
```

Adding a game for Isaac: add a tile in `#view-isaac` (index.html), a route in `js/app.js`.
