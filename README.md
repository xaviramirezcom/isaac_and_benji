# Isaac & Benji

A tiny web app of calm, simple games for two brothers. Works on tablet and iPhone, installs to the home screen, and works offline.

- **Home** – pick Isaac or Benji.
- **Isaac → World Map** – a 3D globe where every country is painted with its flag. Drag to spin, pinch (or use ＋/－) to zoom, tap a country to see its flag, name and capital. 🔊 reads it aloud, 🎲 jumps to a random country.
- **Isaac → Insects** – seven little creatures in 3D (Whymper's chafer beetle *Paulosawaya whymperi*, honey bee, carpenter ant, ladybug, housefly, jumping spider, giant centipede), built in code with real anatomy: swipe to turn, pinch to zoom, tap a part to learn about it, remove parts, show only one part, or explode the whole insect. EN/ES, spoken names. **Walk** and **Fly** buttons bring them to life: insects walk on alternating tripods, the spider on alternating sets of four legs, the centipede ripples its body with a wave of legs, and the flyers lift their wing covers, unfold their wings and hover (ant and spider only walk).
- **Benji → Numbers** – count the animals, 1–10. A number bubble appears on one side and that many animals (one kind, a different kind each round) on the other, smaller the more there are. Benji drags the number onto the animals: the bubble pops away and the app counts them out loud (recorded EN/ES voice), lighting each animal up with its own number badge, then says the number once more. A few seconds later the next number comes. No wrong answers and no autoplay: after ~9 s a ghost hand shows the move, but nothing is counted unless he drags the number.
- **Benji → Fruits** – pretend play for flexible thinking: a different animal (from the Animals game, or the teddy) is hungry every round and shows the fruit it wants in a thought bubble; Benji drags that fruit from the table to its mouth (it opens as the fruit comes close), it munches, hears "mmm" and the fruit's name (EN/ES recorded voices), then the animal says thanks in its own voice. Next round the request AND the friend change. A wrong fruit is never an error: the friend shakes its head and the fruit slides back. Nothing is said or eaten unless he touches something; a ghost hand hints after 12 s. After 5 fruits the scene changes colour.
- **Isaac → Space** – the Sun, 8 planets, Pluto and the main moons in 3D (swipe to turn, pinch to zoom, tap a body or pick one from the chips). Every body is a sleepy face carved into its surface (it turns with the planet; moons are tidally locked, so their face always looks at their planet; Uranus rolls on its side): it appears from nothing when you press **Wake up** on its card, and fades away again on **Sleep**. EN/ES facts, ⏸ to pause the orbits.
- **Isaac → Storms** – a 3D town (32 houses plus a downtown with glass towers, apartments, shops, gas station, school, football field, church, big-box store with a parking lot, warehouses, water tower, mobile home park, railway with a freight train, farm with barn and silos, billboards, cars, trees) you run a **tornado (EF0–EF5, Enhanced Fujita scale)** , a **storm (rain shower → thunderstorm → severe thunderstorm with hail → derecho)** or a **hurricane (Saffir–Simpson categories 1–5, with a calm clear eye, an eyewall of the strongest wind, spiral rain bands and a storm-surge flood that rises over the town, floats cars and drains as the storm moves away)** through. One finger drags the storm, two fingers turn/pinch the camera. The wind field is a Burgers–Rott vortex (tornado) or a downburst (storm); every roof, wall, garage door, car, tree, fence and pole lets go near the wind speed where it fails in real life, then is thrown by drag + gravity and breaks into boards, plywood, shingles, siding, bricks and branches. Live damage counter, path scar on the ground, hail, lightning, rain, slow motion, optional synthesized sound, EN/ES.
- **Benji → Animals** – a big picture of an animal with two big arrows (previous ◀ / next ▶, no swiping) and the animal's name in a colourful bubble underneath inside a soap bubble: pop the bubble and the name is set free (said aloud, with a pop sound); it also pops by itself after the animal's sound. Arriving at an animal plays its real sound, then its name 500 ms after the sound ends; tap the picture to hear it again. Tapping the picture also plays the sound. EN/ES switch, credits under ⓘ. 17 animals.

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
js/space-game.js              Isaac's solar system (planet data + procedural textures in js/space/bodies.js)
js/insects-game.js            Isaac's 3D insect viewer; models in js/insects/ (lib.js toolkit, beetle.js, bee.js, ant.js, ladybug.js, fly.js, spider.js, centipede.js)
js/animals-game.js             Benji's animals game (data/animals.json, sounds/animals/, images/animals/)
tools/build_animal_audio.py    finds real recordings (BigSoundBank CC0, Wikimedia Commons), trims them, builds audition pages
tools/devserver.py             local server with caching off: python3 tools/devserver.py
tools/fetch_animal_images.py    downloads the animal pictures (Microsoft Fluent Emoji 3D, MIT)
tools/pick_animals.py          copies the clips chosen by ear into sounds/animals/ and writes data/animals.json
```

Adding a game for Isaac: add a tile in `#view-isaac` (index.html), a route in `js/app.js`.

## Isaac — Body (`#/isaac/body`)
A human body (realistic outline) in **2D** (SVG) or **3D** (three.js, turn it with a finger) with 9 organs to put in and take out: brain, heart, lungs, stomach, liver, kidneys, small and large intestine, bladder.
Drag an organ from the tray onto the body (its outline lights up where it lives; dropped anywhere on the body it glides home), drag it out or tap it and press the arrow to take it out. Tap an organ for what it does (heart beats, lungs breathe), 🔊 reads it, (i) has grown-up facts. Voices: `python3 tools/build_body_voices.py` (names + one-line jobs, EN/ES, from `data/body.json`). Code: `js/body-game.js`, `js/body/shapes.js` (2D shapes, silhouette), `js/body/model3d.js` (procedural 3D).
