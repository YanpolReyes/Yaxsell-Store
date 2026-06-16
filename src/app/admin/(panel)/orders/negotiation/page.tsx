'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Order } from '@/types/admin';
import { Search, RefreshCw, AlertTriangle, Play, ClipboardList, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function NegotiationOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderInput, setOrderInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sendingIaId, setSendingIaId] = useState<string | null>(null);

  const handleSendToIa = async (orderId: string) => {
    setSendingIaId(orderId);
    try {
      const res = await fetch(`/api/cron/negotiation?secret=negotiation_secret_key_2026&orderId=${orderId}`);
      const data = await res.json();
      if (res.ok) {
        alert('Negociación iniciada con éxito. Mensaje enviado al cliente.');
        loadNegotiationOrders();
      } else {
        alert('Error al negociar: ' + (data.error || 'Ocurrió un error'));
      }
    } catch (e: any) {
      alert('Error de red al negociar: ' + e.message);
    } finally {
      setSendingIaId(null);
    }
  };

  const loadNegotiationOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, ORDERS_COLLECTION_ID, [
        Query.equal('STATUS', 'negotiation'),
        Query.orderDesc('CREATEDAT'),
        Query.limit(100)
      ]);
      setOrders(res.documents as unknown as Order[]);
    } catch (e: any) {
      setError('Error al cargar pedidos en negociación: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNegotiationOrders();
  }, [loadNegotiationOrders]);

  const standardizeCode = (input: string) => {
    const cleaned = input.trim().replace(/^#/, '').toUpperCase();
    if (cleaned.startsWith('ORD-')) return cleaned;
    if (/^\d+$/.test(cleaned)) {
      return `ORD-${cleaned.padStart(5, '0')}`;
    }
    return cleaned;
  };

  const handleAddOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    const parts = orderInput.split(/[\s,;\n]+/).map(p => p.trim()).filter(Boolean);
    const codesToSearch = Array.from(new Set(parts.map(standardizeCode)));

    if (codesToSearch.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      let addedCount = 0;
      let notFound: string[] = [];

      for (const code of codesToSearch) {
        // Find order by ORDERCODE
        const res = await databases.listDocuments(databaseId, ORDERS_COLLECTION_ID, [
          Query.equal('ORDERCODE', code),
          Query.limit(1)
        ]);

        if (res.documents && res.documents.length > 0) {
          const doc = res.documents[0];
          if (doc.STATUS !== 'negotiation') {
            await databases.updateDocument(databaseId, ORDERS_COLLECTION_ID, doc.$id, {
              STATUS: 'negotiation',
              UPDATEDAT: Date.now()
            });
          }
          addedCount++;
        } else {
          notFound.push(code);
        }
      }

      setSuccessMsg(`Se procesaron con éxito los pedidos. ${addedCount} pedidos están ahora en negociación.`);
      if (notFound.length > 0) {
        setError(`No se encontraron los siguientes códigos de pedido: ${notFound.join(', ')}`);
      }
      setOrderInput('');
      loadNegotiationOrders();
    } catch (e: any) {
      setError('Error al procesar pedidos: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Negociación de Pedidos</h1>
        <p className="text-sm text-gray-500">Administra pedidos con faltantes de productos y coordina con los clientes.</p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Agregar Pedidos a Negociación</h2>
          <p className="text-xs text-gray-400">Ingresa los números de pedido separados por comas o saltos de línea (ej: 9, 91, 13, ORD-00001).</p>
        </div>

        <form onSubmit={handleAddOrders} className="space-y-3">
          <textarea
            value={orderInput}
            onChange={e => setOrderInput(e.target.value)}
            placeholder="Ej: 9, 91, 13, 1"
            rows={3}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !orderInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-xl text-sm font-semibold hover:bg-pink-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                'Establecer en Negociación'
              )}
            </button>
          </div>
        </form>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800">Pedidos Actualmente en Negociación ({orders.length})</h3>
          <button
            onClick={loadNegotiationOrders}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition disabled:opacity-50"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3 animate-pulse">
                <div className="flex justify-between"><div className="h-4.5 w-24 bg-gray-100 rounded" /><div className="h-4.5 w-16 bg-gray-100 rounded" /></div>
                <div className="h-4 w-40 bg-gray-100 rounded" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm space-y-1">
              <ClipboardList className="w-8 h-8 mx-auto text-gray-300 mb-1" />
              <p className="font-medium">No hay pedidos en negociación</p>
              <p className="text-xs text-gray-400">Usa el formulario superior para añadir pedidos.</p>
            </div>
          ) : (
            orders.map(order => {
              const date = order.CREATEDAT ? new Date(order.CREATEDAT) : new Date(order.$createdAt);
              let itemsCount = 0;
              let hasMissing = false;
              try {
                const parsed = JSON.parse(order.ITEMS || '[]');
                itemsCount = parsed.length;
                hasMissing = parsed.some((it: any) => it.missing === true);
              } catch {}

              return (
                <div key={order.$id} className="p-5 flex justify-between items-center hover:bg-gray-50/50 transition flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">#{order.ORDERCODE}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
                        Negociación
                      </span>
                      {hasMissing && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          ⚠️ Faltantes Seleccionados
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Cliente:</strong> {order.CUSTOMERNAME} | <strong>Total:</strong> {fmt(order.TOTAL)}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Fecha: {date.toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })} | {itemsCount} productos
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasMissing && (
                      <button
                        onClick={() => handleSendToIa(order.$id)}
                        disabled={sendingIaId !== null}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition disabled:opacity-50"
                      >
                        {sendingIaId === order.$id ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <span>Negociar con IA</span>
                            <span className="text-[10px]">🤖</span>
                          </>
                        )}
                      </button>
                    )}
                    <Link
                      href={`/admin/orders/${order.$id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                    >
                      Abrir Pedido
                      <Play className="w-3 h-3 fill-white stroke-none" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
