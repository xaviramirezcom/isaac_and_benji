"""Downloads the fruit pictures and the teddy: Microsoft Fluent Emoji (3D style, MIT licence) -> images/fruits/<id>.png"""
import os, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLUENT = {"apple": "Red apple", "greenapple": "Green apple", "banana": "Banana", "grapes": "Grapes", "strawberry": "Strawberry", "orange": "Tangerine", "watermelon": "Watermelon",
          "pear": "Pear", "peach": "Peach", "cherries": "Cherries", "pineapple": "Pineapple", "mango": "Mango", "lemon": "Lemon", "kiwi": "Kiwi fruit", "blueberries": "Blueberries", "teddy": "Teddy bear"}
os.makedirs(f"{ROOT}/images/fruits", exist_ok=True)
for id_, folder in FLUENT.items():
    stem = folder.lower().replace(" ", "_") + "_3d.png"
    url = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/" + urllib.parse.quote(f"{folder}/3D/{stem}")
    try:
        open(f"{ROOT}/images/fruits/{id_}.png", "wb").write(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read())
    except Exception as e:
        print("FAILED", id_, folder, e)
print("done", len(FLUENT))
