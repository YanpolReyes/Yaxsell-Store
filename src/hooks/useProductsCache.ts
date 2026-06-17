import useSWR from 'swr';
import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { getSkuFromFeatures } from '@/lib/product-features';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UseProductsParams {
  categoryId?: string;
  subcategoryId?: string;
  subSubcategoryId?: string;
  sortBy?: string;
  search?: string;
  tag?: string;
  priceMin?: number;
  priceMax?: number;
  ofertasOnly?: boolean;
}

export function useProductsCache(params: UseProductsParams) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [page, setPage] = useState(1);
  
  const { settings: apertura } = useAperturaPromotion();

  const [isMinWaitDone, setIsMinWaitDone] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    
    // Premium UX: Ensure minimum loader time so Lottie has time to load and play
    const t = setTimeout(() => setIsMinWaitDone(true), 1200);
    
    return () => {
      window.removeEventListener('resize', check);
      clearTimeout(t);
    };
  }, []);

  const limit = isMobile ? 50 : 100;

  // Global SWR Key: Fetch EVERYTHING once.
  const globalKey = isClient ? `/api/public-data/products?limit=10000` : null;

  const { data, error, isValidating, mutate } = useSWR(globalKey, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60000, 
  });

  // Keep loading true until both data arrives AND the minimum premium delay has passed
  const isLoadingInitialData = (!data && !error) || !isMinWaitDone;

  const processedData = useMemo(() => {
    if (!data || !data.products) {
      return {
        products: [],
        total: 0,
        priceRange: [0, 0],
        categoryCounts: {},
        subcategoryCounts: {},
        subSubcategoryCounts: {},
        allTags: [],
      };
    }

    let filtered: Product[] = [...data.products];
    const activeOffers = data.activeOffers || [];
    
    if (params.categoryId) {
      filtered = filtered.filter(p => p.CATEGORYID === params.categoryId);
    }
    if (params.subcategoryId) {
      filtered = filtered.filter(p => p.SUBCATEGORYID === params.subcategoryId);
    }
    if (params.subSubcategoryId) {
      filtered = filtered.filter(p => p.SUBSUBCATEGORYID === params.subSubcategoryId);
    }
    if (params.ofertasOnly && activeOffers.length > 0) {
      filtered = filtered.filter(p => activeOffers.includes(p.$id));
    }
    if (params.tag) {
      filtered = filtered.filter(p => {
        const pTags = !p.TAGS ? [] : typeof p.TAGS === 'string' ? (p.TAGS as string).split(',').map(t => t.trim()) : (p.TAGS as string[]);
        return pTags.some(t => t.toLowerCase() === params.tag!.toLowerCase());
      });
    }
    if (params.search) {
      const normalizeText = (text: string) => 
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").toLowerCase();
      
      const qTokens = normalizeText(params.search).trim().split(/\s+/).filter(Boolean);
      if (qTokens.length > 0) {
        filtered = filtered.filter(p => {
          const pFeatures = Array.isArray(p.FEATURES) ? p.FEATURES.join('\n') : p.FEATURES;
          const pTags = Array.isArray(p.TAGS) ? p.TAGS.join(',') : p.TAGS;
          const pSku = getSkuFromFeatures(pFeatures, pTags, (p as any).jumpseller_id, p.SKU || (p as any).sku);
          
          const searchSpace = normalizeText(`${p.NAME} ${p.DESCRIPTION || ''} ${pSku}`);
          return qTokens.every(token => searchSpace.includes(token));
        });
      }
    }

    if (params.priceMin !== undefined && params.priceMax !== undefined) {
      filtered = filtered.filter(p => {
        const price = resolveProductDisplayPrice(p, apertura).displayPrice;
        return price >= params.priceMin! && price <= params.priceMax!;
      });
    }

    const sortBy = params.sortBy || 'newest';
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime());
    } else if (sortBy === 'updated') {
      filtered.sort((a, b) => {
        const timeA = new Date(a.$updatedAt || a.$createdAt || 0).getTime();
        const timeB = new Date(b.$updatedAt || b.$createdAt || 0).getTime();
        return timeB - timeA;
      });
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => resolveProductDisplayPrice(a, apertura).displayPrice - resolveProductDisplayPrice(b, apertura).displayPrice);
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => resolveProductDisplayPrice(b, apertura).displayPrice - resolveProductDisplayPrice(a, apertura).displayPrice);
    }

    return {
      products: filtered,
      total: filtered.length,
      priceRange: data.priceRange || [0, 0],
      categoryCounts: data.categoryCounts || {},
      subcategoryCounts: data.subcategoryCounts || {},
      subSubcategoryCounts: data.subSubcategoryCounts || {},
      allTags: data.allTags || [],
    };
  }, [data, params, apertura]);

  const paginatedProducts = useMemo(() => {
    return processedData.products.slice(0, page * limit);
  }, [processedData.products, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [params.categoryId, params.subcategoryId, params.search, params.tag, params.sortBy, params.priceMin, params.priceMax, params.ofertasOnly]);

  const hasMore = paginatedProducts.length < processedData.products.length;

  return {
    products: paginatedProducts,
    total: processedData.total,
    priceRange: processedData.priceRange,
    categoryCounts: processedData.categoryCounts,
    subcategoryCounts: processedData.subcategoryCounts,
    subSubcategoryCounts: processedData.subSubcategoryCounts,
    allTags: processedData.allTags,
    error,
    isLoadingInitialData,
    isLoadingMore: isValidating && isLoadingInitialData,
    isReachingEnd: !hasMore,
    loadMore: () => {
      if (hasMore) setPage(p => p + 1);
    },
    isMobile,
    mutate
  };
}

export async function invalidateGlobalProductsCache() {
  try {
    await fetch('/api/admin/revalidate', { method: 'POST' }).catch(() => {});
    const { mutate } = require('swr');
    await mutate(
      (key: string) => typeof key === 'string' && key.startsWith('/api/public-data/products'),
      undefined,
      { revalidate: true }
    );
  } catch (e) {
    console.error('Error invalidating cache', e);
  }
}

