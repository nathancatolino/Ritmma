import cv2, numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from PIL import Image
im=cv2.imread(str(ROOT/'assets/arte_original_aprovada.png'))
# preserve individual bounding box tight
items={
'front':((42,8,521,992), [(292,85,30),(294,151,16),(242,228,33),(351,228,32),(298,340,49),(300,460,40),(255,520,21),(340,520,21),(272,630,23),(344,630,22),(280,730,19),(346,730,19),(285,840,15),(345,840,15),(286,950,8),(344,950,8),(102,565,12),(493,556,10)], [[(204,258),(150,380),(105,486),(92,550)],[(400,260),(450,376),(491,491),(502,551)],[(250,579),(255,681),(269,758),(282,856),(278,953)],[(357,565),(348,681),(346,793),(350,901),(352,947)]]),
'back':((516,8,912,996), [(700,85,30),(702,151,17),(650,237,35),(753,235,30),(693,320,44),(692,465,42),(650,570,20),(750,570,20),(654,700,19),(748,700,19),(654,835,16),(755,840,14),(652,946,9),(754,947,9),(550,562,10),(853,558,10)], [[(602,255),(556,375),(532,475),(523,558)],[(807,252),(852,373),(872,481),(878,540)],[(654,575),(659,680),(656,805),(645,940)],[(746,560),(744,668),(749,830),(748,932)]]),
'hand_left':((910,120,1195,460), [(1100,327,22),(1080,270,11),(1050,180,9),(1104,150,9),(1142,190,9),(1170,235,9),(966,325,10),(1050,380,18)], [[(1042,260),(1085,300),(1105,380)],[(1082,250),(1086,156)],[(1130,264),(1141,187)],[(1160,275),(1172,240)],[(1030,322),(970,320)]]),
'hand_right':((1202,120,1497,460), [(1320,328,23),(1360,272,9),(1400,185,9),(1345,156,9),(1270,201,9),(1240,240,9),(1444,322,10),(1365,393,16)], [[(1357,267),(1347,154)],[(1381,263),(1400,190)],[(1300,280),(1270,194)],[(1270,301),(1232,240)],[(1410,331),(1440,320)]]),
'foot_left':((952,520,1205,970), [(1078,665,32),(1070,760,36),(1100,840,28),(1100,908,22),(1097,561,10),(1045,588,9),(1015,611,8)], [[(1065,640),(1080,790),(1092,885)]]),
'foot_right':((1220,518,1460,970), [(1315,667,35),(1320,770,35),(1305,838,25),(1310,916,20),(1315,548,10),(1355,580,9),(1378,615,8)], [[(1330,648),(1318,795),(1316,890)]])
}
outs=[]
for name,(bb,points,lines) in items.items():
 x0,y0,x1,y1=bb
 # small padding in region
 pix=im[y0:y1,x0:x1]
 h,w=pix.shape[:2]
 mask=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
 mask[:8,:]=cv2.GC_BGD;mask[-8:,:]=cv2.GC_BGD;mask[:,:8]=cv2.GC_BGD;mask[:,-8:]=cv2.GC_BGD
 for x,y,r in points:
  cv2.circle(mask,(x-x0,y-y0),r,cv2.GC_FGD,-1)
 for line in lines:
  q=np.array([(x-x0,y-y0) for x,y in line],np.int32)
  cv2.polylines(mask,[q],False,cv2.GC_FGD,12)
 bg=np.zeros((1,65),np.float64);fg=np.zeros((1,65),np.float64)
 cv2.grabCut(pix,mask,None,bg,fg,8,cv2.GC_INIT_WITH_MASK)
 s=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype('uint8')
 # constrain to nearly-white anatomical paint; drop grey halo while preserving outlines later
 lum=cv2.cvtColor(pix,cv2.COLOR_BGR2GRAY)
 s=np.where((s>0)&(lum>219),255,0).astype('uint8')
 s=cv2.morphologyEx(s,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
 s=cv2.morphologyEx(s,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
 # Fill interior contours and anatomical shading holes
 cont,_=cv2.findContours(s,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 fixed=np.zeros_like(s)
 for c in cont:
  if cv2.contourArea(c)>120:
   cv2.drawContours(fixed,[c],-1,255,-1)
 s=fixed
 
 # keep few largest comps, discarding stray bg halos
 nc,lab,stat,cent=cv2.connectedComponentsWithStats(s)
 keep=np.zeros_like(s)
 for i in sorted(range(1,nc),key=lambda i:stat[i,4],reverse=True)[:1]:keep[lab==i]=255
 alpha=cv2.GaussianBlur(keep,(3,3),0.7)
 rgba=cv2.cvtColor(pix,cv2.COLOR_BGR2BGRA);rgba[:,:,3]=alpha
 # single-pixel blue-gray contour restores boundary lost to halo suppression
 border=np.zeros((h,w),np.uint8)
 contours,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 cv2.drawContours(border,contours,-1,205,1,cv2.LINE_AA)
 idx=border>0
 rgba[idx,0]=np.minimum(rgba[idx,0],int(153))
 rgba[idx,1]=np.minimum(rgba[idx,1],int(146))
 rgba[idx,2]=np.minimum(rgba[idx,2],int(139))
 rgba[idx,3]=np.maximum(rgba[idx,3],border[idx])
 # SVG hybrid uses detailed raster, and true vector mask for hit area
 import json,base64
 asset=name.replace('front','corpo-anterior').replace('back','corpo-posterior').replace('hand_left','mao-direita').replace('hand_right','mao-esquerda').replace('foot_left','pe-direito').replace('foot_right','pe-esquerdo')
 contour=max(contours,key=cv2.contourArea)
 simple=cv2.approxPolyDP(contour,1.3,True)
 d='M '+ ' L '.join(f'{int(pt[0][0])} {int(pt[0][1])}' for pt in simple)+' Z'
 path=str(ROOT/'assets/hitmaps'/f'{asset}.json')
 with open(path,'w') as ff:json.dump({'asset':asset,'width':w,'height':h,'path':d,'source':'manual review pending for clinical hotspot geometry'},ff,ensure_ascii=False,indent=2)
 
 out=str(ROOT/'assets/png'/f'{asset}.png');cv2.imwrite(out,rgba)
 print(name, (keep>0).sum(),out)
 outs.append((name,rgba))
