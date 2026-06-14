import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag');
  
  if (!tag) {
    return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
  }

  try {
    revalidateTag(tag);
    // Para asegurarnos de limpiar la mayoría de las cachés al mismo tiempo si se pide products
    if (tag === 'products') {
      revalidateTag('home');
      revalidateTag('catalog');
      revalidateTag('offers');
    }
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
