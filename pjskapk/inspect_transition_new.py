from pathlib import Path
import av
import sys
from PIL import Image, ImageDraw
base=Path(__file__).parent/'analysis-6.8.1'
sheet=Image.new('RGB',(1440,1200),'#222');draw=ImageDraw.Draw(sheet)
targets=[i*.10 for i in range(24)];i=0
source=sys.argv[1] if len(sys.argv)>1 else 'world-transition-new'
for frame in av.open(str(base/(source+'.mp4'))).decode(video=0):
    if i>=len(targets):break
    if frame.time<targets[i]:continue
    x=i%4*360;y=i//4*200
    sheet.paste(frame.to_image().resize((320,180)),(x,y));draw.text((x+4,y+181),f'{frame.time:.3f}s',fill='white');i+=1
sheet.save(base/(source+'-frames.jpg'))
