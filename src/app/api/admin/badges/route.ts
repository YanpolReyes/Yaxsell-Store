import { NextResponse } from 'next/server';
import { serverListDocuments } from '@/lib/appwrite-server';
import {
  ORDERS_COLLECTION_ID,
  NOTIFICATIONS_COLLECTION_ID,
  WHOLESALE_REQUESTS_COLLECTION_ID,
  STOCK_ALERTS_COLLECTION_ID,
  STOCK_REQUESTS_COLLECTION_ID,
} from '@/lib/appwrite-admin';

export async function GET() {
  try {
    const qPendingOrders = JSON.stringify({ method: 'equal', attribute: 'STATUS', values: ['pending'] });
    const qProcessingOrders = JSON.stringify({ method: 'equal', attribute: 'STATUS', values: ['processing'] });
    const qLimit1 = JSON.stringify({ method: 'limit', values: [1] });
    const qUnreadNotifs = JSON.stringify({ method: 'equal', attribute: 'isRead', values: [false] });
    const qPendingWholesale = JSON.stringify({ method: 'equal', attribute: 'status', values: ['pending'] });
    
    // We try to query with STATUS first, and if that fails, we can query without filters or fallback to status
    let requestsTotal = 0;
    try {
      const qPendingRequests = JSON.stringify({ method: 'equal', attribute: 'status', values: ['pending'] });
      const reqs = await serverListDocuments(STOCK_REQUESTS_COLLECTION_ID, [qPendingRequests, JSON.stringify({ method: 'limit', values: [5000] })]);
      const uniqueUsersReq = new Set(reqs.documents.map((d: any) => d.userId || d.email || d.$id).filter(Boolean));
      requestsTotal = uniqueUsersReq.size;
    } catch (err) {
      console.error('Error fetching stock requests badges:', err);
    }

    let alertsTotal = 0;
    try {
      const qPendingAlerts = JSON.stringify({ method: 'equal', attribute: 'status', values: ['pending'] });
      const alts = await serverListDocuments(STOCK_ALERTS_COLLECTION_ID, [qPendingAlerts, JSON.stringify({ method: 'limit', values: [5000] })]);
      const uniqueUsersAlt = new Set(alts.documents.map((d: any) => d.userId || d.email || d.$id).filter(Boolean));
      alertsTotal = uniqueUsersAlt.size;
    } catch (err) {
      console.error('Error fetching stock alerts badges:', err);
    }

    const [ordersPending, ordersProcessing, notifs, wholesale] = await Promise.all([
      serverListDocuments(ORDERS_COLLECTION_ID, [qPendingOrders, qLimit1]),
      serverListDocuments(ORDERS_COLLECTION_ID, [qProcessingOrders, qLimit1]),
      serverListDocuments(NOTIFICATIONS_COLLECTION_ID, [qUnreadNotifs, qLimit1]),
      serverListDocuments(WHOLESALE_REQUESTS_COLLECTION_ID, [qPendingWholesale, qLimit1]),
    ]);

    return NextResponse.json({
      pendingOrders: ordersPending.total,
      processingOrders: ordersProcessing.total,
      unreadNotifs: notifs.total,
      pendingWholesale: wholesale.total,
      pendingRequests: requestsTotal,
      pendingAlerts: alertsTotal,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
