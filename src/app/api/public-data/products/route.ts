import { NextRequest, NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, TIMED_OFFERS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { unstable_cache } from 'next/cache';
import { resolveProductDisplayPrice, fetchAperturaSettings } from '@/lib/apertura-promo';
import { getSkuFromFeatures } from '@/lib/product-features';
import { normalizeProductImages } from '@/lib/product-images';

// Helper to get threshold for live shopping
function getLiveShoppingThreshold(): Date {
  const now = new Date();
  const today7Am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0);
  if (now.getTime() >= today7Am.getTime()) {
    return today7Am;
  } else {
    const yesterday7Am = new Date(today7Am);
    yesterday7Am.setDate(yesterday7Am.getDate() - 1);
    return yesterday7Am;
  }
}

// Cache all active products for 60 seconds
const getCachedAllProducts = unstable_cache(
  async () => {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    
    let allProducts = [];
    let lastId = null;
    const limit = 100;
    
    while (true) {
      const queries = [
        Query.limit(limit),
        Query.greaterThanEqual('STOCK', 0)
      ];
      if (lastId) {
        queries.push(Query.cursorAfter(lastId));
      }
      
      const response = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, queries);
      if (response.documents.length === 0) {
        break;
      }
      
      allProducts.push(...response.documents);
      lastId = response.documents[response.documents.length - 1].$id;
      
      if (response.documents.length < limit) {
        break;
      }
    }
    
    // Normalize images on fetch
    return allProducts.map(p => normalizeProductImages(p as any));
  },
  ['all-public-products-cache-v3'],
  { revalidate: 60, tags: ['products'] }
);

// Cache active offer target IDs
const getCachedActiveOffers = unstable_cache(
  async () => {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    const res = await databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [
      Query.equal('isActive', true),
      Query.equal('status', 'active'),
      Query.limit(100)
    ]);
    return res.documents.map((d: any) => d.targetId).filter(Boolean);
  },
  ['active-offers-cache-v3'],
  { revalidate: 60, tags: ['offers'] }
);

// Cache apertura settings
const getCachedAperturaSettings = unstable_cache(
  async () => {
    return await fetchAperturaSettings();
  },
  ['apertura-settings-cache-v3'],
  { revalidate: 60, tags: ['settings'] }
);

// Cache live products for 30 seconds
const getCachedLiveProducts = unstable_cache(
  async (thresholdIso: string) => {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
      Query.greaterThanEqual('imported_at', thresholdIso),
      Query.greaterThanEqual('STOCK', 0),
      Query.orderDesc('imported_at'),
      Query.limit(500),
    ]);
    return res.documents.map(p => normalizeProductImages(p as any));
  },
  ['live-products-cache-v3'],
  { revalidate: 30, tags: ['products', 'live'] }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isLive = searchParams.get('live') === 'true';

    // 1. Live Shopping (Cached query)
    if (isLive) {
      const threshold = getLiveShoppingThreshold();
      const liveProducts = await getCachedLiveProducts(threshold.toISOString());
      return NextResponse.json({ products: liveProducts });
    }

    // 2. Standard Catalog Filters (Memory-based query)
    const sortBy = searchParams.get('sortBy') || 'newest';
    const categoryId = searchParams.get('categoryId') || undefined;
    const subcategoryId = searchParams.get('subcategoryId') || undefined;
    const subSubcategoryId = searchParams.get('subSubcategoryId') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const ofertasOnly = searchParams.get('ofertasOnly') === 'true';
    const priceMin = searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!, 10) : undefined;
    const priceMax = searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!, 10) : undefined;
    
    // Fallback to 1000 if limit is not passed (stale browser cache fallback)
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 1000;
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch cached data
    const [allProductsRaw, activeOffers, apertura] = await Promise.all([
      getCachedAllProducts(),
      getCachedActiveOffers(),
      getCachedAperturaSettings()
    ]);
    const allProducts = allProductsRaw as any[];

    // Calculate Category, Subcategory and SubSubcategory Counts (across all active products in DB)
    const categoryCounts: Record<string, number> = {};
    const subcategoryCounts: Record<string, number> = {};
    const subSubcategoryCounts: Record<string, number> = {};
    allProducts.forEach(p => {
      if (p.CATEGORYID) {
        categoryCounts[p.CATEGORYID] = (categoryCounts[p.CATEGORYID] || 0) + 1;
      }
      if (p.SUBCATEGORYID) {
        subcategoryCounts[p.SUBCATEGORYID] = (subcategoryCounts[p.SUBCATEGORYID] || 0) + 1;
      }
      if (p.SUBSUBCATEGORYID) {
        subSubcategoryCounts[p.SUBSUBCATEGORYID] = (subSubcategoryCounts[p.SUBSUBCATEGORYID] || 0) + 1;
      }
    });

    // Filter by category and search parameters (Except Price Range to compute price slider dynamically)
    let filtered = allProducts;
    if (categoryId) {
      filtered = filtered.filter(p => p.CATEGORYID === categoryId);
    }
    if (subcategoryId) {
      filtered = filtered.filter(p => p.SUBCATEGORYID === subcategoryId);
    }
    if (subSubcategoryId) {
      filtered = filtered.filter(p => p.SUBSUBCATEGORYID === subSubcategoryId);
    }
    if (ofertasOnly) {
      filtered = filtered.filter(p => activeOffers.includes(p.$id));
    }
    if (tag) {
      filtered = filtered.filter(p => {
        const pTags = !p.TAGS ? [] : typeof p.TAGS === 'string' ? (p.TAGS as string).split(',').map(t => t.trim()) : (p.TAGS as string[]);
        return pTags.some(t => t.toLowerCase() === tag.toLowerCase());
      });
    }
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const pFeatures = Array.isArray(p.FEATURES) ? p.FEATURES.join('\n') : p.FEATURES;
        const pTags = Array.isArray(p.TAGS) ? p.TAGS.join(',') : p.TAGS;
        const pSku = getSkuFromFeatures(pFeatures, pTags, (p as any).jumpseller_id, p.SKU || (p as any).sku);
        return p.NAME.toLowerCase().includes(q) ||
          (p.DESCRIPTION || '').toLowerCase().includes(q) ||
          pSku.toLowerCase().includes(q);
      });
    }

    // Calculate dynamic price range (min/max price matching current category/search criteria)
    const displayPrices = filtered.map(p => resolveProductDisplayPrice(p, apertura).displayPrice).filter(price => price > 0);
    const minPrice = displayPrices.length > 0 ? Math.floor(Math.min(...displayPrices)) : 0;
    const maxPrice = displayPrices.length > 0 ? Math.ceil(Math.max(...displayPrices)) : 0;

    // Apply Price Range filter
    if (priceMin !== undefined && priceMax !== undefined) {
      filtered = filtered.filter(p => {
        const price = resolveProductDisplayPrice(p, apertura).displayPrice;
        return price >= priceMin && price <= priceMax;
      });
    }

    // Sort Products
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => {
        const pa = resolveProductDisplayPrice(a, apertura).displayPrice;
        const pb = resolveProductDisplayPrice(b, apertura).displayPrice;
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => {
        const pa = resolveProductDisplayPrice(a, apertura).displayPrice;
        const pb = resolveProductDisplayPrice(b, apertura).displayPrice;
        return pb - pa;
      });
    }

    // Sliced pagination
    const total = filtered.length;
    const paginatedProducts = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      products: paginatedProducts,
      total,
      priceRange: [minPrice, maxPrice],
      categoryCounts,
      subcategoryCounts,
      subSubcategoryCounts
    });

  } catch (error: any) {
    console.error('[API public-data/products] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
