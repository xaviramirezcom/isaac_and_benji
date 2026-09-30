"""Downloads the animal pictures: Microsoft Fluent Emoji (3D style, MIT licence) -> images/animals/<id>.png"""
import os, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# animal id -> Fluent emoji folder / file stem
FLUENT = {"dog": "Dog", "cat": "Cat", "cow": "Cow", "pig": "Pig", "sheep": "Ewe", "horse": "Horse", "duck": "Duck", "rooster": "Rooster",
          "chicken": "Chicken", "goat": "Goat", "donkey": "Donkey", "frog": "Frog", "bird": "Bird", "bee": "Honeybee", "owl": "Owl", "lion": "Lion", "tiger": "Tiger"}
os.makedirs(f"{ROOT}/images/animals", exist_ok=True)
for id_, folder in FLUENT.items():
    stem = folder.lower().replace(" ", "_") + "_3d.png"
    url = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/" + urllib.parse.quote(f"{folder}/3D/{stem}")
    open(f"{ROOT}/images/animals/{id_}.png", "wb").write(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read())
print("ok", len(FLUENT))
