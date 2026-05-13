'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { LayoutGrid, Trash2, RefreshCw, Eye, EyeOff, Crosshair, Check, ImageIcon, Upload, X } from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite-admin';
import { Query, ID } from 'appwrite';

const PANELS_COL   = 'hotspot_panels';
const HOTSPOTS_COL = 'banner_overlay_positions';
const PRODUCTS_COL = 'products';
const IMAGE_BUCKET = '67f41e05000d0adb6f12';

/* ─────────────────────────────────────────────────────────────────
   LAYOUT PRESETS (10 structures)
   isTall: true = columnas altas (portrait)
───────────────────────────────────────────────────────────────────*/
const LAYOUTS = [
  /* A – 2 columnas iguales */
  { id:'A', label:'2 columnas', cells:2, isTall:false,
    grid:'repeat(2,1fr)', rows:'340px', spans:[{},{}] },

  /* B – 3 columnas iguales */
  { id:'B', label:'3 columnas', cells:3, isTall:false,
    grid:'repeat(3,1fr)', rows:'380px', spans:[{},{},{}] },

  /* C – 1 grande izq + 2 apiladas */
  { id:'C', label:'1 grande + 2 apiladas', cells:3, isTall:false,
    grid:'repeat(2,1fr)', rows:'repeat(2,200px)', spans:[{gridRow:'1/3'},{},{}] },

  /* D – 2×2 cuadrícula */
  { id:'D', label:'2×2 cuadrícula', cells:4, isTall:false,
    grid:'repeat(2,1fr)', rows:'repeat(2,220px)', spans:[{},{},{},{}] },

  /* E – 1 ancho arriba + 3 abajo */
  { id:'E', label:'1 arriba + 3 abajo', cells:4, isTall:false,
    grid:'repeat(3,1fr)', rows:'repeat(2,200px)', spans:[{gridColumn:'1/4'},{},{},{}] },

  /* F – 1 grande izq + 4 pequeñas der (2×2) */
  { id:'F', label:'1 grande + 4 pequeñas', cells:5, isTall:false,
    grid:'2fr 1fr 1fr', rows:'repeat(2,240px)', spans:[{gridRow:'1/3'},{},{},{},{}] },

  /* G – 2 filas × 3 columnas */
  { id:'G', label:'6 celdas (2×3)', cells:6, isTall:false,
    grid:'repeat(3,1fr)', rows:'repeat(2,240px)', spans:[{},{},{},{},{},{}] },

  /* H – 7 celdas: 4 arriba + fila abajo con primera doble */
  { id:'H', label:'7 celdas', cells:7, isTall:false,
    grid:'repeat(4,1fr)', rows:'repeat(2,200px)', spans:[{},{},{},{},{gridColumn:'1/3'},{},{}] },

  /* I – 2 columnas altas (portrait) */
  { id:'I', label:'2 columnas altas', cells:2, isTall:true,
    grid:'repeat(2,1fr)', rows:'480px', spans:[{},{}] },

  /* J – 3 columnas altas (portrait) */
  { id:'J', label:'3 columnas altas', cells:3, isTall:true,
    grid:'repeat(3,1fr)', rows:'480px', spans:[{},{},{}] },
] as const;

type LayoutId = typeof LAYOUTS[number]['id'] | 'NONE';

interface Panel {
  $id:string; IMAGEURL:string; TITLE?:string; LINKURL?:string;
  MOSAICGROUP:string; CELLINDEX:number; ISACTIVE:boolean; DISPLAYORDER:number;
}
interface Hotspot {
  $id:string; BANNERID:string; PRODUCTID:string;
  POSITIONX:number; POSITIONY:number;
  CIRCLECOLOR?:string; ISACTIVE:boolean; DISPLAYORDER:number; CLICKS:number;
}
interface Product { $id:string; NAME:string; IMAGEURL?:string; PRICE:number; CURRENTPRICE?:number; }

export default function HotspotBannersPage() {
  const [panels, setPanels]             = useState<Panel[]>([]);
  const [hotspots, setHotspots]         = useState<Hotspot[]>([]);
  const [products, setProducts]         = useState<Product[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSaving, setIsSaving]         = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [layoutId, setLayoutId]         = useState<LayoutId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collage_layout_id');
      if (saved === 'NONE') return 'NONE';
      if (saved && LAYOUTS.some(l => l.id === saved)) return saved as LayoutId;
    }
    return 'C';
  });
  const [selectedCell, setSelectedCell] = useState<number|null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product|null>(null);
  const [pendingPos, setPendingPos]     = useState<{x:number;y:number}|null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTitle, setEditTitle]       = useState('');
  const [editLinkUrl, setEditLinkUrl]   = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const layout = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[2];

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const [panelRes, hsRes, pRes] = await Promise.all([
        databases.listDocuments(databaseId, PANELS_COL,   [Query.equal('MOSAICGROUP','main'), Query.orderAsc('CELLINDEX'), Query.limit(30)]),
        databases.listDocuments(databaseId, HOTSPOTS_COL, [Query.orderAsc('DISPLAYORDER'), Query.limit(200)]),
        databases.listDocuments(databaseId, PRODUCTS_COL, [Query.orderAsc('NAME'), Query.limit(100)]),
      ]);
      setPanels(panelRes.documents as unknown as Panel[]);
      setHotspots(hsRes.documents as unknown as Hotspot[]);
      setProducts(pRes.documents as unknown as Product[]);
    } catch (e:any) { alert('Error: '+e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    if(selectedCell===null) return;
    const p = panels.find(x=>x.CELLINDEX===selectedCell);
    setEditImageUrl(p?.IMAGEURL||'');
    setEditTitle(p?.TITLE||'');
    setEditLinkUrl(p?.LINKURL||'');
    setPendingProduct(null); setPendingPos(null);
  },[selectedCell, panels]);

  /* ── Upload from PC ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { storage } = getServices();
      const { endpoint, projectId } = getAppwriteConfig();
      const fileId = ID.unique();
      await storage.createFile(IMAGE_BUCKET, fileId, file);
      const url = `${endpoint}/storage/buckets/${IMAGE_BUCKET}/files/${fileId}/view?project=${projectId}`;
      setEditImageUrl(url);
    } catch (e:any) { alert('Error al subir imagen: '+e.message); }
    finally { setIsUploading(false); if(fileInputRef.current) fileInputRef.current.value=''; }
  };

  /* ── Save / update panel ── */
  const savePanel = async () => {
    if (!editImageUrl||selectedCell===null) return;
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const existing = panels.find(p=>p.CELLINDEX===selectedCell);
      if(existing){
        const updated = await databases.updateDocument(databaseId, PANELS_COL, existing.$id,{
          IMAGEURL:editImageUrl, TITLE:editTitle||undefined, LINKURL:editLinkUrl||undefined,
        });
        setPanels(prev=>prev.map(p=>p.$id===existing.$id ? updated as unknown as Panel : p));
      } else {
        const created = await databases.createDocument(databaseId, PANELS_COL, ID.unique(),{
          IMAGEURL:editImageUrl, TITLE:editTitle||undefined, LINKURL:editLinkUrl||undefined,
          MOSAICGROUP:'main', CELLINDEX:selectedCell, ISACTIVE:true, DISPLAYORDER:selectedCell,
        });
        setPanels(prev=>[...prev, created as unknown as Panel]);
      }
    } catch(e:any){ alert('Error: '+e.message); }
    finally { setIsSaving(false); }
  };

  const deletePanel = async (panelId:string) => {
    if(!confirm('¿Eliminar este panel y sus hotspots?')) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const hs = hotspots.filter(h=>h.BANNERID===panelId);
      await Promise.all(hs.map(h=>databases.deleteDocument(databaseId, HOTSPOTS_COL, h.$id)));
      await databases.deleteDocument(databaseId, PANELS_COL, panelId);
      setPanels(prev=>prev.filter(p=>p.$id!==panelId));
      setHotspots(prev=>prev.filter(h=>h.BANNERID!==panelId));
      setSelectedCell(null);
    } catch(e:any){ alert('Error: '+e.message); }
  };

  /* ── Click on cell to place hotspot ── */
  const handleCellClick = (e:React.MouseEvent<HTMLDivElement>, panel:Panel) => {
    if(!pendingProduct) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPendingPos({ x:(e.clientX-rect.left)/rect.width, y:(e.clientY-rect.top)/rect.height });
  };

  const confirmHotspot = async () => {
    if(!pendingProduct||!pendingPos||selectedCell===null) return;
    const panel = panels.find(p=>p.CELLINDEX===selectedCell);
    if(!panel){ alert('Guarda la imagen del panel primero'); return; }
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const created = await databases.createDocument(databaseId, HOTSPOTS_COL, ID.unique(),{
        BANNERID:panel.$id, PRODUCTID:pendingProduct.$id,
        POSITIONX:pendingPos.x, POSITIONY:pendingPos.y,
        SCALE:1.0, CIRCLESCALE:1.0, DISPLAYTYPE:'default',
        CIRCLECOLOR:'#ffffff', ISACTIVE:true,
        DISPLAYORDER:hotspots.filter(h=>h.BANNERID===panel.$id).length, CLICKS:0,
      });
      setHotspots(prev=>[...prev, created as unknown as Hotspot]);
      setPendingProduct(null); setPendingPos(null);
    } catch(e:any){ alert('Error: '+e.message); }
    finally { setIsSaving(false); }
  };

  const removeHotspot = async (id:string) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, HOTSPOTS_COL, id);
      setHotspots(prev=>prev.filter(h=>h.$id!==id));
    } catch(e:any){ alert(e.message); }
  };

  const toggleHotspot = async (h:Hotspot) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, HOTSPOTS_COL, h.$id,{ISACTIVE:!h.ISACTIVE});
      setHotspots(prev=>prev.map(x=>x.$id===h.$id ? {...x,ISACTIVE:!x.ISACTIVE} : x));
    } catch(e:any){ alert(e.message); }
  };

  const filteredProducts = products.filter(p=>p.NAME.toLowerCase().includes(productSearch.toLowerCase()));
  const selectedPanel    = selectedCell!==null ? panels.find(p=>p.CELLINDEX===selectedCell) : null;
  const selectedHotspots = selectedPanel ? hotspots.filter(h=>h.BANNERID===selectedPanel.$id) : [];

  /* ── Mini layout preview card ── */
  const LayoutPreview = ({ l }: { l: typeof LAYOUTS[number] }) => {
    const active = layoutId === l.id;
    // Si es tall, el preview es vertical (alto > ancho)
    const previewRows = l.isTall ? '32px 32px 32px' : '20px 20px';
    const previewH    = l.isTall ? 72 : 48;
    return (
      <div style={{ display:'grid', gridTemplateColumns:l.grid, gridTemplateRows:previewRows, gap:2, width:80, height:previewH, borderRadius:4, overflow:'hidden' }}>
        {(l.spans as readonly Record<string,string>[]).map((span,i)=>(
          <div key={i} style={{ ...span, background: active ? `hsl(${240+i*15},60%,${55+i*4}%)` : '#e5e7eb', borderRadius:1 }} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-600" /> Collage Interactivo
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Arma un collage estilo IKEA con hotspots de producto en cada celda</p>
        </div>
        <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading?'animate-spin':''}`} />
        </button>
      </div>

      {/* Layout picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Elige la estructura ({LAYOUTS.length} opciones)</p>
        <div className="flex gap-3 flex-wrap">
          {/* Sin collage option */}
          <button onClick={()=>{ setLayoutId('NONE'); setSelectedCell(null); if (typeof window !== 'undefined') localStorage.setItem('collage_layout_id', 'NONE'); }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${ layoutId==='NONE' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div style={{width:80,height:48,borderRadius:4,background:layoutId==='NONE'?'#fee2e2':'#f3f4f6',border:'2px dashed #d1d5db',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 text-center leading-tight">Sin collage</span>
            {layoutId==='NONE' && <span className="text-xs text-red-500 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" />Activo</span>}
          </button>
          {LAYOUTS.map(l=>(
            <button key={l.id} onClick={()=>{ 
              setLayoutId(l.id); 
              setSelectedCell(null); 
              if (typeof window !== 'undefined') localStorage.setItem('collage_layout_id', l.id);
            }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${layoutId===l.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <LayoutPreview l={l} />
              <span className="text-xs font-medium text-gray-600 max-w-20 text-center leading-tight">{l.label}</span>
              {layoutId===l.id && <span className="text-xs text-indigo-600 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" />Activo</span>}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : layoutId === 'NONE' ? (
        <div className="bg-white rounded-2xl border border-dashed border-red-300 p-10 flex flex-col items-center justify-center gap-3 text-center">
          <X className="w-10 h-10 text-red-300" />
          <p className="text-sm font-semibold text-gray-500">Collage desactivado</p>
          <p className="text-xs text-gray-400">La sección "Explora nuestra colección" no aparecerá en la tienda.<br/>Selecciona una estructura para volver a activarla.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">

          {/* MAIN canvas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-xs text-gray-500 font-medium">
              {pendingProduct ? `Modo colocación: haz clic en una celda para posicionar "${pendingProduct.NAME.slice(0,25)}"` : 'Haz clic en una celda para editarla'}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:layout.grid, gridTemplateRows:layout.rows, gap:5, borderRadius:10, overflow:'hidden' }}>
              {Array.from({length:layout.cells},(_,idx)=>{
                const panel = panels.find(p=>p.CELLINDEX===idx);
                const cellHotspots = panel ? hotspots.filter(h=>h.BANNERID===panel.$id) : [];
                const isSelected = selectedCell===idx;
                const spanStyle = (layout.spans as readonly Record<string,string>[])[idx] || {};
                return (
                  <div key={idx} style={{ position:'relative', background:'#f3f4f6', cursor:'pointer', ...spanStyle,
                    outline: isSelected ? '3px solid #6366f1' : pendingProduct ? '2px dashed #6366f1' : '0px solid transparent',
                    outlineOffset:'-3px', transition:'outline .15s' }}
                    onClick={e=>{ if(panel&&pendingProduct){ handleCellClick(e,panel); } else { setSelectedCell(isSelected?null:idx); } }}>
                    {panel ? (
                      <>
                        <Image src={panel.IMAGEURL} alt={panel.TITLE||`Celda ${idx+1}`} fill style={{objectFit:'cover'}} unoptimized />
                        {cellHotspots.map(h=>{
                          const prod = products.find(p=>p.$id===h.PRODUCTID);
                          return (
                            <div key={h.$id} style={{position:'absolute',left:`${h.POSITIONX*100}%`,top:`${h.POSITIONY*100}%`,transform:'translate(-50%,-50%)',zIndex:10}}>
                              <div style={{position:'relative',width:28,height:28}}>
                                {/* Outer pulse ring */}
                                <div style={{position:'absolute',inset:-4,borderRadius:'50%',background:h.ISACTIVE?'rgba(99,102,241,0.25)':'rgba(156,163,175,0.25)',animation:'adminPulse 2s ease-in-out infinite'}} />
                                {/* Main glass dot */}
                                <div title={prod?.NAME} style={{position:'absolute',inset:0,borderRadius:'50%',background:h.ISACTIVE?'rgba(99,102,241,0.85)':'rgba(156,163,175,0.85)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',border:'2px solid rgba(255,255,255,0.6)',boxShadow:'0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s ease'}}>
                                  <Crosshair style={{width:11,height:11,color:'#fff'}} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isSelected&&pendingPos&&(
                          <div style={{position:'absolute',left:`${pendingPos.x*100}%`,top:`${pendingPos.y*100}%`,transform:'translate(-50%,-50%)',zIndex:11}}>
                            <div style={{width:26,height:26,borderRadius:'50%',background:'#10b981',border:'3px solid #fff',boxShadow:'0 2px 12px rgba(16,185,129,.6)'}} />
                          </div>
                        )}
                        <div style={{position:'absolute',top:6,left:6,background:isSelected?'#6366f1':'rgba(0,0,0,.45)',color:'#fff',fontSize:10,fontWeight:700,borderRadius:4,padding:'2px 6px',zIndex:5}}>
                          {idx+1} {cellHotspots.length>0&&`· ${cellHotspots.length}hs`}
                        </div>
                      </>
                    ) : (
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,background:isSelected?'#eef2ff':'#f9fafb'}}>
                        <ImageIcon style={{width:26,height:26,color:isSelected?'#6366f1':'#d1d5db'}} />
                        <span style={{fontSize:12,color:isSelected?'#6366f1':'#9ca3af',fontWeight:600}}>Celda {idx+1}</span>
                        <span style={{fontSize:10,color:'#b0b7c3'}}>Clic para agregar imagen</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CONTROLES DE LA CELDA SELECCIONADA — directamente debajo del canvas */}
            {selectedCell!==null && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{selectedCell+1}</span>
                    Editar Celda {selectedCell+1}
                  </h3>
                  <button onClick={()=>setSelectedCell(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Columna izquierda: Imagen + datos */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">Imagen *</label>
                      <input value={editImageUrl} onChange={e=>setEditImageUrl(e.target.value)}
                        placeholder="https://..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2" />
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      <button onClick={()=>fileInputRef.current?.click()} disabled={isUploading}
                        className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl text-xs font-medium text-gray-500 hover:text-indigo-600 transition disabled:opacity-50">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? 'Subiendo...' : 'Subir desde PC'}
                      </button>
                      {editImageUrl&&(
                        <div className="relative mt-2 rounded-lg overflow-hidden h-28 bg-gray-100">
                          <Image src={editImageUrl} alt="preview" fill style={{objectFit:'cover'}} unoptimized />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">Título (opcional)</label>
                        <input value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                          placeholder="Ej: Sala de estar" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">Link (opcional)</label>
                        <input value={editLinkUrl} onChange={e=>setEditLinkUrl(e.target.value)}
                          placeholder="/productos/..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={savePanel} disabled={!editImageUrl||isSaving}
                        className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                        {isSaving ? 'Guardando...' : selectedPanel ? 'Actualizar celda' : 'Guardar celda'}
                      </button>
                      {selectedPanel&&(
                        <button onClick={()=>deletePanel(selectedPanel.$id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Columna derecha: Hotspots */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hotspots — Celda {selectedCell+1}</p>

                    {/* Status bar */}
                    <div className={`rounded-xl px-3 py-2 text-xs font-medium ${pendingProduct&&!pendingPos?'bg-indigo-50 text-indigo-700':pendingProduct&&pendingPos?'bg-emerald-50 text-emerald-700':'bg-gray-50 text-gray-500'}`}>
                      {!pendingProduct&&'Selecciona un producto y haz clic en la celda'}
                      {pendingProduct&&!pendingPos&&`Haz clic en la celda ${selectedCell+1} para posicionar`}
                      {pendingProduct&&pendingPos&&(
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>¿Confirmar posición?</span>
                          <button onClick={confirmHotspot} disabled={isSaving} className="ml-auto px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">{isSaving?'...':'Sí'}</button>
                          <button onClick={()=>setPendingPos(null)} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded">Rehacer</button>
                          <button onClick={()=>{setPendingProduct(null);setPendingPos(null);}} className="text-gray-400">✕</button>
                        </div>
                      )}
                    </div>

                    {/* Product search */}
                    <input value={productSearch} onChange={e=>setProductSearch(e.target.value)}
                      placeholder="Buscar producto..." className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filteredProducts.slice(0,8).map(p=>(
                        <button key={p.$id} onClick={()=>{setPendingProduct(p);setPendingPos(null);}}
                          className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition ${pendingProduct?.$id===p.$id?'bg-indigo-50 border border-indigo-200':'hover:bg-gray-50'}`}>
                          <div className="relative w-6 h-6 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                            {p.IMAGEURL&&<Image src={p.IMAGEURL} alt={p.NAME} fill style={{objectFit:'contain'}} unoptimized />}
                          </div>
                          <span className="text-xs text-gray-700 truncate flex-1">{p.NAME}</span>
                          {pendingProduct?.$id===p.$id&&<Check className="w-3 h-3 text-indigo-600 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>

                    {/* Hotspots list */}
                    {selectedHotspots.length>0&&(
                      <div className="space-y-1 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium mb-1">{selectedHotspots.length} hotspot{selectedHotspots.length>1?'s':''}</p>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {selectedHotspots.map(h=>{
                            const prod = products.find(p=>p.$id===h.PRODUCTID);
                            return (
                              <div key={h.$id} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50">
                                <div className="relative w-5 h-5 rounded bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
                                  {prod?.IMAGEURL&&<Image src={prod.IMAGEURL} alt={prod.NAME} fill style={{objectFit:'contain'}} unoptimized />}
                                </div>
                                <span className="text-xs text-gray-600 flex-1 truncate">{prod?.NAME||'Producto'}</span>
                                <button onClick={()=>toggleHotspot(h)} className={`p-0.5 rounded ${h.ISACTIVE?'text-emerald-600':'text-gray-400'}`}>
                                  {h.ISACTIVE?<Eye className="w-3 h-3"/>:<EyeOff className="w-3 h-3"/>}
                                </button>
                                <button onClick={()=>removeHotspot(h.$id)} className="p-0.5 text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes adminPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.8); }
        }
      `}</style>
    </div>
  );
}