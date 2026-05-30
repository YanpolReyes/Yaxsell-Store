'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getServices, getAppwriteConfig, FAVORITES_COLLECTION, PRODUCTS_COLLECTION } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types';
import { useToast } from '@/components/Toast';

interface FavoritesContextType {
  favorites: string[];
  favoriteProducts: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// ── Caché singleton para favoritos ──
let favCacheIds: string[] = [];
let favCacheProducts: Product[] = [];
let favCacheDocMap: Record<string, string> = {};
let favCacheTimestamp = 0;
let favCacheUserId: string | null = null;
const FAV_CACHE_TTL = 2 * 60 * 1000; // 2 minutos

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<string[]>(favCacheUserId === user?.id ? favCacheIds : []);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>(favCacheUserId === user?.id ? favCacheProducts : []);
  const [docMap, setDocMap] = useState<Record<string, string>>(favCacheUserId === user?.id ? favCacheDocMap : {});
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!isLoggedIn || !user) { setFavorites([]); setFavoriteProducts([]); return; }
    // Usar caché si es reciente y es el mismo usuario
    const now = Date.now();
    if (favCacheUserId === user.id && (now - favCacheTimestamp) < FAV_CACHE_TTL) {
      setFavorites(favCacheIds);
      setFavoriteProducts(favCacheProducts);
      setDocMap(favCacheDocMap);
      return;
    }
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, FAVORITES_COLLECTION, [
        Query.equal('userId', user.id),
        Query.limit(100),
      ]);
      const ids: string[] = [];
      const map: Record<string, string> = {};
      res.documents.forEach((doc: any) => {
        ids.push(doc.productId);
        map[doc.productId] = doc.$id;
      });
      setFavorites(ids);
      setDocMap(map);

      // Load product details
      let prods: Product[] = [];
      if (ids.length > 0) {
        const prodRes = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
          Query.equal('$id', ids),
          Query.limit(100),
        ]);
        prods = prodRes.documents as unknown as Product[];
        setFavoriteProducts(prods);
      } else {
        setFavoriteProducts([]);
      }

      // Actualizar caché
      favCacheIds = ids;
      favCacheProducts = prods;
      favCacheDocMap = map;
      favCacheTimestamp = Date.now();
      favCacheUserId = user.id;
    } catch (e) {
      console.error('Error loading favorites:', e);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  // Evitar loops: cargar favoritos solo cuando cambia el ID de usuario o login
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadFavorites();
    } else if (!isLoggedIn) {
      setFavorites([]);
      setFavoriteProducts([]);
    }
  }, [isLoggedIn, user?.id]);

  const isFavorite = (productId: string) => favorites.includes(productId);

  const toggleFavorite = async (productId: string) => {
    if (!isLoggedIn || !user) return;
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    if (isFavorite(productId)) {
      // Remove
      const docId = docMap[productId];
      if (docId) {
        try {
          await databases.deleteDocument(databaseId, FAVORITES_COLLECTION, docId);
          showToast('Eliminado de favoritos', 'info');
        } catch {}
      }
      setFavorites(prev => prev.filter(id => id !== productId));
      setFavoriteProducts(prev => prev.filter(p => p.$id !== productId));
      setDocMap(prev => { const n = { ...prev }; delete n[productId]; return n; });
      // Invalidar caché
      favCacheTimestamp = 0;
    } else {
      // Add
      try {
        const doc = await databases.createDocument(databaseId, FAVORITES_COLLECTION, ID.unique(), {
          userId: user.id,
          productId: productId,
          createdAt: Math.floor(Date.now() / 1000),
        });
        setFavorites(prev => [...prev, productId]);
        setDocMap(prev => ({ ...prev, [productId]: doc.$id }));
        showToast('❤️ Agregado a favoritos', 'success');
        // Load product detail
        try {
          const p = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, productId);
          setFavoriteProducts(prev => [...prev, p as unknown as Product]);
        } catch {}
        // Invalidar caché
        favCacheTimestamp = 0;
      } catch (e) {
        console.error('Error adding favorite:', e);
      }
    }
  };

  return React.createElement(
    FavoritesContext.Provider,
    { value: { favorites, favoriteProducts, isFavorite, toggleFavorite, loading } },
    children
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
