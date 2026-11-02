from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
R=Path(__file__).resolve().parents[1];assets=R/'assets/png';out=R/'previews'
W,H=1600,970
im=Image.new('RGB',(W,H),'#f2f6fa')
d=ImageDraw.Draw(im)
fontdir='/usr/share/fonts/truetype/dejavu/'
def f(size,bold=False):return ImageFont.truetype(fontdir+('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'),size)
d.text((54,35),'ATLAS ANATÔMICO  ·  NATHAN',font=f(21,True),fill='#587594')
d.text((54,72),'Anatomia preservada. Gênero e cor neutros.',font=f(34,True),fill='#243f57')
d.text((54,125),'Imagens isoladas e transparentes para mapas de dor e avaliação articular.',font=f(18),fill='#687e93')
# cards
def card(box,title,subtitle):
 x,y,x1,y1=box
 d.rounded_rectangle(box,22,fill='white',outline='#dce6ef',width=2)
 d.text((x+20,y+17),title,font=f(20,True),fill='#2c526f')
 d.text((x+20,y+50),subtitle,font=f(14),fill='#8192a2')
def paste(asset, x,y,maxw,maxh):
 a=Image.open(assets/f'{asset}.png').convert('RGBA')
 scale=min(maxw/a.width,maxh/a.height)
 a=a.resize((round(a.width*scale),round(a.height*scale)),Image.Resampling.LANCZOS)
 im.paste(a,(round(x+(maxw-a.width)/2),round(y+(maxh-a.height)/2)),a)
card((50,190,830,905),'Corpo · vistas anterior e posterior','Mesmo padrão anatômico em todos os instrumentos')
paste('corpo-anterior',76,270,360,615);paste('corpo-posterior',447,270,350,615)
card((855,190,1540,535),'Mãos · vista palmar','Detalhe para articulações MCP e interfalângicas')
paste('mao-direita',905,260,275,255);paste('mao-esquerda',1208,260,275,255)
card((855,552,1540,905),'Pés · vista plantar','Base para regiões de pés e avaliação específica de PsA')
paste('pe-direito',932,603,239,280);paste('pe-esquerdo',1212,603,239,280)
d.text((54,925),'PRÉVIA VISUAL  •  Arte gerada e extraída para uso clínico ilustrativo  •  Não substitui validação anatômica',font=f(13),fill='#8a9dab')
im.save(out/'atlas_nathan_v2_preview.png',optimize=True)
