'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/components/Toast';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { useAuth } from '@/hooks/useAuth';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, qty?: number, timedOfferPrice?: number, timedOfferExpiresAt?: number, wholesalePrice?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  catalogSubtotal: number;
  aperturaSavings: number;
}

// Legacy per-item collection (kept for admin backward compat on read)
const CART_ITEMS_COLLECTION = 'cart_items';
// New: single-document snapshot per user for admin visibility
const CART_SNAPSHOTS_COLLECTION = 'cart_snapshots';

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { showToast } = useToast();
  const { settings: apertura } = useAperturaPromotion();
  const { user, isLoggedIn } = useAuth();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotDocIdRef = useRef<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yaxsel_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Find existing snapshot doc ID on login & merge auto-added items
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        try {
          const res = await databases.listDocuments(databaseId, CART_SNAPSHOTS_COLLECTION, [
            Query.equal('userId', user.id), Query.limit(1),
          ]);
          if (res.documents.length > 0) {
            snapshotDocIdRef.current = res.documents[0].$id;
            try {
              const snapItems: { id: string; name: string; qty: number; price: number }[] = JSON.parse((res.documents[0] as any).itemsJson || '[]');
              if (snapItems.length > 0) {
                const stored = localStorage.getItem('yaxsel_cart');
                let localItems: CartItem[] = [];
                try { localItems = stored ? JSON.parse(stored) : []; } catch {}
                // Merge: add snapshot items not already in local cart
                const localIds = new Set(localItems.map(i => i.product.$id));
                const newFromSnap = snapItems.filter(si => !localIds.has(si.id));
                if (newFromSnap.length > 0) {
                  // Fetch product data for auto-added items
                  try {
                    const { databases: db2 } = getServices();
                    const prodRes = await db2.listDocuments(databaseId, 'products', [
                      Query.equal('$id', newFromSnap.map(si => si.id)),
                      Query.limit(100),
                    ]);
                    const prodMap = new Map(prodRes.documents.map((p: any) => [p.$id, p as unknown as Product]));
                    const newCartItems: CartItem[] = newFromSnap.map(si => {
                      const prod = prodMap.get(si.id);
                      if (prod) return { product: prod, quantity: si.qty };
                      // Fallback: construct minimal product from snapshot data
                      return {
                        product: { $id: si.id, NAME: si.name, PRICE: si.price, STOCK: si.qty, CATEGORYID: '', DESCRIPTION: '', IMAGEURL: '', IMAGEURL2: '', IMAGEURL3: '', COST: 0, WHOLESALEPRICE: 0, WHOLESALEMINQUANTITY: 0, PACKQTY: 0, SOLDQUANTITY: 0 } as unknown as Product,
                        quantity: si.qty,
                      };
                    }).filter(Boolean);
                    if (newCartItems.length > 0) {
                      setItems(prev => [...prev, ...newCartItems]);
                    }
                  } catch {}
                }
              }
            } catch {}
          }
        } catch (e: any) {
          if (e.code !== 404) {
            console.warn('Error reading cart_snapshots:', e);
          }
        }
      } catch {}
    })();
  }, [isLoggedIn, user?.id]);

  // Save to localStorage + debounced snapshot to Appwrite (admin-only, no lag for client)
  useEffect(() => {
    localStorage.setItem('yaxsel_cart', JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yaxsel:cart-updated'));
    }
    // Debounced snapshot sync — long debounce, single write, no per-item operations
    if (!isLoggedIn || !user) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        // Lightweight snapshot: just productId + qty per item
        const snapshot = items.map(i => ({
          id: i.product.$id,
          name: i.product.NAME,
          qty: i.quantity,
          price: i.product.PRICE,
        }));
        const data = {
          userId: user.id,
          itemsJson: JSON.stringify(snapshot),
          itemCount: items.reduce((s, i) => s + i.quantity, 0),
          updatedAt: Math.floor(Date.now() / 1000),
        };
        if (snapshotDocIdRef.current) {
          await databases.updateDocument(databaseId, CART_SNAPSHOTS_COLLECTION, snapshotDocIdRef.current, data);
        } else {
          const doc = await databases.createDocument(databaseId, CART_SNAPSHOTS_COLLECTION, ID.unique(), data);
          snapshotDocIdRef.current = doc.$id;
        }
      } catch {}
    }, 10000); // 10s debounce — no rush, admin just needs to see it eventually
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [items, isLoggedIn, user?.id]);

  const getEffectivePrice = (item: CartItem): number => {
    const now = Date.now();
    if (item.timedOfferPrice && item.timedOfferExpiresAt && now < item.timedOfferExpiresAt) {
      return item.timedOfferPrice;
    }
    if (item.wholesalePrice) {
      return item.wholesalePrice;
    }
    return resolveProductDisplayPrice(item.product, apertura).displayPrice;
  };

  const addItem = (product: Product, qty = 1, timedOfferPrice?: number, timedOfferExpiresAt?: number, wholesalePrice?: number) => {
    const existing = items.find(i => i.product.$id === product.$id);
    
    if (existing) {
      const newQty = Math.min(existing.quantity + qty, product.STOCK);
      setItems(prev => prev.map(i => i.product.$id === product.$id ? { ...i, quantity: newQty, wholesalePrice } : i));
      showToast(`Cantidad actualizada: ${newQty} unidades`, 'info');
    } else {
      setItems(prev => [...prev, { product, quantity: qty, timedOfferPrice, timedOfferExpiresAt, wholesalePrice }]);
      showToast(`✓ Agregado al carrito`, 'success');
    }
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.$id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => {
      if (i.product.$id !== productId) return i;
      return { ...i, quantity: Math.min(qty, i.product.STOCK) };
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0),
    [items, apertura],
  );
  const catalogSubtotal = useMemo(
    () => items.reduce((s, i) => s + i.product.PRICE * i.quantity, 0),
    [items],
  );
  const aperturaSavings = useMemo(
    () => (apertura?.isActive ? Math.max(0, catalogSubtotal - subtotal) : 0),
    [apertura, catalogSubtotal, subtotal],
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, catalogSubtotal, aperturaSavings }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
