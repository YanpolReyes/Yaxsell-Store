// Script para exportar secciones de productos desde la cuenta vieja de Appwrite
// Las secciones están guardadas en FEATURES con formato "Section: X"

const OLD_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const OLD_PROJECT_ID = '698f6de50012f9df7ebd';
const OLD_DATABASE_ID = '67f1dc940037b3d367bb';
const OLD_API_KEY = 'standard_ea10b9d7d4414fec61778bdc7f569b0de82bb3aca157f5949bbb8c7320b379f12e15649cae18dc0512f75fd8d575dd5f59058125598e0a0491fa9ea9760ff67b2f792df372b838bf5bd1a9acfef29f201ccb20105285ee2787343eebf89234a4b0a6977ae7447cc5d9c0742d0f9d364d03730c97261748a019bf592ce7cd2025';

const PRODUCTS_COLLECTION = 'products';

const requestHeaders = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': OLD_PROJECT_ID,
  'X-Appwrite-Key': OLD_API_KEY,
};

async function apiCall(method: string, url: string, body?: any) {
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${url} → ${res.status}: ${text}`);
  }
  return res.json();
}

function extractSection(features: any): number | null {
  if (!features) return null;
  const text = typeof features === 'string' ? features : JSON.stringify(features);
  const match = text.match(/Section:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

async function exportSections() {
  console.log('📦 Exportando secciones de productos...');
  console.log(`📍 Endpoint: ${OLD_ENDPOINT}`);
  console.log(`🆔 Project: ${OLD_PROJECT_ID}`);
  console.log(`💾 Database: ${OLD_DATABASE_ID}`);

  try {
    // Listar todos los productos
    console.log('\n📋 Leyendo productos...');
    const allProducts: any[] = [];
    let cursor: string | undefined;

    while (true) {
      const queries = cursor ? [`cursorAfter("${cursor}")`, 'limit(100)'] : ['limit(100)'];
      const url = `${OLD_ENDPOINT}/databases/${OLD_DATABASE_ID}/collections/${PRODUCTS_COLLECTION}/documents?queries=${encodeURIComponent(queries.join('&'))}`;
      const res = await apiCall('GET', url);
      
      if (!res.documents || res.documents.length === 0) break;
      
      allProducts.push(...res.documents);
      cursor = res.documents[res.documents.length - 1].$id;
      
      console.log(`   📄 ${allProducts.length} productos leídos...`);
      
      if (res.documents.length < 100) break;
    }

    console.log(`\n✅ Total productos: ${allProducts.length}`);

    // Extraer secciones
    const sections: Record<string, number> = {};
    const productsWithSections: Array<{ $id: string; NAME: string; SKU: string; section: number | null }> = [];

    for (const p of allProducts) {
      const section = extractSection(p.FEATURES);
      
      // Obtener SKU de FEATURES o TAGS
      let sku = '';
      if (p.FEATURES) {
        const featuresText = typeof p.FEATURES === 'string' ? p.FEATURES : JSON.stringify(p.FEATURES);
        const skuMatch = featuresText.match(/SKU:\s*(.+)/i);
        if (skuMatch) sku = skuMatch[1].trim().split('\n')[0];
      }
      if (!sku && p.TAGS) {
        const tagParts = p.TAGS.split(',').map((t: string) => t.trim());
        sku = tagParts.find((t: string) => /^[A-Z0-9]{4,}$/i.test(t)) || '';
      }
      if (!sku) sku = p.jumpseller_id || '';

      if (section !== null) {
        sections[p.$id] = section;
        productsWithSections.push({
          $id: p.$id,
          NAME: p.NAME || '',
          SKU: sku,
          section,
        });
      }
    }

    console.log(`\n📊 Productos con secciones: ${productsWithSections.length}`);

    // Guardar en archivo JSON
    const output = {
      exportDate: new Date().toISOString(),
      totalProducts: allProducts.length,
      productsWithSections: productsWithSections.length,
      sections: productsWithSections,
    };

    const fs = require('fs');
    const outputPath = './sections-export.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Exportado a: ${outputPath}`);

    // También exportar CSV simple para fácil referencia
    const csvHeader = 'Product ID,Name,SKU,Section\n';
    const csvRows = productsWithSections.map(p => 
      `"${p.$id}","${p.NAME.replace(/"/g, '""')}","${p.SKU}",${p.section}`
    ).join('\n');
    fs.writeFileSync('./sections-export.csv', csvHeader + csvRows);
    console.log(`✅ Exportado a: ./sections-export.csv`);

    // Estadísticas
    const sectionCounts: Record<number, number> = {};
    for (const p of productsWithSections) {
      if (p.section !== null) {
        sectionCounts[p.section] = (sectionCounts[p.section] || 0) + 1;
      }
    }

    console.log('\n📈 Productos por sección:');
    for (let i = 1; i <= 36; i++) {
      const count = sectionCounts[i] || 0;
      if (count > 0) {
        console.log(`   Sección ${i}: ${count} productos`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

exportSections().then(() => {
  console.log('\n✨ Exportación completada');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
