"""Builds the spoken shape names, colour names and the three "what to do" lines (English + Spanish) with the macOS `say` voices as small MP3s (iPhone-safe).
Usage: python3 tools/build_shape_voices.py  -> sounds/shapes/{en,es}/<id>.mp3
"""
import os, re, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = {'en': 'Samantha', 'es': 'Paulina'}
TARGET = -16.0
WORDS = {
  'circle': ('Circle', 'Círculo'), 'square': ('Square', 'Cuadrado'), 'triangle': ('Triangle', 'Triángulo'), 'star': ('Star', 'Estrella'), 'heart': ('Heart', 'Corazón'), 'diamond': ('Diamond', 'Rombo'), 'oval': ('Oval', 'Óvalo'), 'rectangle': ('Rectangle', 'Rectángulo'),
  'red': ('Red', 'Rojo'), 'blue': ('Blue', 'Azul'), 'yellow': ('Yellow', 'Amarillo'), 'green': ('Green', 'Verde'), 'orange': ('Orange', 'Naranja'), 'purple': ('Purple', 'Morado'), 'pink': ('Pink', 'Rosa'), 'brown': ('Brown', 'Marrón'),
  'rule_shape': ('Find the same shape!', '¡Busca la misma forma!'), 'rule_color': ('Find the same color!', '¡Busca el mismo color!'), 'rule_pattern': ('What comes next?', '¿Qué sigue?'),
}
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
for k, (lang, voice) in enumerate(VOICES.items()):
    d = os.path.join(ROOT, 'sounds/shapes', lang); os.makedirs(d, exist_ok=True)
    for id_, texts in WORDS.items(): build(texts[k], voice, 150 if id_.startswith('rule') else 120, os.path.join(d, f'{id_}.mp3'))
    print(lang, 'done')
