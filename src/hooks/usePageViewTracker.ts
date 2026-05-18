'use client';

import { useEffect } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite-admin';
import { Query, ID, Permission, Role } from 'appwrite';

const PAGE_VIEWS_COLLECTION = 'page_views';

// Rutas que NO se trackean (admin, api, etc.)
const IGNORED_PREFIXES = ['/admin', '/api', '/_next', '/inventario'];

function shouldTrack(path: string): boolean {
  return !IGNORED_PREFIXES.some(p => path.startsWith(p));
}

// Obtener IP y geolocalización del visitante
async function getGeoInfo(): Promise<{ ip: string; comuna: string; region: string; lat: number; lng: number }> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip || 'unknown',
        comuna: data.city || data.region || '',
        region: data.region || '',
        lat: data.latitude || 0,
        lng: data.longitude || 0,
      };
    }
  } catch {}
  return { ip: 'unknown', comuna: '', region: '', lat: 0, lng: 0 };
}

// Hash simple para no guardar IPs en texto plano
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h' + Math.abs(hash).toString(36);
}

/**
 * Registra una visita única por IP por día en la página actual.
 * Solo trackea páginas del frontend (ignora /admin, /api, etc.)
 */
export function usePageViewTracker() {
  useEffect(() => {
    const track = async () => {
      const page = window.location.pathname || '/';
      if (!shouldTrack(page)) return;

      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const date = new Date().toISOString().slice(0, 10);

        // Obtener geo info
        const geo = await getGeoInfo();
        const ipHash = simpleHash(geo.ip + date);

        // Verificar si esta IP ya visitó esta página hoy
        const existing = await databases.listDocuments(databaseId, PAGE_VIEWS_COLLECTION, [
          Query.equal('PAGE', page),
          Query.equal('DATE', date),
          Query.equal('IP', ipHash),
          Query.limit(1),
        ]);

        if (existing.documents.length > 0) {
          // Ya visitó hoy → no contar doble
          return;
        }

        // Primera visita de esta IP hoy → crear registro
        await databases.createDocument(databaseId, PAGE_VIEWS_COLLECTION, ID.unique(), {
          PAGE: page,
          DATE: date,
          VIEWS: 1,
          IP: ipHash,
          COMUNA: geo.comuna,
          REGION: geo.region,
          LAT: geo.lat,
          LNG: geo.lng,
        }, [
          Permission.read(Role.any()),
          Permission.write(Role.any()),
        ]);
      } catch (e: any) {
        console.error('[page-view-tracker] Error:', e?.message || e);
      }
    };

    track();
  }, []);
}

/**
 * Obtiene estadísticas de visitas para el dashboard.
 * Solo cuenta páginas del frontend.
 */
export async function getPageViewStats(days = 30) {
  const { databases } = getServices();
  const { databaseId } = getAppwriteConfig();

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const all: { PAGE: string; DATE: string; VIEWS: number; COMUNA: string; REGION: string; LAT: number; LNG: number }[] = [];
  let cursor: string | undefined;

  do {
    const queries: any[] = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(databaseId, PAGE_VIEWS_COLLECTION, queries);
    const docs = res.documents.map(d => ({
      PAGE: (d as any).PAGE || '/',
      DATE: (d as any).DATE || '',
      VIEWS: (d as any).VIEWS || 0,
      COMUNA: (d as any).COMUNA || '',
      REGION: (d as any).REGION || '',
      LAT: (d as any).LAT || 0,
      LNG: (d as any).LNG || 0,
    }));
    all.push(...docs);
    cursor = res.documents.length > 0 ? res.documents[res.documents.length - 1].$id : undefined;
    if (res.documents.length < 100) break;
  } while (cursor);

  // Filtrar por fecha y solo frontend
  const filtered = all.filter(d => d.DATE >= sinceStr && shouldTrack(d.PAGE));

  const totalViews = filtered.length;
  const uniquePages = new Set(filtered.map(d => d.PAGE)).size;

  // Visitas por día
  const viewsByDay: Record<string, number> = {};
  filtered.forEach(d => {
    viewsByDay[d.DATE] = (viewsByDay[d.DATE] || 0) + 1;
  });

  // Top páginas
  const viewsByPage: Record<string, number> = {};
  filtered.forEach(d => {
    viewsByPage[d.PAGE] = (viewsByPage[d.PAGE] || 0) + 1;
  });
  const topPages = Object.entries(viewsByPage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Visitas de hoy
  const today = new Date().toISOString().slice(0, 10);
  const todayViews = filtered.filter(d => d.DATE === today).length;

  // Top comunas
  const viewsByComuna: Record<string, { count: number; lat: number; lng: number }> = {};
  filtered.forEach(d => {
    if (d.COMUNA) {
      if (!viewsByComuna[d.COMUNA]) viewsByComuna[d.COMUNA] = { count: 0, lat: d.LAT, lng: d.LNG };
      viewsByComuna[d.COMUNA].count++;
    }
  });
  const topComunas = Object.entries(viewsByComuna)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([comuna, data]) => ({ comuna, count: data.count, lat: data.lat, lng: data.lng }));

  // Marcadores para el mapa (últimas 24h, con coords)
  const last24h = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const mapMarkers = filtered
    .filter(d => d.DATE >= last24h && d.LAT && d.LNG)
    .reduce((acc, d) => {
      const key = d.COMUNA || `${d.LAT},${d.LNG}`;
      if (!acc[key]) acc[key] = { comuna: d.COMUNA, region: d.REGION, lat: d.LAT, lng: d.LNG, count: 0 };
      acc[key].count++;
      return acc;
    }, {} as Record<string, { comuna: string; region: string; lat: number; lng: number; count: number }>);
  const visitorMarkers = Object.values(mapMarkers);

  return { totalViews, uniquePages, viewsByDay, topPages, todayViews, topComunas, visitorMarkers, days: filtered.length };
}
