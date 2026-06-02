import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query, ID } from 'node-appwrite';

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0a4e8d0032177f3f90';
const API_KEY = process.env.APPWRITE_API_KEY || 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0a58ca001798410d86';
const CART_SNAPSHOTS_COLLECTION = 'cart_snapshots';
const STOCK_ALERTS_COLLECTION = 'stock_alerts';
const NOTIFICATIONS_COLLECTION = 'notifications';

function getClient() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  return { databases: new Databases(client) };
}

export async function POST(req: NextRequest) {
  try {
    const { databases } = getClient();
    const body = await req.json();
    const { productId, productName, productImage, productPrice, singleUserId, singleQty, singleAlertId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    console.log('[auto-cart] Request body:', { productId, productName, productPrice, singleUserId, singleQty, singleAlertId });

    // Single-user mode: add to specific user's cart and delete specific alert
    if (singleUserId && singleAlertId) {
      const qty = singleQty || 1;
      try {
        // Add product to user's cart snapshot
        const existingSnap = await databases.listDocuments(DATABASE_ID, CART_SNAPSHOTS_COLLECTION, [
          Query.equal('userId', singleUserId),
          Query.limit(1),
        ]);

        let currentItems: { id: string; name: string; qty: number; price: number }[] = [];
        let snapDocId: string | null = null;

        if (existingSnap.documents.length > 0) {
          snapDocId = existingSnap.documents[0].$id;
          try {
            currentItems = JSON.parse((existingSnap.documents[0] as any).itemsJson || '[]');
          } catch { currentItems = []; }
        }

        const existingIdx = currentItems.findIndex(i => i.id === productId);
        if (existingIdx >= 0) {
          currentItems[existingIdx].qty = Math.min(currentItems[existingIdx].qty + qty, 999);
        } else {
          currentItems.push({ id: productId, name: productName || 'Producto', qty, price: productPrice || 0 });
        }

        const snapData = {
          userId: singleUserId,
          itemsJson: JSON.stringify(currentItems),
          updatedAt: Math.floor(Date.now() / 1000),
        };

        if (snapDocId) {
          await databases.updateDocument(DATABASE_ID, CART_SNAPSHOTS_COLLECTION, snapDocId, snapData);
        } else {
          await databases.createDocument(DATABASE_ID, CART_SNAPSHOTS_COLLECTION, ID.unique(), snapData);
        }

        // Update alert status to 'available' (product was found and notified)
        await databases.updateDocument(DATABASE_ID, STOCK_ALERTS_COLLECTION, singleAlertId, { status: 'available' });

        return NextResponse.json({ success: true, autoAdded: 1, notified: 0 });
      } catch (e: any) {
        console.error('Single-user auto-cart error:', e?.message || e);
        console.error('Full error:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
        return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
      }
    }

    // Batch mode: find all pending stock alerts for this product
    const alertsRes = await databases.listDocuments(DATABASE_ID, STOCK_ALERTS_COLLECTION, [
      Query.equal('productId', productId),
      Query.limit(500),
    ]);

    if (alertsRes.documents.length === 0) {
      return NextResponse.json({ message: 'No pending alerts for this product' });
    }

    let autoAdded = 0;
    let notified = 0;

    for (const alert of alertsRes.documents) {
      const userId = alert.userId as string;
      const qty = Number(alert.quantity ?? 1);

      try {
        // 1. Add product to user's cart snapshot
        const existingSnap = await databases.listDocuments(DATABASE_ID, CART_SNAPSHOTS_COLLECTION, [
          Query.equal('userId', userId),
          Query.limit(1),
        ]);

        let currentItems: { id: string; name: string; qty: number; price: number }[] = [];
        let snapDocId: string | null = null;

        if (existingSnap.documents.length > 0) {
          snapDocId = existingSnap.documents[0].$id;
          try {
            currentItems = JSON.parse((existingSnap.documents[0] as any).itemsJson || '[]');
          } catch { currentItems = []; }
        }

        // Check if product already in cart
        const existingIdx = currentItems.findIndex(i => i.id === productId);
        if (existingIdx >= 0) {
          currentItems[existingIdx].qty = Math.min(currentItems[existingIdx].qty + qty, 999);
        } else {
          currentItems.push({
            id: productId,
            name: productName || 'Producto',
            qty,
            price: productPrice || 0,
          });
        }

        const snapData = {
          userId,
          itemsJson: JSON.stringify(currentItems),
          updatedAt: Math.floor(Date.now() / 1000),
        };

        if (snapDocId) {
          await databases.updateDocument(DATABASE_ID, CART_SNAPSHOTS_COLLECTION, snapDocId, snapData);
        } else {
          await databases.createDocument(DATABASE_ID, CART_SNAPSHOTS_COLLECTION, ID.unique(), snapData);
        }

        autoAdded++;

        // 2. Create notification for the user
        await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION, ID.unique(), {
          userId,
          type: 'stock',
          title: '¡Producto agregado a tu carrito!',
          message: `"${productName || 'Producto'}" ya tiene stock y fue agregado automáticamente a tu carrito (x${qty}).`,
          isRead: false,
        });

        notified++;

        // 3. Update alert status to 'available' (product was found and notified)
        await databases.updateDocument(DATABASE_ID, STOCK_ALERTS_COLLECTION, alert.$id, { status: 'available' });

      } catch (userErr) {
        console.error(`Error processing alert for user ${userId}:`, userErr);
      }
    }

    return NextResponse.json({
      success: true,
      autoAdded,
      notified,
      totalAlerts: alertsRes.documents.length,
    });
  } catch (e: any) {
    console.error('auto-cart error:', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
