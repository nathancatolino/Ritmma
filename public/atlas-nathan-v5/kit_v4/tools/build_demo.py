import json,pathlib
r=pathlib.Path(__file__).resolve().parents[1]
D={'wpi':json.loads((r/'schemas/wpi19.json').read_text()),'das':json.loads((r/'schemas/das28.json').read_text()),'masks':{}}
for p in (r/'assets/hitmaps').glob('*.json'):D['masks'][p.stem]=json.loads(p.read_text())
script=(r/'src/demo.js').read_text().replace('__ATLAS_DATA__',json.dumps(D,ensure_ascii=False,separators=(',',':')))
html='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Atlas anatômico · Métricas Nathan</title><link rel="stylesheet" href="src/demo.css"></head>
<body><main class="shell"><header class="headline"><div><div class="eyebrow">Métricas de Acompanhamento · Biblioteca anatômica v4</div><h1>Um só corpo. Diferentes instrumentos.</h1><p>Atlas clínico agênero • tons acromáticos • referências anatômicas preservadas</p></div><div class="lock">Protótipo local · sem envio de dados</div></header>
<section class="panel"><nav class="tabs" aria-label="Instrumentos"><button data-mode="pain" aria-selected="true">Mapa de dor</button><button data-mode="wpi" aria-selected="false">WPI · 19 regiões</button><button data-mode="das28" aria-selected="false">DAS28 · 28 articulações</button><button data-mode="psa" aria-selected="false">Artrite psoriásica</button></nav>
<div class="layout"><section class="workspace"><h2 id="mode-title">Mapa de dor</h2><p id="mode-help"></p>
<div id="body-figures" class="figures"></div>
<div id="hand-figures" class="small-grid hidden"></div><div id="foot-figures" class="small-grid feet hidden"></div>
<div class="legend"><span><i class="key" style="background:#9babbd"></i> Anatomia neutra</span><span><i class="key" style="background:#f39a69"></i> Dor</span><span><i class="key" style="background:#9579d1"></i> Edema</span><span><i class="key" style="background:#4e82ba"></i> Região WPI</span></div></section>
<aside class="side"><div class="section-title">Configuração e seleção</div><p class="help">Um componente visual compartilhado; as regras de cada instrumento permanecem separadas.</p>
<div id="wpi-controls" class="hidden"><p class="help">Marque uma única vez cada região com dor nos últimos 7 dias. As áreas azuis só representam seleções realizadas.</p><div id="wpi-region-list" class="wpi-list" aria-label="Lista das 19 regiões WPI"></div></div>
<div id="pain-controls"><label class="formlabel" for="severity">Intensidade da dor</label><div class="severity"><span>Sem dor</span><strong id="severity-number" class="pill">4</strong><span>Máxima</span></div><input aria-label="Intensidade de zero a dez" id="severity" class="range" type="range" min="0" max="10" value="4"/></div>
<div id="joint-controls" class="hidden"><span class="formlabel">Camada ativa</span><div class="toggle"><button data-dimension="tender" aria-pressed="true">Dor à palpação</button><button data-dimension="swollen" aria-pressed="false">Edema</button></div><p class="note">A mesma articulação pode ter dor e edema simultaneamente. O estado não é um diagnóstico.</p></div>
<div class="divider"></div><div class="section-title">Resultado da seleção <span class="preview-badge">SIMULAÇÃO</span></div><div class="count" id="summary"></div><ol id="selected-list" class="selection"></ol>
<div class="divider"></div><div class="buttons"><button class="button" id="export">Exportar JSON</button><button class="button" id="reset">Limpar seleção</button></div><p class="note">O arquivo JSON é salvo localmente. Não há armazenamento persistente nem transmissão de dados. A implementação clínica exige validação e integração às rotinas atuais.</p></aside></div>
<div class="footnote">Arte-base ilustrativa gerada e refinada para o projeto. SVGs híbridos preservam detalhes rasterizados. O protótipo NÃO calcula DAS28, critérios ACR ou contagens 66/68.</div></section></main><script>'''+script+'''</script></body></html>'''
(r/'demo.html').write_text(html,encoding='utf-8')
# Standalone version: CSS and all PNGs embedded in a single portable HTML file.
import base64
images={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode('ascii') for p in (r/'assets/png').glob('*.png')}
standalone_script='window.ATLAS_IMAGES='+json.dumps(images,separators=(',',':'))+';\n'+script
standalone_script=standalone_script.replace('src=\"assets/png/${asset}.png\"','src=\"${ATLAS_IMAGES[asset]}\"')
standalone=html.replace('<link rel=\"stylesheet\" href=\"src/demo.css\">','<style>'+ (r/'src/demo.css').read_text() +'</style>')
standalone=standalone.replace('<script>'+script+'</script>','<script>'+standalone_script+'</script>')
(r/'demo_independente.html').write_text(standalone,encoding='utf-8')
print('HTML',len(html),'chars; standalone',len(standalone),'chars')
