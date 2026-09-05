'use client';
import {flushSync} from 'react-dom';
import {useState, useRef, useEffect} from 'react';
import {ArrowUpRight, Box, Layers3, RotateCcw, Rotate3d, Plus, Minus, Maximize2, X, Crosshair, ChevronRight, CircleHelp, Expand, MoreHorizontal} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {parts,describePiece,translatePieceLabel, type PartId} from './parts';
import {LanguageProvider,useLanguage} from './i18n';
import VehicleScene, {type SceneHandle} from './vehicle-scene';
export default function Home(){
 return <LanguageProvider><Studio/></LanguageProvider>
}
function Studio(){
 const {lang,setLang,t}=useLanguage();
 const [selected,setSelected]=useState<PartId>('body');
 const [canFullscreen,setCanFullscreen]=useState(false);
 const [compact,setCompact]=useState(false);const [toolsOpen,setToolsOpen]=useState(false);
 const [componentsOpen,setComponentsOpen]=useState(false);const [detailOpen,setDetailOpen]=useState(false);
 const [explode,setExplode]=useState(0); const [labels,setLabels]=useState(false); const [rotate,setRotate]=useState(false); const [isolated,setIsolated]=useState(false); const [help,setHelp]=useState(false);
 useEffect(()=>{setCanFullscreen(Boolean(document.fullscreenEnabled));const query=window.matchMedia('(max-width: 700px), (max-height: 500px)');const update=()=>{setCompact(query.matches);setComponentsOpen(!query.matches);setToolsOpen(false)};update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 const [focusedMesh,setFocusedMesh]=useState('');
 const [catalog,setCatalog]=useState<{id:string;part:PartId;label:string}[]>([]);
 useEffect(()=>{fetch('/models/model-x-manifest.json').then(r=>r.json()).then(m=>setCatalog((m as {objects:{id:string;part:PartId;label:string}[]}).objects)).catch(()=>{});},[]);
 const [tab,setTab]=useState('overview'); const scene=useRef<SceneHandle|null>(null); const root=useRef<HTMLDivElement>(null);
 const langRef=useRef(lang);langRef.current=lang;
 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try { Promise.resolve(context.registerTool({name:'explore_vehicle_component',description:'Select a Model X component, set its exploded view and optionally isolate it in the 3D study.',inputSchema:{type:'object',properties:{component:{type:'string',enum:parts.map(p=>p.id)},explosion:{type:'number',minimum:0,maximum:100},isolate:{type:'boolean'}},required:['component'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input:unknown){
    const v=input as {component:PartId;explosion?:number;isolate?:boolean};
    if(!v||!parts.some(p=>p.id===v.component)||(v.explosion!==undefined&&(typeof v.explosion!=='number'||!Number.isFinite(v.explosion)||v.explosion<0||v.explosion>100))||(v.isolate!==undefined&&typeof v.isolate!=='boolean'))throw new Error('Choose a valid component and an explosion value between 0 and 100.');
    flushSync(()=>{setSelected(v.component);setFocusedMesh('');setDetailOpen(true);setTab('overview');if(window.matchMedia('(max-width: 700px), (max-height: 500px)').matches){setComponentsOpen(false);setHelp(false)}if(v.explosion!==undefined)setExplode(v.explosion);if(v.isolate!==undefined)setIsolated(v.isolate)});
    return {component:v.component,description:parts.find(p=>p.id===v.component)!.description[langRef.current]};
  }},{signal:lifecycle.signal})).catch(()=>{}); }catch{}
  return()=>lifecycle.abort();
 },[]);
 const part=parts.find(p=>p.id===selected)!; const piece=catalog.find(p=>p.id===focusedMesh);
 const pieceLabel=piece?translatePieceLabel(piece.label,lang):'';
 function select(id:PartId){setFocusedMesh('');setSelected(id);setTab('overview');setDetailOpen(true);if(compact){setComponentsOpen(false);setHelp(false);setToolsOpen(false)}}
 function toggleComponents(){setComponentsOpen(!componentsOpen);if(compact){setDetailOpen(false);setHelp(false);setToolsOpen(false)}}
 function toggleHelp(){setHelp(!help);if(compact){setComponentsOpen(false);setDetailOpen(false);setToolsOpen(false)}}

 return <main className="studio" ref={root}>
  <section className="stage-view" aria-label={t('studioAria')}>
   <VehicleScene focusedMesh={focusedMesh} onInspect={setFocusedMesh} ref={scene} selected={selected} explode={explode} labels={labels} autoRotate={rotate} isolated={isolated} onSelect={select}/>
  </section>
  <div className="model-plaque"><span>T E S L A</span><h1>MODEL X</h1></div>
  {componentsOpen&&<aside className="components-panel floating-panel" aria-label={t('components')}>
   <div className="panel-heading"><h2>{t('components')}</h2><button className="icon-button" onClick={()=>setComponentsOpen(false)} aria-label={t('hideComponents')}><X size={14}/></button></div>
   <div className="parts-list">{parts.map((p,i)=><button key={p.id} onClick={()=>select(p.id)} className={'part-row '+(p.id===selected&&detailOpen?'selected':'')} aria-pressed={p.id===selected&&detailOpen}><span className="part-number">{String(i+1).padStart(2,'0')}</span><span>{p.name[lang]}</span><ChevronRight size={13}/></button>)}</div>
  </aside>}
  <nav className="view-tools floating-panel" data-expanded={toolsOpen} aria-label={t('viewControls')}>
   <button className={'tools-components '+(componentsOpen?'active':'')} title={t('components')} onClick={toggleComponents} aria-label={t('toggleComponents')} aria-pressed={componentsOpen}><Layers3 size={18}/></button>
   <span/>
   <button className="tools-extra" title={t('zoomIn')} onClick={()=>scene.current?.zoom(.85)} aria-label={t('zoomIn')}><Plus size={18}/></button>
   <button className="tools-extra" title={t('zoomOut')} onClick={()=>scene.current?.zoom(1.18)} aria-label={t('zoomOut')}><Minus size={18}/></button>
   <button className="tools-reset" title={t('resetView')} onClick={()=>{setRotate(false);scene.current?.reset()}} aria-label={t('resetView')}><RotateCcw size={17}/></button>
   <button className={'tools-extra '+(rotate?'active':'')} title={t('autoRotate')} onClick={()=>setRotate(!rotate)} aria-label={t('toggleAutoRotation')} aria-pressed={rotate}><Rotate3d size={18}/></button>
   <span/>
   {canFullscreen&&<button className="tools-extra" title={t('fullscreen')} onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else root.current?.requestFullscreen?.()}} aria-label={t('toggleFullscreen')}><Maximize2 size={17}/></button>}
   <button className="tools-extra" title={t('aboutThisModel')} onClick={toggleHelp} aria-label={t('aboutThisModel')} aria-expanded={help}><CircleHelp size={17}/></button>
   <button className="tools-extra lang-toggle" title={t('switchLanguage')} onClick={()=>setLang(lang==='en'?'zh':'en')} aria-label={t('switchLanguage')}>{lang==='en'?'中文':'EN'}</button>
   <button className="tools-more" title={t('moreViewControls')} onClick={()=>setToolsOpen(!toolsOpen)} aria-label={t('moreViewControls')} aria-expanded={toolsOpen}><MoreHorizontal size={20}/></button>
  </nav>
  {detailOpen&&<aside className="detail-panel floating-panel" aria-label={t('componentDetails')}>
   <div className="panel-heading"><span>{part.category[lang]}{['battery','drive','suspension'].includes(selected)&&<span className="illustrative-badge">{t('illustrative')}</span>}</span><button className="icon-button" onClick={()=>setDetailOpen(false)} aria-label={t('closeDetails')}><X size={16}/></button></div>
   <div className="detail" aria-live="polite">
    <h2>{piece?pieceLabel:part.name[lang]}</h2>
    <Tabs value={tab} onValueChange={v=>setTab(String(v))}><TabsList variant="line" className="detail-tabs"><TabsTrigger value="overview">{t('overview')}</TabsTrigger><TabsTrigger value="working">{t('howItWorks')}</TabsTrigger></TabsList></Tabs>
    <p className="detail-copy">{piece&&tab==='overview'?describePiece(piece.label,lang):tab==='overview'?part.description[lang]:part.principle[lang]}</p>
    <dl className="specs">{part.specs.map(([a,b])=><div key={a.en}><dt>{a[lang]}</dt><dd>{b[lang]}</dd></div>)}</dl>
    {catalog.some(p=>p.part===selected)&&<div className="piece-picker"><span>{t('individualPieces')}</span><Select value={focusedMesh||'all'} onValueChange={value=>setFocusedMesh(value==='all'?'':String(value))}><SelectTrigger aria-label={t('choosePiece')}><SelectValue>{piece?pieceLabel:t('allPieces',{count:catalog.filter(p=>p.part===selected).length})}</SelectValue></SelectTrigger><SelectContent alignItemWithTrigger={false}>{[{id:'all',label:t('allPiecesInSystem')},...catalog.filter(p=>p.part===selected)].map((p,i)=><SelectItem key={p.id} value={p.id}>{i?`${String(i).padStart(2,'0')} · `:''}{i===0?p.label:translatePieceLabel(p.label,lang)}</SelectItem>)}</SelectContent></Select></div>}
    <button className={'isolate-button '+(isolated?'is-active':'')} onClick={()=>setIsolated(!isolated)}>{isolated?<Layers3 size={15}/>:<Crosshair size={15}/>} {isolated?t('showEverything'):focusedMesh?t('isolatePiece'):t('isolateComponent')}</button>
    <a className="source-link" href={part.source} target="_blank" rel="noreferrer">{t('teslaDocumentation')} <ArrowUpRight size={12}/></a>
   </div>
  </aside>}
  <div className="explode-dock floating-panel" aria-label={t('assemblyControls')}>
   <button className={'assembly-button '+(explode===0?'active':'')} title={t('assemble')} onClick={()=>{setExplode(0);setIsolated(false)}} aria-label={t('assembleVehicle')}><Box size={18}/><span>{t('assemble')}</span></button>
   <div className="explode-control"><div className="slider-caption"><label id="explode-label">{t('explode')}</label><output>{explode===100?t('piecesCount',{count:catalog.length}):`${explode}%`}</output></div><Slider aria-labelledby="explode-label" value={[explode]} onValueChange={v=>setExplode(Array.isArray(v)?v[0]:v)} min={0} max={100}/></div>
   <button className={'assembly-button '+(explode===100?'active':'')} title={t('separateAllPieces')} onClick={()=>{setExplode(100);setIsolated(false)}} aria-label={t('separateAllPieces')}><Expand size={18}/><span>{t('allParts')}</span></button>
   <div className="dock-divider"/><label className="labels-toggle"><Switch checked={labels} onCheckedChange={setLabels} aria-label={t('showLabels')}/><span>{t('labels')}</span></label>
  </div>
  {help&&<aside className="about-panel floating-panel" aria-label={t('aboutTheModel')}><div className="panel-heading"><h2>{t('aboutTheModel')}</h2><button className="icon-button" onClick={()=>setHelp(false)} aria-label={t('closeModelInfo')}><X size={15}/></button></div><p>{t('aboutIntro')}</p><p>{t('aboutCreditA')}<a href="https://www.blendkit.com/asset-gallery-detail/983e8f94-5a56-44a4-94d9-eed5e4cdcd6c/" target="_blank" rel="noreferrer">cgi Moon</a>{t('aboutCreditB',{count:catalog.length||334})}</p></aside>}
 </main>
}
