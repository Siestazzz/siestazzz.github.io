"""Save timestamped original device frames for transition comparison."""
from pathlib import Path
import av
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent/'analysis-6.8.1'
sheet=Image.new('RGB',(1600,1500),'#222');draw=ImageDraw.Draw(sheet)
targets=[.9+i*.2 for i in range(20)];index=0
for frame in av.open(str(root/'world-transition.mp4')).decode(video=0):
 if index>=len(targets):break
 if frame.time<targets[index]:continue
 x=index%4*400;y=index//4*300
 sheet.paste(frame.to_image().resize((400,250)),(x,y));draw.text((x+8,y+260),f'{frame.time:.3f}s',fill='white');index+=1
sheet.save(root/'world-transition-frames.jpg')
