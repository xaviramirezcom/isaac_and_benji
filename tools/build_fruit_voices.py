"""Builds the spoken fruit names (English + Spanish) with the macOS `say` voices as small MP3s (iPhone-safe).
Usage: python3 tools/build_fruit_voices.py  -> sounds/fruits/{en,es}/<fruit id>.mp3
"""
import os, re, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRUITS = {  # id: (English, Spanish)
  'apple': ('apple', 'manzana'), 'greenapple': ('green apple', 'manzana verde'), 'banana': ('banana', 'plátano'), 'grapes': ('grapes', 'uvas'), 'strawberry': ('strawberry', 'fresa'),
  'orange': ('orange', 'naranja'), 'watermelon': ('watermelon', 'sandía'), 'pear': ('pear', 'pera'), 'peach': ('peach', 'durazno'), 'cherries': ('cherries', 'cerezas'),
  'pineapple': ('pineapple', 'piña'), 'mango': ('mango', 'mango'), 'lemon': ('lemon', 'limón'), 'kiwi': ('kiwi', 'kiwi'), 'blueberries': ('blueberries', 'arándanos'),
}
VOICES = {'en': 'Samantha', 'es': 'Paulina'}
TARGET = -16.0
def mean_db(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', out).group(1))
for li, (lang, voice) in enumerate(VOICES.items()):
    for fid, words in FRUITS.items():
        out = os.path.join(ROOT, 'sounds/fruits', lang, f'{fid}.mp3'); tmp = tempfile.mktemp(suffix='.wav'); mid = tempfile.mktemp(suffix='.wav')
        subprocess.run(['say', '-v', voice, '-r', '120', '--file-format=WAVE', '--data-format=LEI16@44100', '-o', tmp, words[li]], check=True)
        trim = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', f'{trim},highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=4:release=60,apad=pad_dur=0.05', '-ar', '44100', '-ac', '1', mid], check=True)
        gain = TARGET - mean_db(mid)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mid, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:level=disabled', '-ar', '44100', '-ac', '1', '-b:a', '128k', out], check=True)
        os.remove(tmp); os.remove(mid)
    print(lang, 'done')
