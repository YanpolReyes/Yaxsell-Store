import { NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '698f6de50012f9df7ebd';
const DATABASE_ID = '67f1dc940037b3d367bb';
const API_KEY = 'standard_ea10b9d7d4414fec61778bdc7f569b0de82bb3aca157f5949bbb8c7320b379f12e15649cae18dc0512f75fd8d575dd5f59058125598e0a0491fa9ea9760ff67b2f792df372b838bf5bd1a9acfef29f201ccb20105285ee2787343eebf89234a4b0a6977ae7447cc5d9c0742d0f9d364d03730c97261748a019bf592ce7cd2025';

export async function GET() {
  const collectionId = 'theme_config';
  const docId = 'homepage_sections';
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
  };
  
  try {
    // Intentar leer el documento
    const getRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${docId}`, {
      method: 'GET',
      headers,
    });
    
    if (getRes.ok) {
      const existing = await getRes.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Theme config ya existe',
        document: existing 
      });
    }
    
    // Documento no existe, crearlo con permisos públicos
    const createRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        documentId: docId,
        data: { sections: '[]' },
        $read: ['role:all'],
        $write: ['role:all'],
      }),
    });
    
    if (createRes.ok) {
      const newDoc = await createRes.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Theme config creado exitosamente',
        document: newDoc 
      });
    }
    
    const createErr = await createRes.json();
    
    // Si la colección no existe, dar instrucciones
    if (createErr.code === 404) {
      return NextResponse.json({ 
        success: false, 
        error: 'Colección theme_config no existe',
        instructions: {
          collectionId: 'theme_config',
          name: 'Theme Configuration',
          attributes: [
            { key: 'sections', type: 'string', size: 100000, required: false }
          ],
          permissions: { read: ['role:all'], write: ['role:all'] }
        }
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: createErr.message || 'Error creando documento' 
    }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Error desconocido' 
    }, { status: 500 });
  }
}
