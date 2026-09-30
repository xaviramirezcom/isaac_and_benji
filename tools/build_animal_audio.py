"""Builds the animal sound candidates: real recordings >= 5 s, trimmed to <= 8 s, loudness-normalised, MP3 (iPhone-safe).
Sources: BigSoundBank (CC0, Joseph Sardin) + Wikimedia Commons (public domain / CC) for lion.
Usage: python3 tools/build_animal_audio.py   -> tools/audition/*.mp3 + manifest.json (to listen and pick from)
"""
import json, os, re, subprocess, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys
SET = sys.argv[1] if len(sys.argv) > 1 else "first"
OUT = os.path.join(ROOT, "tools/audition" if SET == "first" else "tools/audition2")
CACHE = "/private/tmp/claude-501/-Users-heyxavi-code-issac-and-benji/6673d245-be3c-4860-b9a6-799b7790e170/scratchpad/raw2"
UA = {"User-Agent": "Mozilla/5.0 (isaac-benji-app; admin@dreamcode.io)"}
MIN_SECS, MAX_SECS, PER_ANIMAL = 5.0, 8.0, 4
os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)

BSB = {  # animal -> BigSoundBank page slugs
  "dog": ["2-dogs-barking-s0868", "barking-dog-2-s2954", "barking-dog-3-s2955", "barking-dog-inside-s0112", "barking-dog-s0916", "barking-of-a-spitz-s0682", "barking-dogs-s0288", "old-dog-barking-1-s2352", "old-dog-barking-2-s2353", "small-dog-barking-behind-door-s3537"],
  "cat": ["meow-cat-1-s1889", "meow-cat-10-s1898", "meow-cat-11-s1899", "meow-cat-12-s1900", "little-meow-of-a-cat-s0494", "little-meow-of-a-cat-11-s1481", "cat-complaining-s0658"],
  "cow": ["cow-moos-s0546", "cow-moos-2-s2382", "cow-moos-3-s2383", "cow-moos-4-s2384", "cow-moos-5-s2385", "cow-moos-6-s2386", "moo-s0845", "barn-with-cows-1-s0991"],
  "sheep": [f"sheep-{i}-s{2342 + i}" for i in range(1, 10)] + ["herd-of-300-sheep-1-s2971", "herd-of-300-sheep-2-s2972", "flock-sheep-and-cows-s3220"],
  "goat": ["bleating-goat-1-s0279", "bleating-goat-2-s0280", "dwarf-goat-bleating-s0880", "goat-1-s1380", "goat-2-s1381", "goat-and-young-goat-s1377"],
  "horse": ["horse-neighing-3-s0863", "horse-neighing-4-s1541", "horse-neighing-5-s1542", "neighing-horse-2-s0859", "neighing-of-a-horse-1-s0284", "neighing-of-a-horse-s0460", "horse-neighbors-s0511"],
  "duck": ["ducks-s0276"],
  "rooster": ["song-of-rooster-s0283", "cock-song-1-s0440", "cock-song-2-s0441", "cockerel-first-song-s0955", "crowing-4-s0704", "rooster-s0104", "song-of-a-rooster-s0474"],
  "chicken": ["annoyed-hen-s0453", "hen-lays-1-s0975", "hen-lays-3-s0977", "hens-lays-s0978", "hen-scared-s1040", "hens-worried-s1039", "henhouse-s0282"],
  "donkey": ["donkey-braying-1-s1549", "donkey-braying-2-s1550", "donkey-braying-3-s1551", "donkeys-braying-s1548"],
  "frog": ["frogs-1-s0997", "frogs-2-s0998", "one-frog-s0819", "song-of-the-common-midwife-toad-1-s1053"],
}
COMMONS = {
  "lion": ["File:Lion Mad.ogg", "File:Lion raring-sound1TamilNadu178.ogg"],
  "cat": ["File:Meow of a pleading cat.oga", "File:Felis silvestris catus meows.ogg", "File:Audio file of cat meowing.ogg"],
  "sheep": ["File:Sheep bleating.ogg"],
}

if SET == "new":
    BSB = {
      "bee": ["bumblebee-1-s1000", "bumblebee-2-s1001", "solitary-bees-or-flies-s0101"],
      "bird": ["common-nightingale-3-s3088", "eurasian-blackcap-1-s3466", "common-nightingale-1-s3086", "carrion-crow-4-s3464"],
      "owl": ["tawny-owl-1-s1763", "tawny-owl-2-s1764", "barn-owl-s1400"],
      "pig": ["grumpy-pig-2-s1659"],
    }
    _E = "File:Bee-Threat-Elicits-Alarm-Call-in-African-Elephants-pone.0010346."
    COMMONS = {
      "tiger": ["File:Tiger Mad.ogg"],
      "monkey": ["File:Howler monkey.ogg", "File:Brown woolly monkey alarm call.wav"],
      "elephant": [_E + "s001.ogg", _E + "s002.ogg", _E + "s003.ogg"],
    }

def fetch(url, path):
    if not os.path.exists(path):
        open(path, "wb").write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read())
    return path

def secs(path):  # length after trimming leading silence
    out = subprocess.run(["ffmpeg", "-i", path, "-af", "silenceremove=start_periods=1:start_threshold=-45dB", "-f", "null", "-"], capture_output=True, text=True).stderr
    t = re.findall(r"time=(\d+):(\d+):([\d.]+)", out)
    return int(t[-1][0]) * 3600 + int(t[-1][1]) * 60 + float(t[-1][2]) if t else 0

def bsb(slug):
    n = re.search(r"s(\d{4})$", slug).group(1)
    raw = fetch(f"https://bigsoundbank.com/UPLOAD/mp3/{n}.mp3", f"{CACHE}/bsb{n}.mp3")
    title = re.sub(r"-s\d{4}$", "", slug).replace("-", " ").capitalize()
    return dict(raw=raw, title=title, license="CC0", artist="Joseph Sardin (BigSoundBank)", page=f"https://bigsoundbank.com/{slug}.html")

def commons(title):
    q = urllib.parse.urlencode(dict(action="query", titles=title, prop="imageinfo", iiprop="url|extmetadata", iiextmetadatafilter="LicenseShortName|Artist", format="json"))
    pg = list(json.load(urllib.request.urlopen(urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q, headers=UA)))["query"]["pages"].values())[0]
    ii = pg["imageinfo"][0]; m = ii["extmetadata"]
    return dict(raw=fetch(ii["url"], f"{CACHE}/c_" + re.sub(r"[^A-Za-z0-9.]+", "_", title)), title=title[5:].rsplit(".", 1)[0],
                license=m["LicenseShortName"]["value"], artist=re.sub(r"\s+", " ", re.sub("<[^>]+>", "", m.get("Artist", {}).get("value", ""))).strip()[:90],
                page="https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")))

def gather(animal):
    items = []
    for s in BSB.get(animal, []):
        try: items.append(bsb(s))
        except Exception as e: print("  skip", s, e)
    for t in COMMONS.get(animal, []):
        try: items.append(commons(t))
        except Exception as e: print("  skip", t, e)
    for it in items: it["len"] = secs(it["raw"])
    return animal, [it for it in items if it["len"] >= MIN_SECS]

manifest = {}
animals = list(BSB) + [a for a in COMMONS if a not in BSB]
with ThreadPoolExecutor(4) as ex:
    results = dict(ex.map(gather, animals))
for animal in animals:
    manifest[animal] = []
    for it in results[animal][:PER_ANIMAL]:
        n = len(manifest[animal]) + 1; name = f"{animal}-{n}.mp3"; dur = min(it["len"], MAX_SECS)
        af = f"silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,atrim=0:{MAX_SECS},afade=t=out:st={dur - 0.6:.2f}:d=0.6,loudnorm=I=-20:TP=-3:LRA=7"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", it["raw"], "-af", af, "-ac", "1", "-ar", "44100", "-b:a", "64k", os.path.join(OUT, name)], check=True)
        manifest[animal].append(dict(file=name, title=it["title"], license=it["license"], artist=it["artist"], page=it["page"], secs=round(dur, 1)))
    print(animal, [(m["file"], m["license"], m["secs"], m["title"][:28]) for m in manifest[animal]] or "NO CLIP >= 5s")
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1, ensure_ascii=False)
