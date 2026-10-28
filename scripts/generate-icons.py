"""Gera os ícones locais da PWA; Pillow é necessário apenas nesta etapa."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
destination = root / 'web' / 'icons'
destination.mkdir(exist_ok=True)
for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (512, 'maskable-512.png')]:
    image = Image.new('RGB', (size, size), '#182a22')
    draw = ImageDraw.Draw(image)
    scale = size / 128
    def rectangle(bounds):
        draw.rounded_rectangle(tuple(round(v * scale) for v in bounds), radius=round(4 * scale), outline='#d7f19e', width=round(5 * scale))
    def line(points):
        draw.line([tuple(round(v * scale) for v in point) for point in points], fill='#d7f19e', width=round(5 * scale))
    rectangle((49, 30, 79, 52))
    line([(64, 52), (64, 71)])
    line([(31, 83), (31, 71), (97, 71), (97, 83)])
    line([(64, 71), (64, 83)])
    for left in [21, 54, 87]:
        rectangle((left, 83, left + 20, 99))
    image.save(destination / name)
print('Ícones gerados em web/icons')
