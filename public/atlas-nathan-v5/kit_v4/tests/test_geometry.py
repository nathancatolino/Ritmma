"""Data-only clinical marker bounds checks; this does NOT replace anatomical clinical review."""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
das=json.loads((root/'schemas/das28.json').read_text())['joints']
wpi=json.loads((root/'schemas/wpi19.json').read_text())['regions']
assert len(das)==28 and len(wpi)==19
for obj in das+wpi:
    a=np.array(Image.open(root/'assets/png'/f"{obj['asset']}.png").convert('RGBA'))[:,:,3]
    x,y=obj['x'],obj['y']
    assert 0<=x<a.shape[1] and 0<=y<a.shape[0],obj
    assert a[y,x]>=130,f"Marker outside anatomy: {obj['id']} {obj['asset']} alpha={a[y,x]}"
    if obj in wpi and not obj['asset'].startswith('wpi-'):
        pts=np.array([list(map(int,s.split())) for s in obj['path'][2:-2].split(' L ')],np.int32)
        m=np.zeros_like(a)
        cv2.fillPoly(m,[pts],255)
        coverage=np.count_nonzero((m>0)&(a>130))/np.count_nonzero(m)
        assert coverage>=.8,f"Region exceeds silhouette {obj['id']} coverage={coverage:.2%}"
for obj in das:
    if obj['asset'].startswith('mao-'):assert obj['view']=='dorsal',obj['id']
for obj in wpi:
    if obj['asset']=='wpi-posterior' and obj['id'].endswith('_R'):
        left=[q for q in wpi if q['id']==obj['id'][:-1]+'L'][0]
        assert obj['x']>left['x'],obj['id']
print('PASS: 47 centroids within image bounds; posterior laterality OK. WPI requires review of silhouette coverage on opaque background.')
