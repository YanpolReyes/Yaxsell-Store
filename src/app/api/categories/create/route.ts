import { NextRequest, NextResponse } from 'next/server';
import { ID } from 'appwrite';
import { getAppwriteConfig, getServices, CATEGORIES_COLLECTION_ID } from '@/lib/appwrite-admin';

export async function POST(req: NextRequest) {
  try {
    const { name, description, icon, parentId } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'name es requerido' },
        { status: 400 }
      );
    }

    const cfg = getAppwriteConfig();
    const { databases } = getServices();

    const data: Record<string, unknown> = {
      name: name.trim(),
      description: description || '',
      icon: icon || '',
    };
    if (parentId) data.parentId = parentId;

    const result = await databases.createDocument(
      cfg.databaseId,
      CATEGORIES_COLLECTION_ID,
      ID.unique(),
      data
    );

    return NextResponse.json({
      success: true,
      category: result,
      message: `Categoría "${name}" creada exitosamente`,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear la categoría' },
      { status: 500 }
    );
  }
}
