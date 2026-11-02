from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parents[1]
w=json.loads((root/'schemas/wpi19.json').read_text())
d=json.loads((root/'schemas/das28.json').read_text())
assert len(w['regions'])==19 and len(set(z['id'] for z in w['regions']))==19
assert len(d['joints'])==28 and len(set(z['id'] for z in d['joints']))==28
assert sum(z['id'].startswith('mcp') for z in d['joints'])==10
assert sum(z['id'].startswith('pip') for z in d['joints'])==10
assert sum(z['id'].startswith(('shoulder_','elbow_','wrist_','knee_')) for z in d['joints'])==8
assets={p.stem for p in (root/'assets/png').glob('*.png')}
assert len(assets)==8
for asset in assets:
 img=Image.open(root/'assets/png'/f'{asset}.png');assert img.mode=='RGBA'
 m=json.loads((root/'assets/hitmaps'/f'{asset}.json').read_text())
 assert [m['width'],m['height']]==list(img.size)
 if not asset.startswith('wpi-'):assert m['path'].startswith('M ')
for j in w['regions']+d['joints']:
 assert j['asset'] in assets and j['x']>=0 and j['y']>=0
print('PASS: 8 PNGs RGBA, 8 coordinate maps, 19 regions WPI, 28 joints DAS28 (20 hands + 8 others)')
