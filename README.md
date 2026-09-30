# Isaac & Benji

A tiny web app of calm, simple games for two brothers. Works on tablet and iPhone, installs to the home screen, and works offline.

- **Home** – pick Isaac or Benji.
- **Isaac → World Map** – a 3D globe where every country is painted with its flag. Drag to spin, pinch (or use ＋/－) to zoom, tap a country to see its flag, name and capital. 🔊 reads it aloud, 🎲 jumps to a random country.
- **Benji** – placeholder, games coming.

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
```

Adding a game for Isaac: add a tile in `#view-isaac` (index.html), a route in `js/app.js`.
