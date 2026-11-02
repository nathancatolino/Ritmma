/** Anatomia reutilizável — React 18+, sem dependências além de React.
 * Copie assets/png e assets/hitmaps para /public/anatomy e os JSON de schemas para seu projeto.
 * Área clínica: coordenadas são visuais; identificadores estáveis são o dado de referência.
 */
import React, {useState} from 'react';
import wpiSchema from '../schemas/wpi19.json';
import dasSchema from '../schemas/das28.json';
import anterior from '../assets/hitmaps/corpo-anterior.json';
import posterior from '../assets/hitmaps/corpo-posterior.json';
import maoDireita from '../assets/hitmaps/mao-direita.json';
import maoEsquerda from '../assets/hitmaps/mao-esquerda.json';
import peDireito from '../assets/hitmaps/pe-direito.json';
import peEsquerdo from '../assets/hitmaps/pe-esquerdo.json';
import wpiAnterior from '../assets/hitmaps/wpi-anterior.json';
import wpiPosterior from '../assets/hitmaps/wpi-posterior.json';
import './AnatomyMap.css';
const maps={'corpo-anterior':anterior,'corpo-posterior':posterior,'mao-direita':maoDireita,'mao-esquerda':maoEsquerda,'pe-direito':peDireito,'pe-esquerdo':peEsquerdo,'wpi-anterior':wpiAnterior,'wpi-posterior':wpiPosterior};
const names={'corpo-anterior':'Anterior','corpo-posterior':'Posterior','wpi-anterior':'Anterior · WPI','wpi-posterior':'Posterior · WPI','mao-direita':'Mão direita','mao-esquerda':'Mão esquerda','pe-direito':'Pé direito','pe-esquerdo':'Pé esquerdo'};
const blank=()=>({pain:[],wpi:[],tender:[],swollen:[]});
const ratingColor=n=>n===0?'#a8b7c5':n<=3?'#f1a034':n<=6?'#e97a49':'#e64367';
function pointOnSVG(svg,event){const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const p=point.matrixTransform(svg.getScreenCTM().inverse());return {x:+p.x.toFixed(1),y:+p.y.toFixed(1)};}
export function AnatomyMap({mode='pain', value, defaultValue, onChange=()=>{}, assetBaseUrl='/anatomy', intensity=4, dimension='tender'}) {
 const [internal,setInternal]=useState(defaultValue||blank());
 const state=value??internal;
 const emit=next=>{if(value===undefined)setInternal(next);onChange(next);};
 const groups=mode==='wpi'?[['wpi-anterior','wpi-posterior']]:mode==='das28'||mode==='psa'?[['corpo-anterior','corpo-posterior'],['mao-direita','mao-esquerda'],...(mode==='psa'?[['pe-direito','pe-esquerdo']]:[])]:[['corpo-anterior','corpo-posterior']];
 const toggle=(field,id)=>{const set=new Set(state[field]||[]);set.has(id)?set.delete(id):set.add(id);emit({...state,[field]:[...set]});};
 const fig=(asset)=>{
  const m=maps[asset];const d=mode==='wpi'?wpiSchema.regions.filter(o=>o.asset===asset):mode==='das28'?dasSchema.joints.filter(o=>o.asset===asset):[];
  return <figure key={asset} className="n-anatomy-card"><figcaption>{names[asset]}</figcaption><div className="n-anatomy-figure"><svg viewBox={`0 0 ${m.width} ${m.height}`} preserveAspectRatio="xMidYMid meet" aria-label={`Mapa ${names[asset]}`}><image href={`${assetBaseUrl}/${asset}.png`} width={m.width} height={m.height} x="0" y="0" pointerEvents="none" />
  {mode==='pain'&&asset.startsWith('corpo')&&<path d={m.path} fill="transparent" style={{cursor:'crosshair'}} onClick={e=>{const p=pointOnSVG(e.currentTarget.ownerSVGElement,e);emit({...state,pain:[...(state.pain||[]),{id:crypto.randomUUID(),asset,...p,intensity}]});}}/>}
  {mode==='pain'&&(state.pain||[]).filter(p=>p.asset===asset).map(p=><circle key={p.id} cx={p.x} cy={p.y} r="10" stroke="white" strokeWidth="3" fill={ratingColor(p.intensity)} tabIndex="0" role="button" aria-label={`Remover marcação ${p.intensity}/10`} onClick={()=>emit({...state,pain:state.pain.filter(q=>q.id!==p.id)})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();emit({...state,pain:state.pain.filter(q=>q.id!==p.id)})}}}/>) }
  {d.map(z=>{const field=mode==='wpi'?'wpi':dimension;const selected=(state[field]||[]).includes(z.id);const tender=(state.tender||[]).includes(z.id);const swollen=(state.swollen||[]).includes(z.id);const color=mode==='wpi'?'#4e87be':tender&&swollen?'#d54778':tender?'#ef8857':swollen?'#9a75c9':'#b4c5d2';return <g key={z.id}>
  {mode==='wpi' ? <path d={z.path} fill={selected?'#82b2e16b':'transparent'} stroke={selected?'#4c83b7':'transparent'} strokeWidth="2" role="button" tabIndex="0" aria-label={z.label} aria-pressed={selected} style={{cursor:'pointer'}} onClick={()=>toggle(field,z.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(field,z.id)}}}><title>{z.label}</title></path> : <circle cx={z.x} cy={z.y} r="14" fill="transparent" role="button" tabIndex="0" aria-label={z.label} aria-pressed={selected} style={{cursor:'pointer'}} onClick={()=>toggle(field,z.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(field,z.id)}}}><title>{z.label}</title></circle>}
  {mode!=='wpi' && <circle cx={z.x} cy={z.y} r={tender||swollen?7:5} fill={selected?color:'#edf3f7'} stroke={selected?'#ffffff':'#607e99'} strokeWidth="1.6" pointerEvents="none" />}
  </g>})}
  </svg></div></figure>;
 };
 return <section className="n-anatomy"><div className="n-anatomy-groups">{groups.map((assets,i)=><div key={i} className="n-anatomy-group">{assets.map(fig)}</div>)}</div><div className="n-anatomy-hint">Direita e esquerda referem-se sempre ao paciente. A ilustração não determina diagnóstico nem substitui o exame clínico.</div></section>;
}
export default AnatomyMap;
