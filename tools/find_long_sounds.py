"""Finds Commons animal recordings that are really >=5s long (after trimming leading silence). Writes scratchpad/long.json"""
import json, os, re, subprocess, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
SCR = "/private/tmp/claude-501/-Users-heyxavi-code-issac-and-benji/6673d245-be3c-4860-b9a6-799b7790e170/scratchpad"
CACHE = SCR + "/raw"; os.makedirs(CACHE, exist_ok=True)
UA = {"User-Agent": "isaac-benji-app/1.0 (admin@dreamcode.io)"}
Q = {
 "dog": ["dog barking", "barking dog", "dogs barking", "Canis familiaris barking", "puppy barking"],
 "cat": ["cat meowing", "cat meow", "cats meowing", "kitten meowing", "Felis catus vocalization", "cat purring"],
 "cow": ["cow mooing", "cows mooing", "cow moo", "cattle lowing", "calf mooing", "cow bellowing"],
 "pig": ["pig grunting", "pigs grunting", "pig squealing", "pigs oinking", "pig sound", "piglets squealing", "hog"],
 "sheep": ["sheep bleating", "sheep baa", "flock of sheep", "lamb bleating", "sheep sound"],
 "horse": ["horse neighing", "horse whinny", "horse sound", "horse nicker", "horses neigh"],
 "duck": ["duck quacking", "ducks quacking", "mallard quacking", "duck sound", "ducks on pond"],
 "rooster": ["rooster crowing", "rooster crow", "cock crowing", "roosters crowing"],
 "chicken": ["chicken clucking", "hen clucking", "chickens clucking", "hens cackling", "chicken sound"],
 "goat": ["goat bleating", "goats bleating", "goat sound", "goat baa", "kid goat"],
 "lion": ["lion roaring", "lion roar", "lions roaring", "lion sound", "Panthera leo"],
 "elephant": ["elephant trumpeting", "elephant trumpet", "elephant sound", "elephant rumble", "elephants"],
 "frog": ["frog croaking", "frogs croaking", "frog sound", "frogs calling", "frog call", "tree frog"],
}
BAD = re.compile(r"^file:(en-|de-|fr-|es-|it-|ll-q|man |woman |alarm|.*pronunc|.*\b(song|rag|blues|speech|interview)\b)", re.I)
OKL = ("CC0", "Public domain", "CC BY ", "CC BY-SA", "Attribution", "PD")
def api(**p):
    p["format"] = "json"
    return json.load(urllib.request.urlopen(urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p), headers=UA), timeout=60))
def dur(path):
    try:
        out = subprocess.check_output(["ffmpeg", "-i", path, "-af", "silenceremove=start_periods=1:start_threshold=-45dB", "-f", "null", "-"], stderr=subprocess.STDOUT, timeout=60).decode()
        t = re.findall(r"time=(\d+):(\d+):([\d.]+)", out)[-1]
        return int(t[0]) * 3600 + int(t[1]) * 60 + float(t[2])
    except Exception: return 0
def check(c):
    raw = os.path.join(CACHE, re.sub(r"[^A-Za-z0-9.]+", "_", c["title"]))
    try:
        if not os.path.exists(raw):
            open(raw, "wb").write(urllib.request.urlopen(urllib.request.Request(c["url"], headers=UA), timeout=120).read())
        c["secs"] = round(dur(raw), 1)
    except Exception as e: c["secs"] = 0
    return c
res = {}
for animal, qs in Q.items():
    pool = {}
    for q in qs:
        r = api(action="query", generator="search", gsrsearch=f"{q} filetype:audio", gsrnamespace=6, gsrlimit=30, prop="imageinfo", iiprop="url|extmetadata|size", iiextmetadatafilter="LicenseShortName|Artist")
        for pg in (r.get("query", {}).get("pages", {}) or {}).values():
            ii = pg["imageinfo"][0]; m = ii["extmetadata"]; lic = m.get("LicenseShortName", {}).get("value", "")
            if lic.startswith(OKL) and not BAD.search(pg["title"]) and 30_000 < ii["size"] < 6_000_000:
                pool[pg["title"]] = dict(title=pg["title"], url=ii["url"], license=lic, size=ii["size"],
                    artist=re.sub(r"\s+", " ", re.sub("<[^>]+>", "", m.get("Artist", {}).get("value", ""))).strip()[:90],
                    page="https://commons.wikimedia.org/wiki/" + urllib.parse.quote(pg["title"].replace(" ", "_")))
    with ThreadPoolExecutor(6) as ex: items = list(ex.map(check, pool.values()))
    longs = sorted([c for c in items if c["secs"] >= 5], key=lambda c: c["secs"])
    res[animal] = longs
    print(animal, f"{len(longs)}/{len(items)} long:", [(c["title"][5:38], c["license"], c["secs"]) for c in longs[:8]], flush=True)
json.dump(res, open(SCR + "/long.json", "w"), indent=1, ensure_ascii=False)
