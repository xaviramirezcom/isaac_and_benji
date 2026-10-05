"""Builds the spoken animal names (English + Spanish) with the macOS `say` voices as small MP3s (iPhone-safe).
Usage: python3 tools/build_name_voices.py  -> sounds/names/{en,es}/<animal id>.mp3
"""
import json, os, re, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = {'en': 'Samantha', 'es': 'Paulina'}
TARGET = -16.0
def mean_db(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', out).group(1))
animals = json.load(open(os.path.join(ROOT, 'data/animals.json')))
for lang, voice in VOICES.items():
    for a in animals:
        out = os.path.join(ROOT, 'sounds/names', lang, f"{a['id']}.mp3"); tmp = tempfile.mktemp(suffix='.wav'); mid = tempfile.mktemp(suffix='.wav')
        subprocess.run(['say', '-v', voice, '-r', '120', '--file-format=WAVE', '--data-format=LEI16@44100', '-o', tmp, a[lang]], check=True)
        trim = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', f'{trim},highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=4:release=60,apad=pad_dur=0.05', '-ar', '44100', '-ac', '1', mid], check=True)
        gain = TARGET - mean_db(mid)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mid, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:level=disabled', '-ar', '44100', '-ac', '1', '-b:a', '128k', out], check=True)
        os.remove(tmp); os.remove(mid)
    print(lang, 'done')
