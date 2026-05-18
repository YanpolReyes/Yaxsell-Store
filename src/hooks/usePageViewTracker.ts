'use client';

import { useEffect } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite-admin';
import { Query, ID, Permission, Role } from 'appwrite';

const PAGE_VIEWS_COLLECTION = 'page_views';

/**
 * Registra una visita a la página actual en la colección page_views.
 * Usa upsert: si ya existe un documento para (PAGE, DATE), incrementa VIEWS.
 */
export function usePageViewTracker() {
  useEffect(() => {
    const track = async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const page = window.location.pathname || '/';
        const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // Buscar documento existente para esta página y fecha
        const res = await databases.listDocuments(databaseId, PAGE_VIEWS_COLLECTION, [
          Query.equal('PAGE', page),
          Query.equal('DATE', date),
          Query.limit(1),
        ]);

        if (res.documents.length > 0) {
          const doc = res.documents[0];
          const currentViews = (doc as any).VIEWS || 0;
          await databases.updateDocument(databaseId, PAGE_VIEWS_COLLECTION, doc.$id, {
            VIEWS: currentViews + 1,
          });
        } else {
          await databases.createDocument(databaseId, PAGE_VIEWS_COLLECTION, ID.unique(), {
            PAGE: page,
            DATE: date,
            VIEWS: 1,
          }, [
            Permission.read(Role.any()),
            Permission.write(Role.any()),
          ]);
        }
      } catch (e: any) {
        console.error('[page-view-tracker] Error tracking page view:', e?.message || e);
      }
    };

    track();
  }, []);
}

/**
 * Obtiene estadísticas de visitas para el dashboard.
 */
export async function getPageViewStats(days = 30) {
  const { databases } = getServices();
  const { databaseId } = getAppwriteConfig();

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const all: { PAGE: string; DATE: string; VIEWS: number }[] = [];
  let cursor: string | undefined;

  do {
    const queries: any[] = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(databaseId, PAGE_VIEWS_COLLECTION, queries);
    const docs = res.documents.map(d => ({
      PAGE: (d as any).PAGE || '/',
      DATE: (d as any).DATE || '',
      VIEWS: (d as any).VIEWS || 0,
    }));
    all.push(...docs);
    cursor = res.documents.length > 0 ? res.documents[res.documents.length - 1].$id : undefined;
    if (res.documents.length < 100) break;
  } while (cursor);

  // Filtrar por fecha
  const filtered = all.filter(d => d.DATE >= sinceStr);

  const totalViews = filtered.reduce((s, d) => s + d.VIEWS, 0);
  const uniquePages = new Set(filtered.map(d => d.PAGE)).size;

  // Vistas por día
  const viewsByDay: Record<string, number> = {};
  filtered.forEach(d => {
    viewsByDay[d.DATE] = (viewsByDay[d.DATE] || 0) + d.VIEWS;
  });

  // Top páginas
  const viewsByPage: Record<string, number> = {};
  filtered.forEach(d => {
    viewsByPage[d.PAGE] = (viewsByPage[d.PAGE] || 0) + d.VIEWS;
  });
  const topPages = Object.entries(viewsByPage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Vistas de hoy
  const today = new Date().toISOString().slice(0, 10);
  const todayViews = filtered.filter(d => d.DATE === today).reduce((s, d) => s + d.VIEWS, 0);

  return { totalViews, uniquePages, viewsByDay, topPages, todayViews, days: filtered.length };
}
