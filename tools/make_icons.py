"""Draws the app icon (a flag-painted globe) with nothing but the standard library."""
import math, os, struct, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def render(n, ss=2):
    rows = []
    for y in range(n):
        row = bytearray([0])
        for x in range(n):
            r = g = b = 0
            for sy in range(ss):
                for sx in range(ss):
                    u, v = (x + (sx + .5) / ss) / n, (y + (sy + .5) / ss) / n
                    t = (u + v) / 2
                    c = (37, 99 - 40 * t, 235 - 80 * t)
                    dx, dy = u - .5, v - .5
                    d = math.hypot(dx, dy)
                    R = .34
                    if d < R + .018:
                        c = (255, 255, 255)
                    if d < R:
                        base = (34, 197, 94) if u < .42 else (250, 250, 250) if u < .58 else (239, 68, 68)
                        shade = 1 - .38 * (d / R) ** 3
                        hl = max(0, 1 - math.hypot(dx + .1, dy + .12) / .18) * .35
                        c = tuple(min(255, ch * shade + 255 * hl) for ch in base)
                    r += c[0]; g += c[1]; b += c[2]
            k = ss * ss
            row += bytes((int(r / k), int(g / k), int(b / k)))
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')

os.makedirs(os.path.join(ROOT, 'icons'), exist_ok=True)
for name, n in (('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180)):
    with open(os.path.join(ROOT, 'icons', name), 'wb') as f:
        f.write(render(n))
    print('wrote', name)
