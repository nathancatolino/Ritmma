"""Create a single-file offline version of the advanced pain mapping UI.
Assets are copied unchanged from the user-provided Nathan v4 atlas.
"""
from pathlib import Path
import json, base64
root=Path(__file__).resolve().parents[1]
s=(root/'mapa_avancado.html').read_text(encoding='utf-8')
s=s.replace('<script src="hitmaps-inline.js"></script>', '<script>'+(root/'hitmaps-inline.js').read_text(encoding='utf-8')+'</script>')
d={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode('ascii') for p in (root/'kit_v4/assets/png').glob('*.png')}
s=s.replace('png=a=>`kit_v4/assets/png/${a}.png`','png=a=>window.__inline_png[a]')
s=s.replace('<script>\n(function(){', '<script>\nwindow.__inline_png='+json.dumps(d,ensure_ascii=False)+';\n(function(){')
assert 'window.__inline_png=' in s and '<script src="hitmaps' not in s
(root/'mapa_avancado_independente.html').write_text(s,encoding='utf-8')
print('Built offline single-file advanced mapper:',round(len(s)/1024/1024,2),'MB')
