"""Builds the spoken organ names and one-line jobs (English + Spanish) with the macOS `say` voices as small MP3s (iPhone-safe).
Usage: python3 tools/build_body_voices.py  -> sounds/body/{en,es}/<id>.mp3 (name) and <id>-job.mp3 (what it does)
"""
import json, os, re, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = {'en': 'Samantha', 'es': 'Paulina'}
TARGET = -16.0
def mean_db(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', out).group(1))
def build(text, voice, rate, out):
    tmp = tempfile.mktemp(suffix='.wav'); mid = tempfile.mktemp(suffix='.wav')
    subprocess.run(['say', '-v', voice, '-r', str(rate), '--file-format=WAVE', '--data-format=LEI16@44100', '-o', tmp, text], check=True)
    trim = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', f'{trim},highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=4:release=60,apad=pad_dur=0.05', '-ar', '44100', '-ac', '1', mid], check=True)
    gain = TARGET - mean_db(mid)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mid, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:level=disabled', '-ar', '44100', '-ac', '1', '-b:a', '128k', out], check=True)
    os.remove(tmp); os.remove(mid)
organs = json.load(open(os.path.join(ROOT, 'data/body.json')))
for lang, voice in VOICES.items():
    os.makedirs(os.path.join(ROOT, 'sounds/body', lang), exist_ok=True)
    for o in organs:
        build(o[lang], voice, 120, os.path.join(ROOT, 'sounds/body', lang, f"{o['id']}.mp3"))
        build(o['job_' + lang], voice, 150, os.path.join(ROOT, 'sounds/body', lang, f"{o['id']}-job.mp3"))
    print(lang, 'done')
