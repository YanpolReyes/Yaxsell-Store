import { NextResponse } from 'next/server';
import { serverListDocuments } from '@/lib/appwrite-server';
import {
  ORDERS_COLLECTION_ID,
  NOTIFICATIONS_COLLECTION_ID,
  WHOLESALE_REQUESTS_COLLECTION_ID,
  STOCK_ALERTS_COLLECTION_ID,
} from '@/lib/appwrite-admin';

export async function GET() {
  try {
    const qPendingOrders = JSON.stringify({ method: 'equal', attribute: 'STATUS', values: ['pending'] });
    const qLimit1 = JSON.stringify({ method: 'limit', values: [1] });
    const qUnreadNotifs = JSON.stringify({ method: 'equal', attribute: 'isRead', values: [false] });
    const qPendingWholesale = JSON.stringify({ method: 'equal', attribute: 'status', values: ['pending'] });
    
    // We try to query with STATUS first, and if that fails, we can query without filters or fallback to status
    let requestsTotal = 0;
    try {
      const qPendingRequests = JSON.stringify({ method: 'equal', attribute: 'STATUS', values: ['pending'] });
      const reqs = await serverListDocuments(STOCK_ALERTS_COLLECTION_ID, [qPendingRequests, qLimit1]);
      requestsTotal = reqs.total;
    } catch {
      try {
        const qPendingRequestsLower = JSON.stringify({ method: 'equal', attribute: 'status', values: ['pending'] });
        const reqs = await serverListDocuments(STOCK_ALERTS_COLLECTION_ID, [qPendingRequestsLower, qLimit1]);
        requestsTotal = reqs.total;
      } catch (err) {
        console.error('Error fetching stock alerts badges:', err);
      }
    }

    const [orders, notifs, wholesale] = await Promise.all([
      serverListDocuments(ORDERS_COLLECTION_ID, [qPendingOrders, qLimit1]),
      serverListDocuments(NOTIFICATIONS_COLLECTION_ID, [qUnreadNotifs, qLimit1]),
      serverListDocuments(WHOLESALE_REQUESTS_COLLECTION_ID, [qPendingWholesale, qLimit1]),
    ]);

    return NextResponse.json({
      pendingOrders: orders.total,
      unreadNotifs: notifs.total,
      pendingWholesale: wholesale.total,
      pendingRequests: requestsTotal,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
