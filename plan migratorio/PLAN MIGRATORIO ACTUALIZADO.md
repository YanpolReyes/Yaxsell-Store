# 🚀 Plan Migratorio ACTUALIZADO — Jun 24, 2026

> **Audit real ejecutado contra el proyecto Appwrite original**
> **Fecha:** 24 junio 2026

---

## 1. Estado REAL del Proyecto Original (Audit Live)

### Credenciales Originales
| Item | Valor |
|------|-------|
| Endpoint | `https://nyc.cloud.appwrite.io/v1` |
| Project ID | `6a0a4e8d0032177f3f90` |
| Database ID | `6a0a58ca001798410d86` |
| API Key (dev) | `standard_de757dd8d6cd1808ddc9a0b6694cad9a4e4ceb904a97613e4bc255cb116c0b1272ee9d865149911bab66ecb0e078d3120fbf9bd5c82cba8bc0d2ea6354cb3d24aa96e77f53d86fbf3a68a007abb0af608ee4854491b3e2b29b0d6e2fe63f907d592e8000c16c38f408e3bd1de65505897c249ecac5ecfb1e1a6de5c9b40aa655` |

### Colecciones REALES (26 existentes + 8 faltantes = 34)

| # | Colección | Docs | Existe | Permisos |
|---|-----------|------|--------|----------|
| 1 | `products` | 701 | ✅ | any r/c/u/d |
| 2 | `inventory_products` | 0 | ✅ | any r/c/u/d |
| 3 | `categories` | 19 | ✅ | any r/c/u/d |
| 4 | `subcategories` | 22 | ✅ | any r/c/u/d |
| 5 | `banners` | 0 | ✅ | any r/c/u/d |
| 6 | `orders` | 72 | ✅ | any r/c/u/d |
| 7 | `users` | 220 | ✅ | any r/c/u/d |
| 8 | `notifications` | 313 | ✅ | any r/c/u/d |
| 9 | `timed_offers` | 1 | ✅ | any r/c/u/d |
| 10 | `support_tickets` | 0 | ✅ | any r/c/u/d |
| 11 | `sequences` | 8 | ✅ | any r/c/u/d |
| 12 | `discount_coupons` | 3 | ✅ | any r/c/u/d |
| 13 | `points_store_items` | 0 | ✅ | any r/c/u/d |
| 14 | `wholesale_requests` | 5 | ✅ | any r/c/u/d |
| 15 | `reviews` | 0 | ✅ | any r/c/u/d |
| 16 | `favorites` | 145 | ✅ | any r/c/u/d |
| 17 | `stock_alerts` | 86 | ✅ | any r/c/u/d |
| 18 | `apertura_settings` | 1 | ✅ | any r/c/u/d |
| 19 | `product_votes` | 12 | ✅ | any r/c/u/d |
| 20 | `banner_overlay_positions` | 0 | ✅ | any r/c/u/d |
| 21 | `house_product_positions` | 0 | ✅ | any r/c/u/d |
| 22 | `hotspot_panels` | 0 | ✅ | any r/c/u/d |
| 23 | `theme_config` | 4 | ✅ | any r/c/u/d |
| 24 | `store_settings` | 1 | ✅ | any r/c/u/d |
| 25 | `page_views` | 3,734 | ✅ | any r/c/u/d |
| 26 | `admin_chat` | 109 | ✅ | any r/c/u/d |
| 27 | `live_streams` | — | ❌ FALTANTE | — |
| 28 | `live_raffles` | — | ❌ FALTANTE | — |
| 29 | `raffle_participants` | — | ❌ FALTANTE | — |
| 30 | `clips` | — | ❌ FALTANTE | — |
| 31 | `stock_movements` | — | ❌ FALTANTE | — |
| 32 | `fcm_tokens` | — | ❌ FALTANTE | — |
| 33 | `order_status_history` | — | ❌ FALTANTE | — |
| 34 | `addresses` | — | ❌ FALTANTE | — |

**Total documentos a migrar: ~5,432**

### Storage Buckets REALES
| Bucket ID | Name | Max Size |
|-----------|------|----------|
| `products` | Products | 50MB |
| `6a15f9a5001070a3c408` | ia | 5GB |
| `6a349e3f000d44477aa2` | despachos | 5GB |

### Cambios vs Plan Antiguo
- **`admin_chat`**: NUEVA colección (109 docs) — no estaba en plan original
- **`inventory_products`**: Ahora tiene 0 docs (antes 267) — se vació
- **`products`**: Ahora tiene 701 docs (antes 0) — se pobló
- **`page_views`**: 3,734 docs (antes no tenía count)
- **`orders`**: 72 docs (antes 0)
- **`users`**: 220 docs (antes 0)
- **`notifications`**: 313 docs (antes 0)
- **`favorites`**: 145 docs (antes 0)
- **`stock_alerts`**: 86 docs (antes 0)
- **`discount_coupons`**: 3 docs (antes 0)
- **`wholesale_requests`**: 5 docs (antes 0)
- **`product_votes`**: 12 docs (antes 0)
- **`timed_offers`**: 1 doc (antes 0)
- **`apertura_settings`**: 1 doc (antes 0)
- **`theme_config`**: 4 docs (antes 0)
- **`sequences`**: 8 docs (antes 1)
- **8 colecciones faltantes**: live_streams, live_raffles, raffle_participants, clips, stock_movements, fcm_tokens, order_status_history, addresses
- **Buckets**: 3 reales (products, ia, despachos) — IDs reales no eran los del plan

---

## 2. Orden de Migración: Git → Vercel → Appwrite

### FASE 1: Git (sin cambios de código)
1. Crear nuevo repo en GitHub (usando PAT del user)
2. `git remote set-url origin <nuevo-repo-url>`
3. `git push -u origin main`

### FASE 2: Vercel (apuntando al Appwrite viejo)
1. Crear cuenta/proyecto en Vercel
2. Importar repo desde GitHub
3. Configurar env vars (mismas que Netlify):
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
   - `APPWRITE_API_KEY`
4. Eliminar `netlify.toml`
5. Deploy y verificar

### FASE 3: Appwrite (lo más complejo)
1. Crear nuevo proyecto en Appwrite Cloud
2. Anotar: Project ID, Database ID, crear API Key
3. Ejecutar `npx tsx scripts/migrate-create-all.ts` — crea 34 colecciones + 3 buckets
4. Ejecutar `npx tsx scripts/migrate-data-live.ts` — migra ~5,432 documentos
5. Ejecutar `npx tsx scripts/migrate-seed-docs.ts` — crea documentos semilla
6. Actualizar credenciales en código (ver sección 3)
7. Actualizar env vars en Vercel
8. Redeploy y verificar

---

## 3. Archivos que Contienen Credenciales (Actualizar)

### 🔴 CRÍTICO — Hardcodeadas (DEBEN cambiarse)
| # | Archivo | Qué contiene |
|---|---------|---------------|
| 1 | `src/lib/appwrite.ts` | Endpoint, Project ID, Database ID (fallbacks) |
| 2 | `src/lib/appwrite-admin.ts` | Endpoint, Project ID, Database ID (fallbacks) |
| 3 | `src/lib/appwrite-server.ts` | Endpoint, Project ID, Database ID, API Key (hardcodeados) |
| 4 | `src/app/api/template/route.ts` | Endpoint, Project ID, Database ID, API Key |
| 5 | `src/app/api/theme-config/route.ts` | Endpoint, Project ID, Database ID, API Key |
| 6 | `src/app/api/version/route.ts` | Endpoint, Project ID, Database ID, API Key |
| 7 | `src/app/api/init-theme-config/route.ts` | ⚠️ CUENTA ANTIGUA muerta |
| 8 | `appwrite.json` | Project ID, endpoint |

### 🟡 Leen de .env.local (basta cambiar .env.local)
- Todos los archivos que usan `process.env.NEXT_PUBLIC_APPWRITE_*` o `process.env.APPWRITE_API_KEY`

### Scripts de migración (REEMPLAZAR placeholders)
| Script | Placeholder |
|--------|-------------|
| `scripts/migrate-create-all.ts` | `REEMPLAZAR_PROJECT_ID`, `REEMPLAZAR_DATABASE_ID`, `REEMPLAZAR_API_KEY` |
| `scripts/migrate-data-live.ts` | `REEMPLAZAR_PROJECT_ID`, `REEMPLAZAR_DATABASE_ID`, `REEMPLAZAR_API_KEY` |
| `scripts/migrate-seed-docs.ts` | `REEMPLAZAR_PROJECT_ID`, `REEMPLAZAR_DATABASE_ID`, `REEMPLAZAR_API_KEY` |

---

## 4. Scripts Actualizados (Jun 2026)

| Script | Uso | Estado |
|--------|-----|--------|
| `scripts/migrate-create-all.ts` | Crear 34 colecciones + 3 buckets | ✅ NUEVO |
| `scripts/migrate-data-live.ts` | Migrar ~5,432 documentos | ✅ NUEVO |
| `scripts/migrate-seed-docs.ts` | Crear documentos semilla | ✅ NUEVO |
| `scripts/schema-dump-live.json` | Schema real exportado del original | ✅ NUEVO |
| `scripts/migrate-to-new-project.ts` | Script antiguo (deprecado) | ⚠️ Reemplazado |
| `scripts/migrate-create-collections.ts` | Script antiguo (deprecado) | ⚠️ Reemplazado |
| `scripts/migrate-data.ts` | Script antiguo (deprecado) | ⚠️ Reemplazado |

---

## 5. Checklist de Verificación Post-Migración

- [ ] Homepage carga con plantilla correcta
- [ ] Login funciona (crear cuenta nueva)
- [ ] Productos se ven (701 docs migrados)
- [ ] Categorías funcionan (19 + 22 subcats)
- [ ] Carrito funciona
- [ ] Checkout funciona (orders)
- [ ] Admin panel funciona
- [ ] Theme editor funciona
- [ ] Notificaciones funcionan (313 docs)
- [ ] Favoritos funcionan (145 docs)
- [ ] Stock alerts funcionan (86 docs)
- [ ] Admin chat funciona (109 docs)
- [ ] Page views tracking funciona
- [ ] WhatsApp button funciona
- [ ] Storage de imágenes funciona (buckets)
