# Plan de Migración Appwrite - Yaxsel Web Store

## Motivación
La cuenta actual de Appwrite ha alcanzado el límite de cuota ("Database reads limit exceeded"). Ni la API ni el dashboard son accesibles. Es necesario crear una nueva cuenta desde cero basándose en la estructura del código fuente.

## Configuración Actual
- Endpoint: https://nyc.cloud.appwrite.io/v1
- Project ID: 698f6de50012f9df7ebd
- Database ID: 67f1dc940037b3d367bb

## Recursos a Migrar

### Colecciones (26 colecciones)
Basado en src/lib/appwrite-admin.ts:

1. products
2. categories
3. subcategories
4. banners
5. orders
6. users
7. notifications
8. timed_offers
9. live_streams
10. support_tickets
11. sequences
12. stock_movements
13. fcm_tokens
14. order_status_history
15. discount_coupons
16. points_store_items
17. wholesale_requests
18. reviews
19. favorites
20. clips
21. live_raffles
22. raffle_participants
23. stock_alerts
24. addresses
25. apertura_settings
26. product_votes

### Colecciones adicionales (según código)
- banner_overlay_positions
- house_product_positions
- hotspot_panels
- theme_config

### Storage Buckets (5 buckets)
Basado en código:
1. products (ID: 67f41e05000d0adb6f12)
2. banners
3. categories-icons
4. comprobantes
5. live-thumbnails (reutilizado para user-photos)

## Plan de Migración

### Fase 1: Preparación (Antes de migrar)

#### 1.1 Crear nueva cuenta Appwrite
- [ ] Crear cuenta en appwrite.io
- [ ] Crear nuevo proyecto
- [ ] Crear nueva base de datos
- [ ] Generar nuevo API Key
- [ ] Documentar nuevas credenciales:
  - Endpoint
  - Project ID
  - Database ID
  - API Key

#### 1.2 Documentar estructura desde código fuente
**IMPORTANTE:** No se puede acceder a la cuenta actual (API ni dashboard) debido al límite de cuota.
Se debe inferir la estructura de las colecciones analizando el código fuente.

**Colecciones y atributos conocidos del código:**

1. **products** - Atributos inferidos del código:
   - NAME (string)
   - DESCRIPTION (string)
   - PRICE (integer)
   - STOCK (integer)
   - CURRENTPRICE (integer)
   - SOLDQUANTITY (integer)
   - CATEGORYID (string)
   - SUBCATEGORYID (string)
   - IMAGEURL (string)
   - FEATURES (string)
   - CREATEDAT (integer)
   - UPDATEDAT (integer)

2. **categories** - Atributos inferidos:
   - NAME (string)
   - DESCRIPTION (string)
   - IMAGEURL (string)
   - DISPLAYORDER (integer)
   - CREATEDAT (integer)

3. **subcategories** - Atributos inferidos:
   - NAME (string)
   - CATEGORYID (string)
   - DISPLAYORDER (integer)

4. **banners** - Atributos inferidos:
   - TITLE (string)
   - IMAGEURL (string)
   - LINKURL (string)
   - DISPLAYORDER (integer)
   - ISACTIVE (boolean)

5. **orders** - Atributos inferidos:
   - ORDERID (string)
   - USERID (string)
   - TOTAL (integer)
   - STATUS (string)
   - CREATEDAT (integer)
   - ITEMS (array/object)
   - SHIPPINGADDRESS (object)

6. **users** - Atributos inferidos de users-db.ts:
   - userId (string)
   - email (string)
   - name (string)
   - phone (string)
   - createdAt (string)

7. **notifications** - Atributos inferidos:
   - TYPE (string)
   - TITLE (string)
   - MESSAGE (string)
   - USERID (string)
   - isRead (boolean)
   - CREATEDAT (integer)

8. **timed_offers** - Atributos inferidos:
   - PRODUCTID (string)
   - DISCOUNTPERCENT (integer)
   - STARTDATE (integer)
   - ENDDATE (integer)
   - ISACTIVE (boolean)

9. **live_streams** - Atributos inferidos:
   - TITLE (string)
   - STREAMURL (string)
   - THUMBNAILURL (string)
   - ISLIVE (boolean)
   - VIEWERCOUNT (integer)

10. **support_tickets** - Atributos inferidos:
    - SUBJECT (string)
    - MESSAGE (string)
    - USERID (string)
    - STATUS (string)
    - CREATEDAT (integer)

11. **sequences** - Atributos inferidos:
    - KEY (string)
    - VALUE (integer)

12. **stock_movements** - Atributos inferidos:
    - PRODUCTID (string)
    - QUANTITY (integer)
    - TYPE (string)
    - CREATEDAT (integer)

13. **fcm_tokens** - Atributos inferidos:
    - USERID (string)
    - TOKEN (string)
    - CREATEDAT (integer)

14. **order_status_history** - Atributos inferidos:
    - ORDERID (string)
    - STATUS (string)
    - CREATEDAT (integer)
    - NOTES (string)

15. **discount_coupons** - Atributos inferidos:
    - CODE (string)
    - DISCOUNTPERCENT (integer)
    - MINPURCHASE (integer)
    - MAXUSES (integer)
    - USESCOUNT (integer)
    - EXPIRESAT (integer)
    - ISACTIVE (boolean)

16. **points_store_items** - Atributos inferidos:
    - NAME (string)
    - DESCRIPTION (string)
    - POINTSCOST (integer)
    - IMAGEURL (string)
    - ISACTIVE (boolean)

17. **wholesale_requests** - Atributos inferidos:
    - USERID (string)
    - COMPANYNAME (string)
    - RUT (string)
    - EMAIL (string)
    - PHONE (string)
    - STATUS (string)
    - CREATEDAT (integer)

18. **reviews** - Atributos inferidos:
    - PRODUCTID (string)
    - USERID (string)
    - RATING (integer)
    - COMMENT (string)
    - CREATEDAT (integer)

19. **favorites** - Atributos inferidos:
    - USERID (string)
    - PRODUCTID (string)
    - CREATEDAT (integer)

20. **clips** - Atributos inferidos:
    - TITLE (string)
    - VIDEOURL (string)
    - THUMBNAILURL (string)
    - CREATEDAT (integer)

21. **live_raffles** - Atributos inferidos:
    - TITLE (string)
    - DESCRIPTION (string)
    - ENDDATE (integer)
    - ISACTIVE (boolean)

22. **raffle_participants** - Atributos inferidos:
    - RAFFLEID (string)
    - USERID (string)
    - PARTICIPATEDAT (integer)

23. **stock_alerts** - Atributos inferidos:
    - PRODUCTID (string)
    - USERID (string)
    - CREATEDAT (integer)

24. **addresses** - Atributos inferidos de addresses.ts:
    - userId (string)
    - name (string)
    - address (string)
    - city (string)
    - region (string)
    - phone (string)
    - isDefault (boolean)

25. **apertura_settings** - Atributos conocidos de apertura-promo.ts:
    - isActive (boolean)
    - discountPercent (integer)
    - minPurchase (integer)
    - createdAt (string)
    - updatedAt (string)

26. **product_votes** - Atributos conocidos de product-votes route:
    - PRODUCTTITLE (string, required, size: 256)
    - USERID (string, optional, size: 256)
    - USERNAME (string, required, size: 256)
    - USEREMAIL (string, optional, size: 256)
    - CREATEDAT (integer, required)
    - IPADDRESS (string, required, size: 256)

27. **banner_overlay_positions** - Atributos conocidos:
    - BANNERID (string, required)
    - PRODUCTID (string, required)
    - POSITIONX (float, required)
    - POSITIONY (float, required)
    - SCALE (float, default: 1.0)
    - CIRCLESCALE (float, default: 1.0)
    - DISPLAYTYPE (string, default: "default")
    - CUSTOMIMAGEURL (string)
    - CIRCLECOLOR (string, default: "#ffffff")
    - ISACTIVE (boolean, default: true)
    - DISPLAYORDER (integer, default: 0)
    - CLICKS (integer, default: 0)

28. **house_product_positions** - Atributos conocidos:
    - PRODUCTID (string, required)
    - CATEGORYID (string, default: "")
    - POSITIONX (float, required)
    - POSITIONY (float, required)
    - ISACTIVE (boolean, default: true)
    - DISPLAYORDER (integer, default: 0)
    - SCALE (float, default: 1.0)
    - CIRCLESCALE (float, default: 1.0)
    - CUSTOMIMAGEURL (string)
    - DISPLAYTYPE (string, default: "default")
    - CIRCLECOLOR (string, default: "#3483fa")
    - BACKGROUND (string, default: "house3")

29. **hotspot_panels** - Atributos conocidos:
    - IMAGEURL (string, required)
    - TITLE (string)
    - LINKURL (string)
    - MOSAICGROUP (string, default: "main")
    - CELLINDEX (integer, default: 0)
    - ISACTIVE (boolean, default: true)
    - DISPLAYORDER (integer, default: 0)

30. **theme_config** - Atributos conocidos de section-config.ts:
    - Configuración JSON de secciones del homepage

### Fase 2: Crear Infraestructura en Nueva Cuenta

#### 2.1 Crear Storage Buckets
- [ ] products
- [ ] banners
- [ ] categories-icons
- [ ] comprobantes
- [ ] live-thumbnails

#### 2.2 Crear Colecciones
Crear cada colección con sus atributos correspondientes según la documentación de Fase 1.2.

### Fase 3: Migración de Datos

#### 3.1 Migrar Storage Buckets
**Script para migrar archivos:**
```typescript
// migration-script.ts
import { Client, Storage } from 'appwrite';

const oldClient = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('698f6de50012f9df7ebd');

const newClient = new Client()
  .setEndpoint('NUEVO_ENDPOINT')
  .setProject('NUEVO_PROJECT_ID');

const oldStorage = new Storage(oldClient);
const newStorage = new Storage(newClient);

async function migrateBucket(bucketId: string) {
  // Listar archivos
  const files = await oldStorage.listFiles(bucketId);
  
  for (const file of files.files) {
    // Descargar archivo
    const fileData = await oldStorage.getFileDownload(bucketId, file.$id);
    
    // Subir a nuevo bucket
    await newStorage.createFile(bucketId, file.$id, fileData);
  }
}
```

#### 3.2 Migrar Colecciones
**Script para migrar documentos:**
```typescript
// migration-script.ts
import { Client, Databases, ID } from 'appwrite';

const oldClient = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('698f6de50012f9df7ebd');

const newClient = new Client()
  .setEndpoint('NUEVO_ENDPOINT')
  .setProject('NUEVO_PROJECT_ID');

const oldDb = new Databases(oldClient);
const newDb = new Databases(newClient);

const OLD_DB_ID = '67f1dc940037b3d367bb';
const NEW_DB_ID = 'NUEVO_DATABASE_ID';

async function migrateCollection(collectionId: string) {
  // Listar todos los documentos
  let documents = [];
  let cursor = undefined;
  
  do {
    const response = await oldDb.listDocuments(OLD_DB_ID, collectionId, [
      Query.limit(100),
      ...(cursor ? [Query.cursorAfter(cursor)] : [])
    ]);
    
    documents = documents.concat(response.documents);
    cursor = response.documents[response.documents.length - 1]?.$id;
  } while (documents.length < response.total);
  
  // Migrar documentos
  for (const doc of documents) {
    const { $id, $createdAt, $updatedAt, $permissions, ...data } = doc;
    
    try {
      await newDb.createDocument(NEW_DB_ID, collectionId, $id, data);
    } catch (e) {
      // Si ya existe, actualizar
      await newDb.updateDocument(NEW_DB_ID, collectionId, $id, data);
    }
  }
}
```

### Fase 4: Actualizar Configuración en Código

#### 4.1 Archivos a modificar

**src/lib/appwrite-server.ts:**
```typescript
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'NUEVO_ENDPOINT';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'NUEVO_PROJECT_ID';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'NUEVO_DATABASE_ID';
const API_KEY = process.env.APPWRITE_API_KEY || 'NUEVO_API_KEY';
```

**.env.local:**
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=NUEVO_ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID=NUEVO_PROJECT_ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=NUEVO_DATABASE_ID
APPWRITE_API_KEY=NUEVO_API_KEY
```

**src/lib/appwrite-admin.ts:**
- Actualizar DEFAULT_CONFIG con nuevas credenciales

#### 4.2 Actualizar localStorage
El sistema usa localStorage para configuración dinámica (`yaxsel_appwrite_config`). 
Los usuarios existentes necesitarán actualizar manualmente o el sistema debe tener un mecanismo de migración automática.

### Fase 5: Testing

#### 5.1 Testing funcional
- [ ] Login/registro de usuarios
- [ ] Listado de productos
- [ ] Creación de pedidos
- [ ] Carga de imágenes
- [ ] Dashboard admin
- [ ] Todas las funcionalidades principales

#### 5.2 Testing de datos
- [ ] Verificar integridad de datos migrados
- [ ] Verificar que todas las imágenes se cargan
- [ ] Verificar que las relaciones entre colecciones funcionan

### Fase 6: Deploy

#### 6.1 Preparación
- [ ] Backup completo de datos actuales
- [ ] Notificar a usuarios sobre mantenimiento programado
- [ ] Preparar rollback plan

#### 6.2 Ejecución
- [ ] Poner sitio en modo mantenimiento
- [ ] Actualizar variables de entorno
- [ ] Deploy del código actualizado
- [ ] Verificar que todo funciona
- [ ] Quitar modo mantenimiento

## Riesgos y Mitigaciones

### Riesgo 1: Pérdida de datos durante migración
**Mitigación:**
- Backup completo antes de migrar
- Validar datos después de migración
- Mantener cuenta antigua hasta que se verifique todo funciona

### Riesgo 2: Downtime prolongado
**Mitigación:**
- Estimar tiempo de migración (2-6 horas)
- Programar migración en horario de menor tráfico
- Comunicar claramente a usuarios

### Riesgo 3: Errores en configuración
**Mitigación:**
- Testing exhaustivo en staging
- Documentar todos los cambios
- Tener plan de rollback

### Riesgo 4: Problemas con localStorage
**Mitigación:**
- Implementar mecanismo para detectar config antigua y actualizar automáticamente
- Forzar reconfiguración en el próximo login

## Tiempos Estimados

- Documentación de estructura: 2-4 horas
- Creación de infraestructura: 1-2 horas
- Migración de datos: 2-4 horas (dependiendo del volumen)
- Actualización de código: 1 hora
- Testing: 2-3 horas
- Deploy: 1 hora

**Total estimado: 9-15 horas**

## Errores encontrados y corregidos en el script original

1. **Permisos incorrectos**: Se usaba `write("any")` pero Appwrite requiere permisos separados: `create("any")`, `update("any")`, `delete("any")`
2. **products faltaba 20+ atributos**: IMAGEURL2-5, VIDEOURL, PRODUCT_VIDEO_URL, COST, WHOLESALEPRICE, WHOLESALEMINQUANTITY, TAGS, ISFEATURED, ISACTIVE, PACKQTY, RESTOCKTHRESHOLD, CUSTOM_PRIMARY_COLOR, CUSTOM_SECONDARY_COLOR, CUSTOM_USE_GRADIENT, CUSTOM_COVER_URL, jumpseller_id, SELLERID, RATING (double no integer)
3. **orders faltaba 15+ atributos**: ORDERCODE, ORDERINDEX, CUSTOMERNAME, CUSTOMEREMAIL, CUSTOMERRUT, CUSTOMERPHONE, REGION, COMUNA, ADDRESS, ADDITIONALINFO, ADDRESSPHOTOURL, SUBTOTAL, EXPIRESAT, AUTOCANCELENABLED, ORDERTYPE, EXTENSIONCOUNT, PURCHASEDFROMLIVE, COUPONCODE, DISCOUNTAMOUNT, CUSTOMERNOTE, ISGIFT, adminNotes
4. **banners faltaba**: DESCRIPTION, DURATION, CLICKS, VIEWS
5. **categories usaba UPPERCASE incorrecto**: Los campos reales son lowercase (name, iconUrl, order, color, BACKGROUND_IMAGE_URL)
6. **subcategories faltaba**: ORDER, ICON_URL, BACKGROUND_IMAGE_URL, ZOOM_BACKGROUND_IMAGE_URL, COLOR, description
7. **clips faltaba**: DESCRIPTION, PRODUCTID, PRODUCTNAME, PRODUCTPRICE, PRODUCTIMAGEURL, USERNAME, LIKES, VIEWS, ISACTIVE
8. **live_raffles faltaba**: PRIZE, PRIZEIMAGEURL, LIVESTREAMID, STATUS, PARTICIPANTS, WINNERID, WINNERNAME, MAXPARTICIPANTS, STARTSAT, ENDSAT
9. **reviews faltaba**: USERNAME, USERPROFILEIMAGEURL, REVIEWDATE, ISEDITED
10. **timed_offers**: Estructura completamente diferente a la inferida originalmente
11. **live_streams**: Estructura completamente diferente (title, url, platform, status, etc.)
12. **notifications**: Campos son lowercase (title, message, type, userId, isRead)
13. **support_tickets**: Campos son lowercase (userId, subject, message, status, priority, adminNotes)
14. **wholesale_requests faltaba**: adminNotes, rejectionReason
15. **discount_coupons**: Estructura diferente (type, value en vez de DISCOUNTPERCENT, etc.)
16. **RATING en products**: Es double, no integer
