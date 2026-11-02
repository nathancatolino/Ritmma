import json, pathlib
root=pathlib.Path(__file__).resolve().parents[1]
def entry(id,label,asset,x,y,rx=20,ry=19,view=None):
 return dict(id=id,label=label,asset=asset,x=x,y=y,rx=rx,ry=ry,patient_side=('direita' if '_R' in id else 'esquerda' if '_L' in id else 'central'),view=view or ('posterior' if asset=='corpo-posterior' else 'anterior'))
a='corpo-anterior';p='corpo-posterior'
wpi=[
 entry('shoulder_girdle_R','Cintura escapular direita',p,97,210,39,38),
 entry('shoulder_girdle_L','Cintura escapular esquerda',p,285,210,39,38),
 entry('upper_arm_R','Braço direito',a,106,308,33,47),entry('upper_arm_L','Braço esquerdo',a,374,308,33,47),
 entry('lower_arm_R','Antebraço direito',a,53,422,31,47),entry('lower_arm_L','Antebraço esquerdo',a,426,422,31,47),
 entry('hip_R','Quadril / nádega direita',p,138,482,43,48),entry('hip_L','Quadril / nádega esquerda',p,257,482,43,48),
 entry('upper_leg_R','Coxa direita',a,226,599,39,62),entry('upper_leg_L','Coxa esquerda',a,320,599,39,62),
 entry('lower_leg_R','Perna direita',a,232,776,32,58),entry('lower_leg_L','Perna esquerda',a,326,776,32,58),
 entry('jaw_R','Mandíbula direita',a,225,135,24,20),entry('jaw_L','Mandíbula esquerda',a,292,135,24,20),
 entry('chest','Tórax anterior',a,247,278,65,41),entry('abdomen','Abdome',a,251,407,64,67),
 entry('upper_back','Região dorsal',p,191,319,75,66),entry('lower_back','Região lombar',p,191,420,67,49),
 entry('neck','Região cervical',p,190,175,33,36),
]
json.dump(dict(id='wpi19',version='1.0',instrument='WPI (19 regiões)',period='Últimos 7 dias',max_score=19,regions=wpi,note='Marcadores ilustrativos sobre anatomia: validar hitboxes no site antes de produção. Seleções únicas por id.'),open(root/'schemas/wpi19.json','w'),indent=2,ensure_ascii=False)
# Actual joint names and patient side: right joints appear left side on the anterior image.
das=[]
for side,x in [('R',145),('L',366)]:das.append(entry('shoulder_'+side, 'Ombro '+('direito' if side=='R' else 'esquerdo'),a,x,235,23,22))
for side,x in [('R',113),('L',394)]:das.append(entry('elbow_'+side,'Cotovelo '+('direito' if side=='R' else 'esquerdo'),a,x,383,21,23))
for side,x in [('R',66),('L',433)]:das.append(entry('wrist_'+side,'Punho '+('direito' if side=='R' else 'esquerdo'),a,x,501,22,21))
for side,x in [('R',206),('L',305)]:das.append(entry('knee_'+side,'Joelho '+('direito' if side=='R' else 'esquerdo'),a,x,643,26,27))
# Hand source image local coords: patient RIGHT thumb is on viewer left; LEFT mirrored.
for side,asset,vals in [
 ('R','mao-direita', {'mcp':[(86,216),(114,174),(148,169),(189,178),(226,188)],'pip':[(52,176),(114,101),(149,86),(196,99),(238,124)]}),
 ('L','mao-esquerda',{'mcp':[(228,216),(179,174),(144,169),(103,178),(68,188)],'pip':[(258,176),(178,101),(144,86),(100,99),(59,124)]})
]:
 for typ,coords in vals.items():
  for i,(x,y) in enumerate(coords,1):
   label=('Metacarpofalângica' if typ=='mcp' else 'Interfalângica do polegar' if i==1 else 'Interfalângica proximal')
   das.append(entry(f'{typ}{i}_{side}',f'{label} {i}, mão '+('direita' if side=='R' else 'esquerda'),asset,x,y,16 if typ=='mcp' else 15,16))
json.dump(dict(id='das28',version='1.0',instrument='DAS28 — contagens de 28 articulações',count=28,joints=das,dimensions=['tender','swollen'],warning='A marcação não substitui exame clínico; DAS28 completo depende de PCR/VHS e avaliação global; não calcular DAS28 apenas com o mapa.'),open(root/'schemas/das28.json','w'),indent=2,ensure_ascii=False)
json.dump({'id':'pain', 'version':'1.0','mode':'free-points','range':[0,10], 'notes':'Localização é armazenada como coordenada normalizada (u,v) e asset. Intensidade é independente da categoria do sintoma. Fora da silhueta não clicável.'},open(root/'schemas/dor-livre.json','w'),indent=2,ensure_ascii=False)
json.dump({'id':'psa', 'version':'1.0','mode':'exploratory','anatomy':['corpo-anterior','corpo-posterior','mao-direita','mao-esquerda','pe-direito','pe-esquerdo'],'warning':'Vista de referência, não é mapa validado de 66/68 articulações. Acrescentar todas as juntas, enteses e dígitos no schema específico antes de usar escore clínico.'},open(root/'schemas/psa-referencia.json','w'),indent=2,ensure_ascii=False)
assert len(wpi)==19 and len(das)==28
assert len(set(j['id'] for j in das))==28
print('Schemas OK: WPI',len(wpi),'DAS28',len(das))
