'use client';

import { useEffect, useState } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, STOCK_REQUESTS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { RefreshCw, CheckCircle, Package, AlertTriangle } from 'lucide-react';

interface StockRequest {
  $id: string;
  productId: string;
  productName: string;
  userId: string;
  userEmail: string;
  requestedQuantity: number;
  status: 'pending' | 'fulfilled';
  $createdAt: string;
}

export default function StockRequestsPage() {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, STOCK_REQUESTS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]);
      setRequests(res.documents as unknown as StockRequest[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkFulfilled = async (req: StockRequest) => {
    if (!confirm(`¿Marcar la solicitud de ${req.productName} como agregada al stock? Se notificará al cliente.`)) return;
    setProcessingId(req.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // 1. Notify user
      await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
        userId: req.userId,
        title: '✅ ¡Stock añadido!',
        message: `Buenas noticias, hemos añadido el stock que solicitaste para "${req.productName}". ¡Ya puedes realizar tu compra!`,
        type: 'success',
        isRead: false,
      });

      // 2. Update request status
      await databases.updateDocument(databaseId, STOCK_REQUESTS_COLLECTION_ID, req.$id, {
        status: 'fulfilled'
      });

      setRequests(prev => prev.map(r => r.$id === req.$id ? { ...r, status: 'fulfilled' } : r));
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return (
    <div className="admin-main-content flex justify-center items-center h-[60vh]">
      <RefreshCw size={32} className="animate-spin text-pink-500" />
    </div>
  );

  if (error) return (
    <div className="admin-main-content p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-500" />
        <span className="text-red-800 text-sm">{error}</span>
      </div>
    </div>
  );

  return (
    <div className="admin-main-content p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Solicitudes de Stock</h1>
          <p className="text-gray-500 mt-1">Gestiona las peticiones de los clientes para añadir productos al stock.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Package size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No hay solicitudes</h3>
            <p className="text-gray-500 text-sm max-w-sm">No se encontraron solicitudes de stock por el momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-900 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-5">Producto</th>
                  <th className="py-4 px-5">Cliente</th>
                  <th className="py-4 px-5">Cantidad</th>
                  <th className="py-4 px-5">Fecha</th>
                  <th className="py-4 px-5">Estado</th>
                  <th className="py-4 px-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req.$id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-900">{req.productName}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{req.productId}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-medium text-gray-900">{req.userEmail}</div>
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-900">{req.requestedQuantity}</td>
                    <td className="py-4 px-5 text-gray-500 whitespace-nowrap">
                      {new Date(req.$createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5">
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          Completado
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleMarkFulfilled(req)}
                          disabled={processingId === req.$id}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all
                            bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700
                            border border-pink-200 shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === req.$id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Completar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
