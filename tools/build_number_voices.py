"""Builds the spoken numbers 1-20 (English + Spanish) with the macOS `say` voices, as small MP3s (iPhone-safe).
Usage: python3 tools/build_number_voices.py  -> sounds/numbers/{en,es}/<n>.mp3
"""
import os, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
ES = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte']
VOICES = {'en': ('Samantha', EN), 'es': ('Paulina', ES)}   # the clearest voices macOS ships (Samantha / Paulina)
import re
def mean_db(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', out).group(1))
TARGET = -16.0   # average level of the voiced part, close to the animal recordings once they are played
for lang, (voice, words) in VOICES.items():
    for i, w in enumerate(words, 1):
        out = os.path.join(ROOT, 'sounds/numbers', lang, f'{i}.mp3'); tmp = tempfile.mktemp(suffix='.wav'); mid = tempfile.mktemp(suffix='.wav')
        subprocess.run(['say', '-v', voice, '-r', '125', '--file-format=WAVE', '--data-format=LEI16@44100', '-o', tmp, w], check=True)
        trim = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', f'{trim},highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=4:release=60,apad=pad_dur=0.05', '-ar', '44100', '-ac', '1', mid], check=True)
        gain = TARGET - mean_db(mid)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mid, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:level=disabled', '-ar', '44100', '-ac', '1', '-b:a', '128k', out], check=True)
        os.remove(tmp); os.remove(mid)
    print(lang, 'done')
