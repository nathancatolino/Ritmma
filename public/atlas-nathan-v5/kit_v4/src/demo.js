/* Anatomy Atlas: standalone demo. No network calls, no storage, no diagnostic score. */
const DATA=__ATLAS_DATA__;
const byId=id=>document.getElementById(id);
const sizes=Object.fromEntries(Object.entries(DATA.masks).map(([k,v])=>[k,[v.width,v.height]]));
let mode='pain', severity=4, jointDimension='tender';
const value={pain:[],wpi:new Set(),tender:new Set(),swollen:new Set()};
const bodyAssets=['corpo-anterior','corpo-posterior'];
const wpiAssets=['wpi-anterior','wpi-posterior'];
const atlasImage=asset=>(window.ATLAS_IMAGES&&window.ATLAS_IMAGES[asset])||`assets/png/${asset}.png`;
const handAssets=['mao-direita','mao-esquerda'];
const footAssets=['pe-direito','pe-esquerdo'];
const titleFor={'corpo-anterior':'Vista anterior','corpo-posterior':'Vista posterior','wpi-anterior':'Vista anterior · WPI','wpi-posterior':'Vista posterior · WPI','mao-direita':'Mão direita · dorso','mao-esquerda':'Mão esquerda · dorso','pe-direito':'Pé direito · dorso','pe-esquerdo':'Pé esquerdo · dorso'};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function circleColor(n){return n===0?'#acb9c5':n<=3?'#f6a23b':n<=6?'#ee7541':'#e83b64';}
function pointTo(svg,e){const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const local=point.matrixTransform(svg.getScreenCTM().inverse());const [w,h]=sizes[svg.dataset.asset];return {x:Math.max(0,Math.min(w,Math.round(local.x))),y:Math.max(0,Math.min(h,Math.round(local.y)))};}
function changeMode(next){mode=next;for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-selected',String(b.dataset.mode===mode));render();}
function makeStage(asset){
 const [w,h]=sizes[asset];
 let svg=`<svg data-asset="${asset}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-label="Mapa interativo: ${titleFor[asset]}"><image href="${atlasImage(asset)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" pointer-events="none"/>`;
 if(mode==='pain'&&bodyAssets.includes(asset)){
  svg+=`<path class="hit" role="button" tabindex="0" data-action="pain-add" d="${esc(DATA.masks[asset].path)}"><title>Marcar dor nesta região corporal</title></path>`;
  for(const point of value.pain.filter(v=>v.asset===asset))svg+=`<circle class="dotpain" data-action="pain-remove" data-id="${point.id}" cx="${point.x}" cy="${point.y}" r="11" fill="${circleColor(point.intensity)}" tabindex="0" role="button"><title>Remover marcação de intensidade ${point.intensity}</title></circle>`;
 }
 if(mode==='wpi'){
  for(const z of DATA.wpi.regions.filter(r=>r.asset===asset))svg+=`<path class="zone ${value.wpi.has(z.id)?'selected':''}" data-action="wpi-toggle" data-id="${esc(z.id)}" d="${esc(z.path)}" role="button" tabindex="0" aria-label="${esc(z.label)}" aria-pressed="${value.wpi.has(z.id)}"><title>${esc(z.label)}</title></path>`;
 }
 if(mode==='das28'){
  for(const z of DATA.das.joints.filter(r=>r.asset===asset)){
   const a=value.tender.has(z.id),b=value.swollen.has(z.id);const cls=a&&b?'both':a?'tender':b?'swollen':'';
   svg+=`<circle class="joint ${cls}" data-action="joint-toggle" data-id="${esc(z.id)}" cx="${z.x}" cy="${z.y}" r="${z.rx}" role="button" tabindex="0" aria-label="${esc(z.label)}; ${a?'dolorosa, ':'sem dor, '}${b?'edemaciada':'sem edema'}" aria-pressed="${jointDimension==='tender'?a:b}"><title>${esc(z.label)}</title></circle><circle class="joint-anchor ${cls}" cx="${z.x}" cy="${z.y}" r="${a||b?7:5}" pointer-events="none"/>`;
  }
 }
 svg+='</svg>';
 return `<article class="anatomy-card"><h3>${titleFor[asset]}</h3><div class="stage ${asset.startsWith('wpi-')?'wpi-stage':''}">${svg}</div></article>`;
}
function onSvgAction(e){const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action,id=el.dataset.id,svg=el.closest('svg');if(action==='pain-add'){if(e.type==='keydown')return;const p=pointTo(svg,e);value.pain.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),asset:svg.dataset.asset,x:p.x,y:p.y,intensity:severity});}
 else if(action==='pain-remove')value.pain=value.pain.filter(p=>p.id!==id);
 else if(action==='wpi-toggle'){value.wpi.has(id)?value.wpi.delete(id):value.wpi.add(id);}
 else if(action==='joint-toggle'){const bag=value[jointDimension];bag.has(id)?bag.delete(id):bag.add(id);}
 render();}
function render(){
 const titles={pain:'Mapa corporal de dor',wpi:'Fibromialgia · 19 regiões',das28:'Contagem articular · 28 articulações',psa:'Artrite psoriásica · referência anatômica'};
 const helps={pain:'Toque sobre a silhueta para indicar a localização da dor e a intensidade de 0 a 10.',wpi:'Selecione cada uma das 19 regiões com dor nos últimos 7 dias. Um mesmo identificador só pode ser contado uma vez.',das28:'Selecione dor à palpação ou edema separadamente. Os 28 identificadores mantêm estados independentes.',psa:'Prévia anatômica de mãos e pés. Não calcula contagens 66/68 nem escores de atividade: falta validação de todas as articulações.'};
 byId('mode-title').textContent=titles[mode];byId('mode-help').textContent=helps[mode];
 byId('body-figures').innerHTML=(mode==='wpi'?wpiAssets:bodyAssets).map(makeStage).join('');
 byId('hand-figures').classList.toggle('hidden',mode!=='das28'&&mode!=='psa');
 byId('foot-figures').classList.toggle('hidden',mode!=='psa');
 if(mode==='das28'||mode==='psa')byId('hand-figures').innerHTML=handAssets.map(makeStage).join('');
 if(mode==='psa')byId('foot-figures').innerHTML=footAssets.map(makeStage).join('');
 for(const el of document.querySelectorAll('.stage svg')){
  el.addEventListener('click',onSvgAction);
  el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){if(ev.target.dataset.action==='pain-add')return;ev.preventDefault();onSvgAction(ev);}});
 }
 byId('pain-controls').classList.toggle('hidden',mode!=='pain');
 byId('wpi-controls').classList.toggle('hidden',mode!=='wpi');
 if(mode==='wpi')byId('wpi-region-list').innerHTML=DATA.wpi.regions.map(z=>`<button type="button" class="wpi-chip ${value.wpi.has(z.id)?'chosen':''}" data-wpi-id="${esc(z.id)}" aria-pressed="${value.wpi.has(z.id)}">${esc(z.label)}</button>`).join('');
 byId('joint-controls').classList.toggle('hidden',mode!=='das28');
 const list=byId('selected-list');list.innerHTML='';let summary='';
 if(mode==='pain'){summary=`${value.pain.length} <span>marcações</span>`;list.innerHTML=value.pain.map(p=>`<li>${esc(titleFor[p.asset])} · ${p.intensity}/10</li>`).join('');}
 if(mode==='wpi'){summary=`${value.wpi.size} <span>/ 19 regiões</span>`;list.innerHTML=DATA.wpi.regions.filter(r=>value.wpi.has(r.id)).map(r=>`<li>${esc(r.label)}</li>`).join('');}
 if(mode==='das28'){summary=`${value.tender.size} <span>dolorosas</span> + ${value.swollen.size} <span>edemaciadas</span>`;const names=new Map(DATA.das.joints.map(z=>[z.id,z.label]));list.innerHTML=[...new Set([...value.tender,...value.swollen])].map(id=>`<li>${esc(names.get(id))} (${value.tender.has(id)?'D':''}${value.tender.has(id)&&value.swollen.has(id)?' + ':''}${value.swollen.has(id)?'E':''})</li>`).join('');}
 if(mode==='psa')summary='<span>Sem escore — modo ilustrativo</span>';
 byId('summary').innerHTML=summary;
 for(const b of document.querySelectorAll('[data-dimension]'))b.setAttribute('aria-pressed',String(b.dataset.dimension===jointDimension));
}
function exportState(){const obj={schema:'atlas-anatomico-nathan/1.0',timestamp:new Date().toISOString(),mode,values:mode==='pain'?value.pain:mode==='wpi'?[...value.wpi]:mode==='das28'?{tender:[...value.tender],swollen:[...value.swollen]}:{}};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='atlas-selecao-'+mode+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
function reset(){if(mode==='pain')value.pain=[];if(mode==='wpi')value.wpi.clear();if(mode==='das28'){value.tender.clear();value.swollen.clear();}render();}
document.addEventListener('DOMContentLoaded',()=>{for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>changeMode(b.dataset.mode));for(const b of document.querySelectorAll('[data-dimension]'))b.addEventListener('click',()=>{jointDimension=b.dataset.dimension;render();});byId('severity').addEventListener('input',e=>{severity=Number(e.target.value);byId('severity-number').textContent=severity});byId('reset').addEventListener('click',reset);byId('export').addEventListener('click',exportState);byId('wpi-region-list').addEventListener('click',ev=>{const b=ev.target.closest('[data-wpi-id]');if(!b)return;const id=b.dataset.wpiId;value.wpi.has(id)?value.wpi.delete(id):value.wpi.add(id);render();});render();});
