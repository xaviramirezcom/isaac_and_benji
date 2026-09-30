"""Copies the chosen audition clips into sounds/animals/ and writes data/animals.json (names EN/ES + credits)."""
import json, os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A1 = json.load(open(f"{ROOT}/tools/audition/manifest.json")); A2 = json.load(open(f"{ROOT}/tools/audition2/manifest.json"))
# id, English, Spanish, (set, animal key, pick number)  -- picks were chosen by ear
ANIMALS = [
  ("dog", "Dog", "Perro", (A1, "dog", 3)), ("cat", "Cat", "Gato", (A1, "cat", 3)), ("cow", "Cow", "Vaca", (A1, "cow", 1)),
  ("pig", "Pig", "Cerdo", (A2, "pig", 1)), ("sheep", "Sheep", "Oveja", (A1, "sheep", 4)), ("horse", "Horse", "Caballo", (A1, "horse", 1)),
  ("duck", "Duck", "Pato", (A1, "duck", 1)), ("rooster", "Rooster", "Gallo", (A1, "rooster", 1)), ("chicken", "Hen", "Gallina", (A1, "chicken", 1)),
  ("goat", "Goat", "Cabra", (A1, "goat", 1)), ("donkey", "Donkey", "Burro", (A1, "donkey", 2)), ("frog", "Frog", "Rana", (A1, "frog", 1)),
  ("bird", "Bird", "Pájaro", (A2, "bird", 1)), ("bee", "Bee", "Abeja", (A2, "bee", 3)), ("owl", "Owl", "Búho", (A2, "owl", 1)),
  ("lion", "Lion", "León", (A1, "lion", 1)), ("tiger", "Tiger", "Tigre", (A2, "tiger", 1)),
]
os.makedirs(f"{ROOT}/sounds/animals", exist_ok=True)
out = []
for id_, en, es, (man, key, n) in ANIMALS:
    clip = man[key][n - 1]
    folder = "audition" if man is A1 else "audition2"
    shutil.copy(f"{ROOT}/tools/{folder}/{clip['file']}", f"{ROOT}/sounds/animals/{id_}.mp3")
    out.append(dict(id=id_, en=en, es=es, sound=f"sounds/animals/{id_}.mp3", credit=dict(title=clip["title"], artist=clip["artist"], license=clip["license"], url=clip["page"])))
json.dump(out, open(f"{ROOT}/data/animals.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "animals;", sum(os.path.getsize(f"{ROOT}/sounds/animals/{a['id']}.mp3") for a in out) // 1024, "KB of sound")
for a in out: print(a["id"], "|", a["credit"]["license"], "|", a["credit"]["artist"][:40])
