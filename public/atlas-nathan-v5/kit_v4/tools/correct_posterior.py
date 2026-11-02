"""Replace truncated posterior arms in source image with complete matched clinical source.
The original approved collage had truncated posterior left arm (generator artifact).
Run after extract_transparent.py; update posterior WPI coordinates separately.
"""
from pathlib import Path
import json, cv2, numpy as np
from PIL import Image
R=Path(__file__).resolve().parents[1]
im=Image.open(R/'assets/arte_complementar_posterior.png').convert('RGBA')
# Back anatomy covers x~640..1190; y~6..1145. The left body is outside this crop.
roi=im.crop((639,6,1190,1145))
a=np.array(roi.getchannel('A'))
mask=np.where(a>80,255,0).astype('uint8')
# Remove stray foreground fragments, preserve entire main silhouette.
n,labels,stats,cent=cv2.connectedComponentsWithStats(mask)
main=1+np.argmax(stats[1:,4]); keep=np.where(labels==main,255,0).astype('uint8')
# Keep original texture, and feather edge only
alpha=np.minimum(a,cv2.GaussianBlur(keep,(3,3),0.7))
r=np.array(roi);r[:,:,3]=alpha
out=R/'assets/png/corpo-posterior.png';Image.fromarray(r,'RGBA').save(out)
contours,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
simple=cv2.approxPolyDP(max(contours,key=cv2.contourArea),1.5,True)
d='M '+' L '.join(f'{int(pt[0][0])} {int(pt[0][1])}' for pt in simple)+' Z'
json.dump({'asset':'corpo-posterior','width':roi.width,'height':roi.height,'path':d,'source':'segunda arte neutra, membros completos, máscara de alfa nativa'},open(R/'assets/hitmaps/corpo-posterior.json','w'),ensure_ascii=False,indent=2)
print('posterior replaced with full arms',roi.size)
