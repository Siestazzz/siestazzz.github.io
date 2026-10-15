"""Demux original CRI video packets (skip metadata/EOS), transcode for the web."""
import hashlib
import json
import struct
import subprocess
from pathlib import Path
import imageio_ffmpeg

root = Path(__file__).resolve().parent
audit = root / 'analysis-6.8.1/title-movie-audit'
out = root.parent / 'themes/sekai-next/source/game-assets/entry'
data = (audit / '5th_anv_title.usm').read_bytes()
offset = 0
packets = []
while offset < len(data):
    size = struct.unpack_from('>I', data, offset + 4)[0] + 8
    assert size >= 32 and offset + size <= len(data)
    if data[offset:offset+4] == b'@SFV' and data[offset+15] == 0:
        start = offset + 8 + data[offset+9]
        end = offset + size - int.from_bytes(data[offset+10:offset+12], 'big')
        packets.append(data[start:end])
    offset += size
assert offset == len(data)
stream = audit / '5th_anv_title.m1v'
stream.write_bytes(b''.join(packets))
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
target = out / 'title-background.mp4'
subprocess.run([ffmpeg, '-hide_banner', '-v', 'error', '-i', str(stream),
    '-vf', 'scale=1920:-2,setsar=1', '-an', '-c:v', 'libx264', '-preset', 'medium',
    '-crf', '21', '-pix_fmt', 'yuv420p', '-force_key_frames', '7.533333',
    '-movflags', '+faststart', '-y', str(target)], check=True)
subprocess.run([ffmpeg, '-hide_banner', '-v', 'error', '-i', str(target),
    '-f', 'null', '-'], check=True)
record = dict(source='title_screen/anniversary_5th_bg', packet_count=len(packets),
    usm_bytes=len(data), usm_sha256=hashlib.sha256(data).hexdigest(),
    loop_point_frame=226, fps=30, loop_start_seconds=226/30,
    file=target.name, bytes=target.stat().st_size,
    sha256=hashlib.sha256(target.read_bytes()).hexdigest())
(out / 'title-movie.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
print(json.dumps(record, indent=2))
