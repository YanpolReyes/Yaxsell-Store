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

// IMPORTANTE: este grupo separa el collage de plantilla 1 del de plantilla 2
const MOSAIC_GROUP = 'plantilla1';

// La sección Shop The Look de la plantilla 1 tiene una sola imagen grande (look)
// con hasta 4 hotspots posicionables que se vinculan a productos.
const DEFAULT_LAYOUT = {
  cells: 1,
  grid: '1fr',
  rows: '500px',
  spans: [{}],
} as const;
const MAX_HOTSPOTS = 4;

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

export default function HotspotBannersPlantilla1Page() {
  const [panels, setPanels]             = useState<Panel[]>([]);
  const [hotspots, setHotspots]         = useState<Hotspot[]>([]);
  const [products, setProducts]         = useState<Product[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSaving, setIsSaving]         = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [selectedCell, setSelectedCell] = useState<number|null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product|null>(null);
  const [pendingPos, setPendingPos]     = useState<{x:number;y:number}|null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [draggingHotspot, setDraggingHotspot] = useState<Hotspot | null>(null);
  const [dragPos, setDragPos]           = useState<{x:number;y:number}|null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTitle, setEditTitle]       = useState('');
  const [editLinkUrl, setEditLinkUrl]   = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const layout = DEFAULT_LAYOUT;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const [panelRes, pRes] = await Promise.all([
        databases.listDocuments(databaseId, PANELS_COL,   [Query.equal('MOSAICGROUP', MOSAIC_GROUP), Query.orderAsc('CELLINDEX'), Query.limit(30)]),
        databases.listDocuments(databaseId, PRODUCTS_COL, [Query.orderAsc('NAME'), Query.limit(500)]),
      ]);
      const loadedPanels = panelRes.documents as unknown as Panel[];
      setPanels(loadedPanels);
      setProducts(pRes.documents as unknown as Product[]);
      // Cargar hotspots solo de los paneles de este grupo
      if (loadedPanels.length > 0) {
        const panelIds = loadedPanels.map(p => p.$id);
        const hsRes = await databases.listDocuments(databaseId, HOTSPOTS_COL, [
          Query.equal('BANNERID', panelIds), Query.limit(500),
        ]);
        setHotspots(hsRes.documents as unknown as Hotspot[]);
      } else {
        setHotspots([]);
      }
    } catch (e:any) { alert('Error: '+e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  useEffect(()=>{
    if(selectedCell===null) return;
    const p = panels.find(x=>x.CELLINDEX===selectedCell);
    setEditImageUrl(p?.IMAGEURL||'');
    setEditTitle(p?.TITLE||'');
    setEditLinkUrl(p?.LINKURL||'');
    setPendingProduct(null); setPendingPos(null);
  },[selectedCell, panels]);

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
          MOSAICGROUP:MOSAIC_GROUP, CELLINDEX:selectedCell, ISACTIVE:true, DISPLAYORDER:selectedCell,
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

  const handleCellClick = (e:React.MouseEvent<HTMLDivElement>, _panel:Panel) => {
    if(!pendingProduct) return;
    // Con object-fit:cover el contenedor y la imagen coinciden exactamente
    const rect = e.currentTarget.getBoundingClientRect();
    setPendingPos({ x:(e.clientX-rect.left)/rect.width, y:(e.clientY-rect.top)/rect.height });
  };

  const handleDragStart = (e: React.MouseEvent, hotspot: Hotspot) => {
    e.stopPropagation();
    setDraggingHotspot(hotspot);
    setDragPos({ x: hotspot.POSITIONX, y: hotspot.POSITIONY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggingHotspot || !dragPos) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDragPos({ x, y });
  };

  const handleDragEnd = async () => {
    if (!draggingHotspot || !dragPos) return;
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, HOTSPOTS_COL, draggingHotspot.$id, {
        POSITIONX: dragPos.x,
        POSITIONY: dragPos.y,
      });
      setHotspots(prev => prev.map(h => h.$id === draggingHotspot.$id ? { ...h, POSITIONX: dragPos.x, POSITIONY: dragPos.y } : h));
    } catch (e: any) { alert('Error al actualizar posición: ' + e.message); }
    finally { setDraggingHotspot(null); setDragPos(null); setIsSaving(false); }
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-fuchsia-600" /> Collage Plantilla 1
            <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold">SHOP THE LOOK</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Vincula la imagen del look + hasta {MAX_HOTSPOTS} productos etiquetados (item1–item{MAX_HOTSPOTS}) de la plantilla 1</p>
        </div>
        <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading?'animate-spin':''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Diseño</p>
        <div className="flex items-center gap-3 rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-3">
          <div style={{ width:60, height:60, borderRadius:8, overflow:'hidden', background:'linear-gradient(135deg,#e879f9 0%,#a855f7 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:26 }}>🛍️</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Default Shop The Look</p>
            <p className="text-xs text-gray-500">1 imagen del look · hasta {MAX_HOTSPOTS} productos etiquetados vinculados a <strong>#item1–#item{MAX_HOTSPOTS}</strong> de la plantilla.</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            {/* ── Imagen del Look ── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Imagen del Look</p>
              {(() => {
                const panel = panels.find(p => p.CELLINDEX === 0);
                const isSelected = selectedCell === 0;
                const cellHotspots = panel ? hotspots.filter(h => h.BANNERID === panel.$id) : [];
                return (
                  <div
                    style={{ position:'relative', width:'100%', aspectRatio:'4/3', background:'#f3f4f6', borderRadius:14, overflow:'hidden', cursor:'pointer',
                      outline: isSelected ? '3px solid #d946ef' : pendingProduct ? '2px dashed #d946ef' : '2px solid transparent',
                      outlineOffset: -2, transition:'outline .15s' }}
                    onClick={e => { if (panel && pendingProduct) { handleCellClick(e, panel); } else { setSelectedCell(isSelected ? null : 0); } }}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}>
                    {panel ? (
                      <>
                        <Image src={panel.IMAGEURL} alt={panel.TITLE || 'Look'} fill style={{ objectFit:'cover' }} unoptimized />
                        {cellHotspots.map(h => {
                          const prod = products.find(p => p.$id === h.PRODUCTID);
                          const isDragging = draggingHotspot?.$id === h.$id;
                          const pos = isDragging && dragPos ? dragPos : { x: h.POSITIONX, y: h.POSITIONY };
                          return (
                            <div
                              key={h.$id}
                              style={{ position:'absolute', left:`${pos.x*100}%`, top:`${pos.y*100}%`, transform:'translate(-50%,-50%)', zIndex:isDragging ? 20 : 10, cursor:'move' }}
                              onMouseDown={(e) => handleDragStart(e, h)}>
                              <div style={{ position:'relative', width:32, height:32 }}>
                                <div style={{ position:'absolute', inset:-5, borderRadius:'50%', background:h.ISACTIVE?'rgba(217,70,239,0.3)':'rgba(156,163,175,0.25)', animation:'adminPulse 2s ease-in-out infinite' }} />
                                <div title={prod?.NAME} style={{ position:'absolute', inset:0, borderRadius:'50%', background:isDragging?'#10b981':(h.ISACTIVE?'rgba(217,70,239,0.9)':'rgba(156,163,175,0.85)'), border:'2.5px solid rgba(255,255,255,0.85)', boxShadow:'0 4px 14px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <Crosshair style={{ width:12, height:12, color:'#fff' }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isSelected && pendingPos && (
                          <div style={{ position:'absolute', left:`${pendingPos.x*100}%`, top:`${pendingPos.y*100}%`, transform:'translate(-50%,-50%)', zIndex:11 }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'#10b981', border:'3px solid #fff', boxShadow:'0 2px 12px rgba(16,185,129,.7)' }} />
                          </div>
                        )}
                        <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:11, fontWeight:700, borderRadius:6, padding:'3px 9px', zIndex:5, backdropFilter:'blur(6px)' }}>
                          {cellHotspots.length}/{MAX_HOTSPOTS} etiquetas
                        </div>
                        {pendingProduct && (
                          <div style={{ position:'absolute', inset:0, background:'rgba(217,70,239,0.08)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4 }}>
                            <div style={{ background:'rgba(255,255,255,0.92)', borderRadius:12, padding:'10px 20px', fontSize:12, fontWeight:600, color:'#d946ef', boxShadow:'0 4px 20px rgba(0,0,0,.15)' }}>
                              Haz clic para posicionar "{pendingProduct.NAME.slice(0, 22)}"
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <ImageIcon style={{ width:36, height:36, color:'#d1d5db' }} />
                        <span style={{ fontSize:13, color:'#9ca3af', fontWeight:600 }}>Clic para agregar imagen del look</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Panel de edición de la imagen (toggle) ── */}
            {selectedCell === 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">🖼 Imagen del Look</p>
                  <button onClick={() => setSelectedCell(null)} className="p-1 rounded-lg hover:bg-gray-200 text-gray-400"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)}
                  placeholder="https://..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                  className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-fuchsia-400 hover:bg-fuchsia-50 rounded-xl text-xs font-medium text-gray-500 hover:text-fuchsia-600 transition disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Subiendo...' : 'Subir desde PC'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Título (opcional)</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      placeholder="Ej: Look Verano" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Link (opcional)</label>
                    <input value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)}
                      placeholder="/productos/..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={savePanel} disabled={!editImageUrl || isSaving}
                    className="flex-1 py-2 bg-fuchsia-600 text-white text-xs font-bold rounded-xl hover:bg-fuchsia-700 transition disabled:opacity-50">
                    {isSaving ? 'Guardando...' : selectedPanel ? 'Actualizar imagen' : 'Guardar imagen'}
                  </button>
                  {selectedPanel && (
                    <button onClick={() => deletePanel(selectedPanel.$id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Hotspots activos ── */}
            {hotspots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Etiquetas activas ({hotspots.length}/{MAX_HOTSPOTS})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {hotspots.map(h => {
                    const prod = products.find(p => p.$id === h.PRODUCTID);
                    return (
                      <div key={h.$id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                        <div className="relative w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {prod?.IMAGEURL && <Image src={prod.IMAGEURL} alt={prod.NAME} fill style={{ objectFit:'cover' }} unoptimized />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{prod?.NAME || 'Producto'}</p>
                          <p className="text-[10px] text-gray-400">
                            pos {Math.round(h.POSITIONX * 100)}%, {Math.round(h.POSITIONY * 100)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleHotspot(h)} title={h.ISACTIVE ? 'Ocultar' : 'Mostrar'} className={`p-1.5 rounded-lg transition ${h.ISACTIVE ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}>
                            {h.ISACTIVE ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => removeHotspot(h.$id)} title="Eliminar" className="p-1.5 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Agregar producto ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Agregar producto etiquetado
                </p>
                {hotspots.length >= MAX_HOTSPOTS && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Límite {MAX_HOTSPOTS}/4</span>
                )}
              </div>
              {pendingProduct && (
                <div className={`rounded-xl px-4 py-3 text-xs font-medium ${pendingPos ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700'}`}>
                  {!pendingPos ? (
                    <span>Seleccionado: <strong>{pendingProduct.NAME.slice(0, 30)}</strong> — Haz clic en la imagen para posicionarlo</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>Posición lista. ¿Confirmar?</span>
                      <button onClick={confirmHotspot} disabled={isSaving} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">{isSaving ? '...' : 'Confirmar'}</button>
                      <button onClick={() => setPendingPos(null)} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs">Rehacer</button>
                      <button onClick={() => { setPendingProduct(null); setPendingPos(null); }} className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs">Cancelar</button>
                    </div>
                  )}
                </div>
              )}
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                disabled={hotspots.length >= MAX_HOTSPOTS}
                placeholder={hotspots.length >= MAX_HOTSPOTS ? 'Límite de 4 etiquetas alcanzado' : 'Buscar producto...'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed" />
              <div className={`grid grid-cols-4 sm:grid-cols-6 gap-2 ${hotspots.length >= MAX_HOTSPOTS ? 'pointer-events-none opacity-40' : ''}`}>
                {filteredProducts.map(p => (
                  <button key={p.$id} onClick={() => { setPendingProduct(p); setPendingPos(null); setSelectedCell(0); }}
                    className={`flex flex-col rounded-2xl border text-left transition overflow-hidden ${pendingProduct?.$id === p.$id ? 'bg-fuchsia-50 border-fuchsia-400 shadow-md ring-2 ring-fuchsia-300' : 'bg-white border-gray-100 hover:border-fuchsia-200 hover:shadow-sm'}`}>
                    <div className="relative w-full aspect-square bg-gray-100 flex-shrink-0 overflow-hidden">
                      {p.IMAGEURL
                        ? <Image src={p.IMAGEURL} alt={p.NAME} fill style={{ objectFit:'cover' }} unoptimized />
                        : <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-2xl">📦</div>}
                      {pendingProduct?.$id === p.$id && (
                        <div className="absolute inset-0 bg-fuchsia-600/20 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-fuchsia-600 flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.NAME}</p>
                      <p className="text-xs font-bold text-fuchsia-600 mt-0.5">${(p.CURRENTPRICE || p.PRICE || 0).toLocaleString('es-CL')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
