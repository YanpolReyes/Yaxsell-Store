const sdk = require('node-appwrite');

const client = new sdk.Client();
const databases = new sdk.Databases(client);

client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('698f6de50012f9df7ebd')
    .setKey('standard_ea10b9d7d4414fec61778bdc7f569b0de82bb3aca157f5949bbb8c7320b379f12e15649cae18dc0512f75fd8d575dd5f59058125598e0a0491fa9ea9760ff67b2f792df372b838bf5bd1a9acfef29f201ccb20105285ee2787343eebf89234a4b0a6977ae7447cc5d9c0742d0f9d364d03730c97261748a019bf592ce7cd2025');

const DATABASE_ID = '67f1dc940037b3d367bb';
const COLLECTION_ID = 'store_settings';

async function createCollection() {
    try {
        console.log('🔨 Creando colección store_settings...');
        
        // Crear la colección
        const collection = await databases.createCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'store_settings',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ]
        );
        
        console.log('✅ Colección creada:', collection.$id);
        
        // Esperar un poco antes de crear atributos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Crear atributos
        console.log('\n📝 Creando atributos...');
        
        // 1. STORENAME
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'STORENAME',
            255,
            false
        );
        console.log('✅ Atributo STORENAME creado');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 2. PHONE
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'PHONE',
            50,
            false
        );
        console.log('✅ Atributo PHONE creado');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 3. EMAIL
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'EMAIL',
            255,
            false
        );
        console.log('✅ Atributo EMAIL creado');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 4. ADDRESS
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'ADDRESS',
            500,
            false
        );
        console.log('✅ Atributo ADDRESS creado');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 5. WEBSITE
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'WEBSITE',
            500,
            false
        );
        console.log('✅ Atributo WEBSITE creado');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 6. DESCRIPTION
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'DESCRIPTION',
            1000,
            false
        );
        console.log('✅ Atributo DESCRIPTION creado');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 7. SHOWINANNOUNCEMENTBAR
        await databases.createBooleanAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'SHOWINANNOUNCEMENTBAR',
            false,
            false
        );
        console.log('✅ Atributo SHOWINANNOUNCEMENTBAR creado');
        
        console.log('\n🎉 ¡Colección store_settings creada exitosamente con todos los atributos!');
        console.log('\n📋 Resumen:');
        console.log('   - Collection ID: store_settings');
        console.log('   - Database ID: 67f1dc940037b3d367bb');
        console.log('   - Atributos: 7 (STORENAME, PHONE, EMAIL, ADDRESS, WEBSITE, DESCRIPTION, SHOWINANNOUNCEMENTBAR)');
        console.log('   - Permisos: Read (any), Create/Update/Delete (users)');
        console.log('\n✨ Ahora puedes ir a /admin/store-settings para configurar tu tienda');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 409) {
            console.log('\n⚠️  La colección ya existe. Si quieres recrearla, elimínala primero desde Appwrite Console.');
        }
    }
}

createCollection();
