import type { Category, Subcategory, Product } from '@/types';

/**
 * Datos ficticios para edición de Plantilla 23 (sin Appwrite).
 * - IDs estables para que links / productos funcionen “como si”
 * - Relaciones Category -> Subcategory -> Product
 */
export function getTpl23MockData(): {
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
} {
  const categories: Category[] = [
    { $id: 'cat-skin', name: 'Skincare', order: 1, iconUrl: 'https://placehold.co/600x600/png?text=Skincare' },
    { $id: 'cat-make', name: 'Maquillaje', order: 2, iconUrl: 'https://placehold.co/600x600/png?text=Makeup' },
    { $id: 'cat-hair', name: 'Cabello', order: 3, iconUrl: 'https://placehold.co/600x600/png?text=Hair' },
    { $id: 'cat-body', name: 'Cuerpo', order: 4, iconUrl: 'https://placehold.co/600x600/png?text=Body' },
    { $id: 'cat-frag', name: 'Fragancias', order: 5, iconUrl: 'https://placehold.co/600x600/png?text=Fragancias' },
    { $id: 'cat-sale', name: 'Ofertas', order: 6, iconUrl: 'https://placehold.co/600x600/png?text=Sale' },
  ];

  const subcategories: Subcategory[] = [
    { $id: 'sub-skin-1', name: 'Limpiadores', categoryId: 'cat-skin', order: 1 },
    { $id: 'sub-skin-2', name: 'Serums', categoryId: 'cat-skin', order: 2 },
    { $id: 'sub-skin-3', name: 'Cremas', categoryId: 'cat-skin', order: 3 },

    { $id: 'sub-make-1', name: 'Base', categoryId: 'cat-make', order: 1 },
    { $id: 'sub-make-2', name: 'Labios', categoryId: 'cat-make', order: 2 },
    { $id: 'sub-make-3', name: 'Ojos', categoryId: 'cat-make', order: 3 },

    { $id: 'sub-hair-1', name: 'Shampoo', categoryId: 'cat-hair', order: 1 },
    { $id: 'sub-hair-2', name: 'Acondicionador', categoryId: 'cat-hair', order: 2 },
    { $id: 'sub-hair-3', name: 'Tratamientos', categoryId: 'cat-hair', order: 3 },

    { $id: 'sub-body-1', name: 'Hidratación', categoryId: 'cat-body', order: 1 },
    { $id: 'sub-body-2', name: 'Exfoliación', categoryId: 'cat-body', order: 2 },
    { $id: 'sub-body-3', name: 'Protección', categoryId: 'cat-body', order: 3 },

    { $id: 'sub-frag-1', name: 'EDP', categoryId: 'cat-frag', order: 1 },
    { $id: 'sub-frag-2', name: 'EDT', categoryId: 'cat-frag', order: 2 },

    { $id: 'sub-sale-1', name: '2x1', categoryId: 'cat-sale', order: 1 },
    { $id: 'sub-sale-2', name: 'Últimas unidades', categoryId: 'cat-sale', order: 2 },
  ];

  // Generador simple (para tener volumen sin escribir 200 productos a mano)
  const mkProduct = (i: number, opts: { name: string; cid: string; sid: string; price: number }) =>
    ({
      $id: `mock-prod-${i}`,
      NAME: opts.name,
      DESCRIPTION: 'Producto ficticio para edición (sin Appwrite).',
      PRICE: opts.price,
      CATEGORYID: opts.cid,
      SUBCATEGORYID: opts.sid,
      SELLERID: 'mock-seller',
      STOCK: 999,
      IMAGEURL: `https://placehold.co/900x1200/png?text=${encodeURIComponent(opts.name)}`,
      SOLDQUANTITY: Math.floor(Math.random() * 2000),
      ISACTIVE: true,
    }) as unknown as Product;

  const products: Product[] = [];
  let n = 1;

  // Skincare (más productos para que salga top en menú)
  for (const [sid, baseName] of [
    ['sub-skin-1', 'Limpiador'],
    ['sub-skin-2', 'Serum'],
    ['sub-skin-3', 'Crema'],
  ] as const) {
    for (let i = 0; i < 18; i++) {
      products.push(mkProduct(n++, { name: `${baseName} ${i + 1}`, cid: 'cat-skin', sid, price: 5900 + i * 250 }));
    }
  }

  // Maquillaje
  for (const [sid, baseName] of [
    ['sub-make-1', 'Base'],
    ['sub-make-2', 'Labial'],
    ['sub-make-3', 'Mascara'],
  ] as const) {
    for (let i = 0; i < 10; i++) {
      products.push(mkProduct(n++, { name: `${baseName} ${i + 1}`, cid: 'cat-make', sid, price: 7900 + i * 300 }));
    }
  }

  // Cabello
  for (const [sid, baseName] of [
    ['sub-hair-1', 'Shampoo'],
    ['sub-hair-2', 'Acondicionador'],
    ['sub-hair-3', 'Tratamiento'],
  ] as const) {
    for (let i = 0; i < 8; i++) {
      products.push(mkProduct(n++, { name: `${baseName} ${i + 1}`, cid: 'cat-hair', sid, price: 6900 + i * 220 }));
    }
  }

  // Cuerpo
  for (const [sid, baseName] of [
    ['sub-body-1', 'Body Lotion'],
    ['sub-body-2', 'Exfoliante'],
    ['sub-body-3', 'Protector'],
  ] as const) {
    for (let i = 0; i < 6; i++) {
      products.push(mkProduct(n++, { name: `${baseName} ${i + 1}`, cid: 'cat-body', sid, price: 6500 + i * 200 }));
    }
  }

  // Fragancias
  for (const [sid, baseName] of [
    ['sub-frag-1', 'Perfume EDP'],
    ['sub-frag-2', 'Perfume EDT'],
  ] as const) {
    for (let i = 0; i < 6; i++) {
      products.push(mkProduct(n++, { name: `${baseName} ${i + 1}`, cid: 'cat-frag', sid, price: 15900 + i * 500 }));
    }
  }

  // Ofertas
  for (const [sid, baseName] of [
    ['sub-sale-1', 'Promo'],
    ['sub-sale-2', 'Últimas'],
  ] as const) {
    for (let i = 0; i < 10; i++) {
      products.push(mkProduct(n++, { name: `${baseName} ${i + 1}`, cid: 'cat-sale', sid, price: 3900 + i * 150 }));
    }
  }

  // Orden consistente de categorías
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));

  return { categories, subcategories, products };
}

