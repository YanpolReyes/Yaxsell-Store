'use client';

import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Sparkles, AlertTriangle, CheckCircle2, ArrowLeft, Loader, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface ProductData {
  $id: string;
  NAME: string;
  SKU: string;
  STOCK: number;
  PRICE: number;
  IMAGEURL: string;
  GROUPID?: string;
  $createdAt: string;
}

export default function VinculacionPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // Fetch products that are active and have stock
      const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
        Query.equal('ISACTIVE', true),
        Query.orderDesc('$createdAt'),
        Query.limit(1000), // Get a large chunk to group effectively
      ]);

      const data = res.documents.map((doc: any) => {
        let sku = doc.SKU || '';
        if (!sku) {
          if (doc.jumpseller_id) {
            sku = String(doc.jumpseller_id);
          } else if (doc.FEATURES) {
            const featMatch = doc.FEATURES.match(/SKU:\s*([^\s,]+)/i);
            if (featMatch) sku = featMatch[1].trim();
          }
        }

        return {
          $id: doc.$id,
          NAME: doc.NAME,
          SKU: sku,
          STOCK: doc.STOCK || 0,
          PRICE: doc.PRICE || 0,
          IMAGEURL: doc.IMAGEURL || '',
          GROUPID: doc.GROUPID,
          $createdAt: doc.$createdAt,
        };
      }) as ProductData[];
      
      // We only want products with stock > 0 as requested
      const inStockData = data.filter(p => p.STOCK > 0);
      setProducts(inStockData);
    } catch (e: any) {
      setErrorMsg('Error al cargar productos: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectGroup = (groupIds: string[]) => {
    const newSet = new Set(selectedIds);
    let allSelected = true;
    groupIds.forEach(id => { if (!newSet.has(id)) allSelected = false; });
    
    if (allSelected) {
      // Deselect all
      groupIds.forEach(id => newSet.delete(id));
    } else {
      // Select all
      groupIds.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const handleLinkSelected = async () => {
    if (selectedIds.size < 2) {
      alert('Debes seleccionar al menos 2 productos para vincularlos.');
      return;
    }

    if (!confirm(`¿Estás seguro de vincular estos ${selectedIds.size} productos como variaciones del mismo modelo?`)) {
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // Generate a common GROUPID based on the first selected item's ID or a new timestamp
      const newGroupId = `grp_${Date.now()}_${Array.from(selectedIds)[0].slice(-5)}`;
      let successCount = 0;

      for (const id of Array.from(selectedIds)) {
        await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, id, {
          GROUPID: newGroupId
        });
        successCount++;
        // Add a small delay to prevent rate limits
        await new Promise(r => setTimeout(r, 100));
      }

      setSuccessMsg(`¡${successCount} productos vinculados exitosamente! Su GROUPID es ${newGroupId}`);
      setSelectedIds(new Set());
      // Refresh list to show updated GROUPIDs
      await fetchProducts();
    } catch (e: any) {
      setErrorMsg('Error al vincular: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUnlink = async (id: string) => {
    if (!confirm('¿Desvincular este producto de su grupo?')) return;
    
    setIsProcessing(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, id, {
        GROUPID: null
      });
      setSuccessMsg(`Producto desvinculado exitosamente.`);
      await fetchProducts();
    } catch (e: any) {
      setErrorMsg('Error al desvincular: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Grouping logic: Group by exact NAME first, then sort by newest product in group
  // Only apply search filter before grouping
  const filteredProducts = products.filter(p => 
    p.NAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.SKU.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.GROUPID && p.GROUPID.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedMap = new Map<string, ProductData[]>();
  filteredProducts.forEach(p => {
    const key = p.NAME.trim().toUpperCase();
    if (!groupedMap.has(key)) groupedMap.set(key, []);
    groupedMap.get(key)!.push(p);
  });

  // Sort groups by the newest product in each group (descending order)
  const sortedGroupKeys = Array.from(groupedMap.keys()).sort((a, b) => {
    const groupA = groupedMap.get(a)!;
    const groupB = groupedMap.get(b)!;
    
    const maxDateA = Math.max(...groupA.map(p => new Date(p.$createdAt).getTime()));
    const maxDateB = Math.max(...groupB.map(p => new Date(p.$createdAt).getTime()));
    
    return maxDateB - maxDateA;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={18} />
          Volver a Productos
        </Link>
        
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/vinculados"
            className="inline-flex items-center gap-2 px-4 py-3 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <LinkIcon size={18} />
            Ver Grupos Vinculados
          </Link>
          <button
            onClick={handleLinkSelected}
            disabled={selectedIds.size < 2 || isProcessing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isProcessing ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <LinkIcon size={20} />
            )}
            Vincular Seleccionados ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vinculación de Productos</h1>
          <p className="text-gray-600">
            Agrupa productos que son variaciones del mismo modelo (distinto color o diseño). Los productos vinculados se mostrarán juntos en la página de detalles del producto (Plantilla 5) como opciones seleccionables.
          </p>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o Group ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Éxito</p>
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader size={40} className="animate-spin mb-4 text-indigo-500" />
            <p>Cargando catálogo...</p>
          </div>
        ) : sortedGroupKeys.length === 0 ? (
          <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            No se encontraron productos con stock activo.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroupKeys.map((groupName, idx) => {
              const groupProducts = groupedMap.get(groupName)!;
              const allSelected = groupProducts.every(p => selectedIds.has(p.$id));
              
              return (
                <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  {/* Group Header */}
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={allSelected}
                        onChange={() => selectGroup(groupProducts.map(p => p.$id))}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        title="Seleccionar todo el grupo"
                      />
                      <h3 className="font-semibold text-gray-800">{groupName} <span className="text-gray-500 font-normal text-sm ml-2">({groupProducts.length} variantes)</span></h3>
                    </div>
                  </div>
                  
                  {/* Group Items */}
                  <div className="divide-y divide-gray-200">
                    {groupProducts.map(product => (
                      <div 
                        key={product.$id} 
                        className={`flex items-center gap-4 p-4 hover:bg-indigo-50/50 transition-colors cursor-pointer ${selectedIds.has(product.$id) ? 'bg-indigo-50' : 'bg-white'}`}
                        onClick={() => toggleSelect(product.$id)}
                      >
                        <div className="flex-shrink-0">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(product.$id)}
                            onChange={() => {}} // handled by parent div onClick
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            onClick={(e) => e.stopPropagation()} // Prevent double toggle
                          />
                        </div>
                        
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 z-10 relative">
                          {product.IMAGEURL ? (
                            <a href={product.IMAGEURL} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-full h-full block" title="Ver imagen completa">
                              <img src={product.IMAGEURL} alt={product.NAME} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                            </a>
                          ) : (
                            <ImageIcon size={20} className="text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-grow min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-900 truncate" title={product.NAME}>{product.NAME}</p>
                            <p className="text-xs text-gray-500 mt-1 font-mono">{product.SKU || 'Sin SKU'}</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">${product.PRICE.toLocaleString()}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span>Stock: <span className={product.STOCK > 5 ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>{product.STOCK}</span></span>
                          </div>
                          <div>
                            {product.GROUPID ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200" title={`Vinculado en grupo: ${product.GROUPID}`}>
                                  <LinkIcon size={10} />
                                  Vinculado
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUnlink(product.$id); }}
                                  className="text-xs text-red-500 hover:text-red-700 underline"
                                >
                                  Desvincular
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                Sin vincular
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
