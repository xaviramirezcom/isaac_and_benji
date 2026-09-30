"""Downloads the third-party data/libs the app needs (run once; results are committed/served locally)."""
import json, os, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0"}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()

def save(rel, data):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)

# libs
save("vendor/three.module.min.js", get("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js"))
# rewritten to a relative import so no import map is needed (works on older iPads)
save("vendor/OrbitControls.js", get("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js").replace(b"from 'three'", b"from './three.module.min.js'"))
save("vendor/topojson-client.min.js", get("https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"))
# world shapes
save("data/world-50m.json", get("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"))

# capitals
rc = json.loads(get("https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json"))
out = {}
for c in rc:
    if not c.get("ccn3"):
        continue
    out[c["ccn3"]] = {"name": c["name"]["common"], "cca2": c["cca2"].lower(),
                      "capital": (c.get("capital") or [""])[0]}
# Kosovo has no ISO numeric code
out["XK"] = {"name": "Kosovo", "cca2": "xk", "capital": "Pristina"}
save("data/countries.json", json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode())

# flags
codes = sorted({v["cca2"] for v in out.values()})
def flag(code):
    try:
        save(f"flags/{code}.svg", get(f"https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/{code}.svg"))
        return None
    except Exception as e:
        return (code, str(e))
with cf.ThreadPoolExecutor(12) as ex:
    fails = [r for r in ex.map(flag, codes) if r]
print("countries:", len(out), "flags:", len(codes) - len(fails), "failed:", fails)
