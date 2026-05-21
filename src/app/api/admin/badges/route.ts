import { NextResponse } from 'next/server';
import { serverListDocuments } from '@/lib/appwrite-server';
import { ORDERS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID, WHOLESALE_REQUESTS_COLLECTION_ID } from '@/lib/appwrite-admin';

export async function GET() {
  try {
    const [o, n, w] = await Promise.all([
      serverListDocuments(ORDERS_COLLECTION_ID, [
        JSON.stringify({ method: 'equal', attribute: 'STATUS', values: ['pending'] }),
        JSON.stringify({ method: 'limit', values: [1] }),
      ]),
      serverListDocuments(NOTIFICATIONS_COLLECTION_ID, [
        JSON.stringify({ method: 'equal', attribute: 'isRead', values: [false] }),
        JSON.stringify({ method: 'limit', values: [1] }),
      ]),
      serverListDocuments(WHOLESALE_REQUESTS_COLLECTION_ID, [
        JSON.stringify({ method: 'equal', attribute: 'status', values: ['pending'] }),
        JSON.stringify({ method: 'limit', values: [1] }),
      ]),
    ]);
    return NextResponse.json({
      success: true,
      pendingOrders: o.total,
      unreadNotifs: n.total,
      pendingWholesale: w.total,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
