"""Builds the spoken numbers 1-20 (English + Spanish) with the macOS `say` voices, as small MP3s (iPhone-safe).
Usage: python3 tools/build_number_voices.py  -> sounds/numbers/{en,es}/<n>.mp3
"""
import os, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
ES = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte']
VOICES = {'en': ('Flo (English (US))', EN), 'es': ('Flo (Spanish (Mexico))', ES)}
for lang, (voice, words) in VOICES.items():
    for i, w in enumerate(words, 1):
        out = os.path.join(ROOT, 'sounds/numbers', lang, f'{i}.mp3'); tmp = tempfile.mktemp(suffix='.aiff')
        subprocess.run(['say', '-v', voice, '-r', '115', '-o', tmp, w + '!'], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5', '-ar', '44100', '-ac', '1', '-b:a', '64k', out], check=True)
        os.remove(tmp)
    print(lang, 'done')
