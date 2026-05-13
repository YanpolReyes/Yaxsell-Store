# Colección store_settings en Appwrite

## Información de la colección

**Nombre de la colección:** `store_settings`

**Database ID:** `67f1dc940037b3d367bb`

**Endpoint:** `https://nyc.cloud.appwrite.io/v1`

**Project ID:** `698f6de50012f9df7ebd`

---

## Atributos de la colección (UPPERCASE)

Crear los siguientes atributos en Appwrite Console:

### 1. STORENAME
- **Tipo:** String
- **Tamaño:** 255
- **Requerido:** No
- **Default:** (vacío)
- **Descripción:** Nombre de la tienda

### 2. PHONE
- **Tipo:** String
- **Tamaño:** 50
- **Requerido:** No
- **Default:** (vacío)
- **Descripción:** Teléfono de contacto

### 3. EMAIL
- **Tipo:** String
- **Tamaño:** 255
- **Requerido:** No
- **Default:** (vacío)
- **Descripción:** Email de contacto

### 4. ADDRESS
- **Tipo:** String
- **Tamaño:** 500
- **Requerido:** No
- **Default:** (vacío)
- **Descripción:** Dirección o zona de despacho

### 5. WEBSITE
- **Tipo:** String
- **Tamaño:** 500
- **Requerido:** No
- **Default:** (vacío)
- **Descripción:** Sitio web de la tienda

### 6. DESCRIPTION
- **Tipo:** String
- **Tamaño:** 1000
- **Requerido:** No
- **Default:** (vacío)
- **Descripción:** Descripción breve de la tienda

### 7. SHOWINANNOUNCEMENTBAR
- **Tipo:** Boolean
- **Requerido:** No
- **Default:** false
- **Descripción:** Mostrar datos de contacto en la barra de anuncios

---

## Permisos

Configurar los siguientes permisos en la colección:

### Read (Lectura)
- ✅ `Any` - Permitir lectura pública para que la tienda pueda mostrar los datos

### Create (Crear)
- ✅ `users` - Solo usuarios autenticados pueden crear

### Update (Actualizar)
- ✅ `users` - Solo usuarios autenticados pueden actualizar

### Delete (Eliminar)
- ✅ `users` - Solo usuarios autenticados pueden eliminar

---

## Notas importantes

1. **Solo debe existir UN documento** en esta colección (configuración única de la tienda)
2. Los nombres de los atributos DEBEN estar en **UPPERCASE** para mantener consistencia con otras colecciones
3. La colección se usa en:
   - `/admin/store-settings` - Panel de administración para editar datos
   - `AnnouncementBar.tsx` - Componente que muestra los datos en la barra superior

---

## Ejemplo de documento

```json
{
  "$id": "unique()",
  "STORENAME": "JoyPerfumes",
  "PHONE": "+569 98393507",
  "EMAIL": "joyperfumesstgo@gmail.com",
  "ADDRESS": "Despachos a todo Chile",
  "WEBSITE": "https://joyperfumes.com",
  "DESCRIPTION": "Perfumes originales y de calidad",
  "SHOWINANNOUNCEMENTBAR": true
}
```

---

## Pasos para crear la colección en Appwrite Console

1. Ir a https://nyc.cloud.appwrite.io/console
2. Seleccionar el proyecto con ID: `698f6de50012f9df7ebd`
3. Ir a "Databases" → Seleccionar database `67f1dc940037b3d367bb`
4. Click en "Create Collection"
5. Nombre: `store_settings`
6. Collection ID: Dejar que Appwrite lo genere automáticamente
7. Crear cada uno de los 7 atributos listados arriba
8. Configurar los permisos según lo especificado
9. Guardar la colección

---

## Verificación

Después de crear la colección:

1. Ir a `/admin/store-settings` en la aplicación
2. Llenar el formulario con los datos de la tienda
3. Activar el toggle "Mostrar en barra de anuncios"
4. Guardar
5. Ir a la página principal de la tienda
6. Verificar que los datos aparezcan en la barra superior a la izquierda
