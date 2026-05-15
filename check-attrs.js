const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('698f6de50012f9df7ebd')
    .setKey('standard_ea10b9d7d4414fec61778bdc7f569b0de82bb3aca157f5949bbb8c7320b379f12e15649cae18dc0512f75fd8d575dd5f59058125598e0a0491fa9ea9760ff67b2f792df372b838bf5bd1a9acfef29f201ccb20105285ee2787343eebf89234a4b0a6977ae7447cc5d9c0742d0f9d364d03730c97261748a019bf592ce7cd2025');

const databases = new Databases(client);

async function check() {
    try {
        const attrs = await databases.listAttributes('67f1dc940037b3d367bb', 'discount_coupons');
        console.log(attrs.attributes.map(a => `${a.key} (${a.type}) - Required: ${a.required}`).join('\n'));
    } catch (e) { console.error(e); }
}
check();
