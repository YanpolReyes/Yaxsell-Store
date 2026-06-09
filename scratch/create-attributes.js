const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6a0a4e8d0032177f3f90')
    .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');

const databases = new Databases(client);
const databaseId = '6a0a58ca001798410d86';

async function createAttributes() {
    try {
        console.log('Creating new Appwrite attributes for Level-3 categories hierarchy...');

        const createAttr = async (collectionId, key, size, required) => {
            try {
                await databases.createStringAttribute(databaseId, collectionId, key, size, required);
                console.log(`Successfully requested creation of string attribute "${key}" in collection "${collectionId}"`);
            } catch (e) {
                if (e.code === 409) {
                    console.log(`Attribute "${key}" already exists in collection "${collectionId}"`);
                } else {
                    console.error(`Error creating "${key}" in "${collectionId}":`, e.message);
                }
            }
        };

        // 1. parentSubcategoryId in subcategories
        await createAttr('subcategories', 'parentSubcategoryId', 255, false);

        // 2. SUBSUBCATEGORYID in products
        await createAttr('products', 'SUBSUBCATEGORYID', 36, false);

        console.log('Appwrite attributes request completed.');
    } catch (err) {
        console.error('Fatal error setting up attributes:', err);
    }
}

createAttributes();
