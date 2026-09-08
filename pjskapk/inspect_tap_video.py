"""Contact sheet of the device recording, retaining frame timestamps."""
from pathlib import Path
import av
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parent
sheet = Image.new('RGB', (1600, 1200), '#222222')
draw = ImageDraw.Draw(sheet)
targets = [1.3 + i * .08 for i in range(12)]
index = 0
for frame in av.open(str(root / 'sekai-tap-3d.mp4')).decode(video=0):
    if index >= len(targets):
        break
    if frame.time < targets[index]:
        continue
    im = frame.to_image().crop((1250, 500, 1650, 850)).resize((400, 350))
    x, y = index % 4 * 400, index // 4 * 400
    sheet.paste(im, (x, y))
    draw.text((x+10, y+360), f'{frame.time:.3f}s', fill='white')
    index += 1
sheet.save(root / 'sekai-tap-3d-frames.jpg')
