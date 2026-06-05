'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, TIMED_OFFERS_COLLECTION_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { TimedOffer, Product } from '@/types/admin';
import { Save, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function DestacadoTemporalPage() {
  const [config, setConfig] = useState<Partial<TimedOffer>>({
    title: 'Producto Destacado',
    offerType: 'destacado_temporal',
    targetId: '',
    productName: '',
    timeType: 'endDateTime',
    endDateTime: '',
    status: 'active',
    isActive: false,
  });
  const [docId, setDocId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const [or, pr] = await Promise.all([
        databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION_ID, [
          Query.equal('offerType', 'destacado_temporal'),
          Query.limit(1)
        ]),
        databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
          Query.greaterThan('STOCK', 0),
          Query.orderAsc('NAME'),
          Query.limit(500)
        ]),
      ]);
      setProducts(pr.documents as unknown as Product[]);
      if (or.documents.length > 0) {
        const doc = or.documents[0] as unknown as TimedOffer;
        setDocId(doc.$id);
        setConfig({
          title: doc.title,
          offerType: doc.offerType,
          targetId: doc.targetId,
          productName: doc.productName,
          timeType: doc.timeType,
          endDateTime: doc.endDateTime,
          status: doc.status,
          isActive: doc.isActive,
        });
      }
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!config.targetId) { alert('Selecciona un producto'); return; }
    if (!config.endDateTime) { alert('La fecha de fin es requerida'); return; }
    setIsSaving(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const product = products.find(p => p.$id === config.targetId);
      
      const payload: any = {
        title: config.title || 'Producto Destacado',
        offerType: 'destacado_temporal',
        targetId: config.targetId,
        productName: config.productName || product?.NAME || '',
        originalPrice: product?.PRICE || 0,
        discountPrice: product?.PRICE || 0, // Not used here
        discountPercentage: 0,
        customImagePath: '',
        timeType: 'endDateTime',
        endDateTime: new Date(config.endDateTime!).toISOString(),
        status: config.isActive ? 'active' : 'draft',
        isActive: config.isActive ?? false,
      };

      if (!docId) {
        // Create new
        const doc = await databases.createDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, ID.unique(), payload);
        setDocId(doc.$id);
      } else {
        // Update (Delete + Recreate to bypass Appwrite internal issues on updates as done in timed-offers)
        await databases.deleteDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, docId);
        const doc = await databases.createDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, docId, payload);
        setDocId(doc.$id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError('Error al guardar: ' + e.message); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Destacado Temporal</h1>
        <p className="text-sm text-gray-500 mt-1">Configura el producto que aparecerá destacado en la página de inicio (Plantilla 23) con un cronómetro de cuenta regresiva.</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Configuración del Cronómetro</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Activar Destacado Temporal</p>
              <p className="text-xs text-gray-500 mt-0.5">Si está inactivo, la tienda mostrará un producto aleatorio sin cronómetro.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.isActive} onChange={e => setConfig({ ...config, isActive: e.target.checked })} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Producto a destacar</label>
              <select 
                value={config.targetId || ''} 
                onChange={e => {
                  const product = products.find(p => p.$id === e.target.value);
                  setConfig({ 
                    ...config, 
                    targetId: e.target.value,
                    productName: product?.NAME || ''
                  });
                }}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              >
                <option value="">Seleccionar un producto...</option>
                {products.map(p => <option key={p.$id} value={p.$id}>{p.NAME}</option>)}
              </select>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora de término</label>
              <input 
                type="datetime-local" 
                value={config.endDateTime ? config.endDateTime.slice(0, 16) : ''}
                onChange={e => setConfig({ ...config, endDateTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={save} 
              disabled={isSaving} 
              className={`px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-70`}
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
              ) : saved ? (
                <><CheckCircle className="w-4 h-4" /> Guardado exitosamente</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Configuración</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
