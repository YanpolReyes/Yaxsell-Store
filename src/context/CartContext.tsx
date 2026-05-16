'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/components/Toast';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, qty?: number, timedOfferPrice?: number, timedOfferExpiresAt?: number, wholesalePrice?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('yaxsel_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('yaxsel_cart', JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yaxsel:cart-updated'));
    }
  }, [items]);

  const getEffectivePrice = (item: CartItem): number => {
    const now = Date.now();
    if (item.timedOfferPrice && item.timedOfferExpiresAt && now < item.timedOfferExpiresAt) {
      return item.timedOfferPrice;
    }
    if (item.wholesalePrice) {
      return item.wholesalePrice;
    }
    return item.product.CURRENTPRICE && item.product.CURRENTPRICE > 0
      ? item.product.CURRENTPRICE
      : item.product.PRICE;
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
  const subtotal = items.reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
