'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types';
import { useToast } from '@/components/Toast';

// ── Favoritos 100% localStorage ──
// Sin llamadas a Appwrite. Como el carrito.
// Si el usuario cambia de dispositivo, sus favoritos no se transfieren (intencional).

interface FavoritesContextType {
  favorites: string[];
  favoriteProducts: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string, product?: Product) => void;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const LS_FAV_IDS      = 'yaxsel_fav_ids';
const LS_FAV_PRODUCTS = 'yaxsel_fav_products';
const LS_FAV_USER     = 'yaxsel_fav_user';

function loadFromStorage(userId: string): { ids: string[]; products: Product[] } {
  try {
    if (typeof window === 'undefined') return { ids: [], products: [] };
    const storedUser = localStorage.getItem(LS_FAV_USER);
    if (storedUser !== userId) return { ids: [], products: [] };
    const ids      = JSON.parse(localStorage.getItem(LS_FAV_IDS)      || '[]');
    const products = JSON.parse(localStorage.getItem(LS_FAV_PRODUCTS) || '[]');
    return { ids, products };
  } catch {
    return { ids: [], products: [] };
  }
}

function saveToStorage(userId: string, ids: string[], products: Product[]) {
  try {
    localStorage.setItem(LS_FAV_IDS,      JSON.stringify(ids));
    localStorage.setItem(LS_FAV_PRODUCTS, JSON.stringify(products));
    localStorage.setItem(LS_FAV_USER,     userId);
  } catch { /* ignorar errores de cuota */ }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [favorites,        setFavorites]        = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

  // Cargar del localStorage cuando cambia el usuario
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setFavorites([]);
      setFavoriteProducts([]);
      return;
    }
    const { ids, products } = loadFromStorage(user.id);
    setFavorites(ids);
    setFavoriteProducts(products);
  }, [isLoggedIn, user?.id]);

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (productId: string, product?: Product) => {
      if (!isLoggedIn || !user) return;

      const isFav = favorites.includes(productId);

      if (isFav) {
        const newIds      = favorites.filter(id => id !== productId);
        const newProducts = favoriteProducts.filter(p => p.$id !== productId);
        setFavorites(newIds);
        setFavoriteProducts(newProducts);
        saveToStorage(user.id, newIds, newProducts);
        showToast('Eliminado de favoritos', 'info');
      } else {
        const newIds      = [...favorites, productId];
        const newProducts = product ? [...favoriteProducts, product] : favoriteProducts;
        setFavorites(newIds);
        setFavoriteProducts(newProducts);
        saveToStorage(user.id, newIds, newProducts);
        showToast('❤️ Agregado a favoritos', 'success');
      }
    },
    [isLoggedIn, user, favorites, favoriteProducts, showToast]
  );

  return React.createElement(
    FavoritesContext.Provider,
    { value: { favorites, favoriteProducts, isFavorite, toggleFavorite, loading: false } },
    children
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
