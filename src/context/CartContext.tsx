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
  const itemsRef = useRef<CartItem[]>([]);

  // Keep itemsRef in sync with items state
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yaxsel_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Find existing snapshot doc ID on login
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, CART_SNAPSHOTS_COLLECTION, [
          Query.equal('userId', user.id), Query.limit(1),
        ]);
        if (res.documents.length > 0) {
          snapshotDocIdRef.current = res.documents[0].$id;
        }
      } catch {}
    })();
  }, [isLoggedIn, user?.id]);

  // Save snapshot to Appwrite (used by removeItem/clearCart for immediate sync)
  const saveSnapshotNow = useCallback(async (currentItems: CartItem[]) => {
    if (!isLoggedIn || !user) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const snapshot = currentItems.map(i => ({
        id: i.product.$id,
        name: i.product.NAME,
        qty: i.quantity,
        price: i.product.PRICE,
      }));
      const data = {
        userId: user.id,
        itemsJson: JSON.stringify(snapshot),
        updatedAt: Math.floor(Date.now() / 1000),
      };
      if (snapshotDocIdRef.current) {
        await databases.updateDocument(databaseId, CART_SNAPSHOTS_COLLECTION, snapshotDocIdRef.current, data);
      } else {
        const doc = await databases.createDocument(databaseId, CART_SNAPSHOTS_COLLECTION, ID.unique(), data);
        snapshotDocIdRef.current = doc.$id;
      }
    } catch {}
  }, [isLoggedIn, user]);

  // Save to localStorage + debounced snapshot to Appwrite (admin visibility)
  useEffect(() => {
    localStorage.setItem('yaxsel_cart', JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yaxsel:cart-updated'));
    }
    if (!isLoggedIn || !user) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveSnapshotNow(items), 10000);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [items, isLoggedIn, user?.id, saveSnapshotNow]);

  const getEffectivePrice = (item: CartItem): number => {
    const now = Date.now();
    if (item.timedOfferPrice && item.timedOfferExpiresAt && now < item.timedOfferExpiresAt) {
      return item.timedOfferPrice;
    }
    const effectiveWholesale = (item.product.WHOLESALEPRICE && item.product.WHOLESALEMINQUANTITY && item.quantity >= item.product.WHOLESALEMINQUANTITY) 
      ? item.product.WHOLESALEPRICE 
      : item.wholesalePrice;

    if (effectiveWholesale) {
      return effectiveWholesale;
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
    const updated = itemsRef.current.filter(i => i.product.$id !== productId);
    setItems(updated);
    saveSnapshotNow(updated);
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
    saveSnapshotNow([]);
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
