"""Adds Spanish names (mledoze/countries) and Spanish capitals (Wikidata) to data/countries.json. Run after fetch_data.py."""
import json, os, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "isaac-benji-app/1.0 (admin@dreamcode.io)"}
get = lambda url: urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()

path = os.path.join(ROOT, "data/countries.json")
data = json.load(open(path))

names = {c["ccn3"]: c["translations"]["spa"]["common"] for c in json.loads(get("https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json")) if c.get("ccn3")}
q = '''SELECT ?num ?capEn ?capEs WHERE { ?c wdt:P299 ?num. ?c wdt:P36 ?cap.
 ?cap rdfs:label ?capEn. FILTER(LANG(?capEn)="en") ?cap rdfs:label ?capEs. FILTER(LANG(?capEs)="es") }'''
rows = json.loads(get("https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q)))["results"]["bindings"]
caps = {}
for r in rows:
    caps.setdefault(r["num"]["value"], []).append((r["capEn"]["value"], r["capEs"]["value"]))

# Hand-made fixes for things the sources miss
MANUAL = {"XK": ("Kosovo", "Pristina"), "010": ("Antártida", ""), "732": (None, "El Aaiún"), "275": (None, "Ramala"), "344": (None, "Victoria"), "580": (None, "Saipán")}
missing = []
for key, c in data.items():
    c["nameEs"] = names.get(key) or c["name"]
    c["capitalEs"] = ""
    if c["capital"]:
        options = caps.get(key, [])
        match = next((es for en, es in options if en.lower() == c["capital"].lower()), None) or (options[0][1] if options else None)
        if match: c["capitalEs"] = match
        else: c["capitalEs"] = c["capital"]; missing.append((c["name"], c["capital"]))
    if key in MANUAL:
        n, cap = MANUAL[key]
        if n: c["nameEs"] = n
        if cap or key == "010": c["capitalEs"] = cap
json.dump(data, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
print("countries:", len(data), "| capitals kept in English (no Spanish found):", missing)
