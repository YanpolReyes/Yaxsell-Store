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

const CART_ITEMS_COLLECTION = 'cart_items';
const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { showToast } = useToast();
  const { settings: apertura } = useAperturaPromotion();
  const { user, isLoggedIn } = useAuth();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yaxsel_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Load cart from Appwrite when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, CART_ITEMS_COLLECTION, [
          Query.equal('userId', user.id), Query.limit(100),
        ]);
        if (res.documents.length > 0) {
          const serverItems: CartItem[] = [];
          for (const doc of res.documents as any[]) {
            try {
              const p = await databases.getDocument(databaseId, 'products', doc.productId);
              serverItems.push({ product: p as unknown as Product, quantity: doc.quantity || 1 });
            } catch {}
          }
          if (serverItems.length > 0) {
            setItems(serverItems);
          }
        }
      } catch {}
    })();
  }, [isLoggedIn, user?.id]);

  // Save to localStorage + sync to Appwrite
  useEffect(() => {
    localStorage.setItem('yaxsel_cart', JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yaxsel:cart-updated'));
    }
    // Debounced sync to Appwrite
    if (!isLoggedIn || !user) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        // Delete all existing cart items for this user
        const existing = await databases.listDocuments(databaseId, CART_ITEMS_COLLECTION, [
          Query.equal('userId', user.id), Query.limit(100),
        ]);
        for (const doc of existing.documents) {
          await databases.deleteDocument(databaseId, CART_ITEMS_COLLECTION, doc.$id);
        }
        // Create new cart items
        for (const item of items) {
          await databases.createDocument(databaseId, CART_ITEMS_COLLECTION, ID.unique(), {
            userId: user.id,
            productId: item.product.$id,
            quantity: item.quantity,
            addedAt: Math.floor(Date.now() / 1000),
          });
        }
      } catch {}
    }, 2000);
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

  const clearCart = () => setItems([]);

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
