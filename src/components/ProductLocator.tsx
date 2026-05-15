'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, MapPin, Package, Camera, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

interface Product {
  $id: string;
  NAME?: string;
  IMAGEURL?: string;
  STOCK?: number;
  FEATURES?: string;
  TAGS?: string;
  jumpseller_id?: string;
  [key: string]: any;
}

// 4 góndolas, cada una con 9 secciones = 36 secciones
const GONDOLAS = [
  { id: 'A', name: 'Góndola A', sections: [1,2,3,4,5,6,7,8,9], zone: 'Zona Norte' },
  { id: 'B', name: 'Góndola B', sections: [10,11,12,13,14,15,16,17,18], zone: 'Zona Norte' },
  { id: 'C', name: 'Góndola C', sections: [19,20,21,22,23,24,25,26,27], zone: 'Zona Sur' },
  { id: 'D', name: 'Góndola D', sections: [28,29,30,31,32,33,34,35,36], zone: 'Zona Sur' },
];

const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  'Zona Norte': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
  'Zona Sur': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500' },
};

const GONDOLA_COLORS: Record<string, string> = {
  A: 'from-blue-500 to-indigo-600',
  B: 'from-cyan-500 to-blue-600',
  C: 'from-pink-500 to-rose-600',
  D: 'from-orange-500 to-red-600',
};

function getSku(p: Product): string {
  const m = p.FEATURES?.match(/SKU:\s*(.+)/i);
  if (m) return m[1].trim();
  const tags = (p.TAGS || '').split(',').map(t => t.trim());
  const skuTag = tags.find(t => /^[A-Z0-9]{4,}$/i.test(t));
  return p.jumpseller_id || skuTag || '';
}

function getBarcode(p: Product): string {
  const m = p.FEATURES?.match(/Barcode:\s*(.+)/i);
  return m ? m[1].trim() : '';
}

function getSection(p: Product): number | null {
  const m = p.FEATURES?.match(/Section:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdate: (updater: (prev: Product[]) => Product[]) => void;
}

type Screen = 'menu' | 'search' | 'register' | 'select-section' | 'results';

export default function ProductLocator({ isOpen, onClose, products, onProductsUpdate }: Props) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ product: Product; section: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (isOpen) { setScreen('menu'); setQuery(''); setSearchResults([]); setSelectedProduct(null); setSavedSection(null); }
  }, [isOpen]);

  const handleSearchBySection = () => {
    setScreen('search');
    setQuery('');
    setSearchResults([]);
  };

  const handleRegister = () => {
    setScreen('register');
    setQuery('');
    setSelectedProduct(null);
  };

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase().trim();
    const results: { product: Product; section: number }[] = [];
    products.forEach(p => {
      const sec = getSection(p);
      if (sec === null) return;
      const sku = getSku(p).toLowerCase();
      const barcode = getBarcode(p).toLowerCase();
      const name = (p.NAME || '').toLowerCase();
      if (sku.includes(lower) || barcode.includes(lower) || name.includes(lower) || String(sec) === lower) {
        results.push({ product: p, section: sec });
      }
    });
    setSearchResults(results);
  }, [products]);

  const doRegisterSearch = useCallback((q: string) => {
    if (!q.trim()) { setSelectedProduct(null); return; }
    const lower = q.toLowerCase().trim();
    const found = products.find(p => {
      const sku = getSku(p).toLowerCase();
      const barcode = getBarcode(p).toLowerCase();
      const name = (p.NAME || '').toLowerCase();
      return sku === lower || barcode === lower || name.includes(lower);
    });
    setSelectedProduct(found || null);
  }, [products]);

  const saveSection = async (sectionNum: number) => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const features = selectedProduct.FEATURES || '';
      const existing = features.replace(/\nSection:\s*\d+/gi, '').replace(/^Section:\s*\d+\n?/gi, '');
      const newFeatures = existing ? `${existing}\nSection: ${sectionNum}` : `Section: ${sectionNum}`;
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, selectedProduct.$id, { FEATURES: newFeatures });
      onProductsUpdate(prev => prev.map(p => p.$id === selectedProduct.$id ? { ...p, FEATURES: newFeatures } : p));
      setSavedSection(sectionNum);
      setTimeout(() => { setScreen('menu'); setSavedSection(null); setSelectedProduct(null); }, 1500);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleScan = (code: string) => {
    setShowScanner(false);
    setQuery(code);
    if (screen === 'search') doSearch(code);
    else if (screen === 'register') doRegisterSearch(code);
  };

  if (!isOpen) return null;

  const getGondolaForSection = (sec: number) => GONDOLAS.find(g => g.sections.includes(sec));

  return (
    <>
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
        <div className="bg-white w-full max-h-[95vh] sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 flex items-center gap-3 shrink-0">
            {screen !== 'menu' && (
              <button onClick={() => screen === 'select-section' ? setScreen('register') : setScreen('menu')} className="p-1 hover:bg-white/20 rounded-lg transition">
                <ChevronLeft size={20} />
              </button>
            )}
            <MapPin size={22} />
            <div className="flex-1">
              <h2 className="font-bold text-base">Ubicar Producto</h2>
              <p className="text-xs text-white/70">
                {screen === 'menu' ? 'Sistema de góndolas' : screen === 'search' ? 'Buscar por sección' : screen === 'register' ? 'Registrar ubicación' : screen === 'select-section' ? 'Seleccionar sección' : 'Resultados'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* MENU */}
            {screen === 'menu' && (
              <div className="p-6 space-y-4">
                <button onClick={handleSearchBySection} className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-400 transition group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <Search size={24} className="text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 text-base">Buscar Sección</div>
                    <div className="text-xs text-gray-500 mt-0.5">Encuentra en qué góndola está un producto</div>
                  </div>
                </button>
                <button onClick={handleRegister} className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl hover:border-emerald-400 transition group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 text-base">Registrar Sección</div>
                    <div className="text-xs text-gray-500 mt-0.5">Escanea un producto y asigna su góndola</div>
                  </div>
                </button>

                {/* Mini gondola map */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mapa de Góndolas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {GONDOLAS.map(g => {
                      const colors = ZONE_COLORS[g.zone];
                      const prodCount = products.filter(p => { const s = getSection(p); return s !== null && g.sections.includes(s); }).length;
                      return (
                        <div key={g.id} className={`${colors.bg} ${colors.border} border rounded-xl p-3`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${GONDOLA_COLORS[g.id]} flex items-center justify-center text-white text-xs font-black`}>{g.id}</div>
                            <span className="text-xs font-bold text-gray-700">{g.name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {g.sections.map(s => {
                              const hasProducts = products.some(p => getSection(p) === s);
                              return (
                                <div key={s} className={`text-center py-1 rounded text-[10px] font-bold ${hasProducts ? `${colors.accent} text-white` : 'bg-white/70 text-gray-400'}`}>
                                  {s}
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1.5">{prodCount} productos · {g.zone}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SEARCH */}
            {screen === 'search' && (
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={query} onChange={e => { setQuery(e.target.value); doSearch(e.target.value); }}
                      placeholder="SKU, código de barras, nombre o # sección"
                      autoFocus className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={() => setShowScanner(true)} className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition">
                    <Camera size={20} />
                  </button>
                </div>
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(({ product, section }) => {
                      const gondola = getGondolaForSection(section);
                      return (
                        <div key={product.$id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          {product.IMAGEURL ? (
                            <img src={product.IMAGEURL} alt="" className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><Package size={18} className="text-gray-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">{product.NAME}</div>
                            <div className="text-[11px] text-gray-500 font-mono">SKU: {getSku(product)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${GONDOLA_COLORS[gondola?.id || 'A']} text-white text-xs font-bold`}>
                              <MapPin size={12} /> S{section}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{gondola?.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : query.trim() ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No se encontró el producto en ninguna sección</div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">Busca un producto o escribe un # de sección</div>
                )}
              </div>
            )}

            {/* REGISTER */}
            {screen === 'register' && !selectedProduct && (
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={query} onChange={e => { setQuery(e.target.value); doRegisterSearch(e.target.value); }}
                      placeholder="Escanea o busca por SKU / código de barras"
                      autoFocus className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <button onClick={() => setShowScanner(true)} className="p-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition">
                    <Camera size={20} />
                  </button>
                </div>
                <div className="text-center py-10 text-gray-400 text-sm">Escanea el código de barras del producto</div>
              </div>
            )}

            {/* REGISTER — Product found, confirm */}
            {screen === 'register' && selectedProduct && !savedSection && (
              <div className="p-5 flex flex-col items-center gap-4">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Producto encontrado</div>
                {selectedProduct.IMAGEURL ? (
                  <img src={selectedProduct.IMAGEURL} alt="" className="w-40 h-40 object-cover rounded-2xl shadow-lg border-4 border-white" />
                ) : (
                  <div className="w-40 h-40 bg-gray-100 rounded-2xl flex items-center justify-center"><Package size={40} className="text-gray-300" /></div>
                )}
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg">{selectedProduct.NAME}</div>
                  <div className="text-xs font-mono text-gray-500 mt-1">SKU: {getSku(selectedProduct)}</div>
                  {getSection(selectedProduct) && (
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      <MapPin size={12} /> Actualmente en Sección {getSection(selectedProduct)}
                    </div>
                  )}
                </div>
                <button onClick={() => setScreen('select-section')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition text-sm">
                  ¿Es este? Asignar sección →
                </button>
                <button onClick={() => { setSelectedProduct(null); setQuery(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition">No es este, buscar otro</button>
              </div>
            )}

            {/* SELECT SECTION — Interactive gondola grid */}
            {screen === 'select-section' && selectedProduct && (
              <div className="p-4">
                {savedSection ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                      <CheckCircle2 size={32} className="text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold text-emerald-700">¡Guardado!</div>
                    <div className="text-sm text-gray-500">Sección {savedSection} asignada</div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-sm font-bold text-gray-900 line-clamp-1">{selectedProduct.NAME}</div>
                      <div className="text-xs text-gray-500">Toca la sección donde pusiste este producto</div>
                    </div>
                    <div className="space-y-4">
                      {GONDOLAS.map(g => {
                        const colors = ZONE_COLORS[g.zone];
                        return (
                          <div key={g.id} className={`${colors.bg} ${colors.border} border rounded-2xl p-4`}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${GONDOLA_COLORS[g.id]} flex items-center justify-center text-white text-sm font-black shadow-md`}>{g.id}</div>
                              <div>
                                <div className="text-sm font-bold text-gray-800">{g.name}</div>
                                <div className="text-[10px] text-gray-500">{g.zone} · 3 mesas · 9 secciones</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {g.sections.map(s => (
                                <button key={s} onClick={() => saveSection(s)} disabled={saving}
                                  className={`relative py-4 rounded-xl text-center font-black text-lg border-2 transition-all active:scale-95 ${
                                    saving ? 'opacity-50 cursor-wait' : 'hover:scale-105 hover:shadow-md cursor-pointer'
                                  } bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 active:bg-indigo-100`}>
                                  {s}
                                  {products.some(p => p.$id !== selectedProduct.$id && getSection(p) === s) && (
                                    <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
