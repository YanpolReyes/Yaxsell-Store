const https = require('https');
const API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';
const PROJECT = '6a0a4e8d0032177f3f90';
const DB = '6a0a58ca001798410d86';

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      path: `/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT,
        'X-Appwrite-Key': API_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log(`${method} ${path.split('?')[0]} → ${res.statusCode}`);
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function addStringAttr(collectionId, key, size, required = false) {
  return apiCall('POST', `/databases/${DB}/collections/${collectionId}/attributes/string`, {
    key, size, required, default: null,
  });
}

async function addFloatAttr(collectionId, key, required = false) {
  return apiCall('POST', `/databases/${DB}/collections/${collectionId}/attributes/float`, {
    key, required, default: null,
  });
}

async function main() {
  console.log('\n📦 Adding geo attributes to page_views...\n');

  const r1 = await addStringAttr('page_views', 'IP', 45);
  console.log('  IP:', r1.status === 202 ? '✅' : '❌', r1.data?.message || '');

  const r2 = await addStringAttr('page_views', 'COMUNA', 128);
  console.log('  COMUNA:', r2.status === 202 ? '✅' : '❌', r2.data?.message || '');

  const r3 = await addStringAttr('page_views', 'REGION', 128);
  console.log('  REGION:', r3.status === 202 ? '✅' : '❌', r3.data?.message || '');

  const r4 = await addFloatAttr('page_views', 'LAT');
  console.log('  LAT:', r4.status === 202 ? '✅' : '❌', r4.data?.message || '');

  const r5 = await addFloatAttr('page_views', 'LNG');
  console.log('  LNG:', r5.status === 202 ? '✅' : '❌', r5.data?.message || '');

  console.log('\n📋 Adding indexes...');
  const idx1 = await apiCall('POST', `/databases/${DB}/collections/page_views/indexes`, {
    key: 'idx_page_date', type: 'key', attributes: ['PAGE', 'DATE'], orders: ['ASC', 'ASC'],
  });
  console.log('  idx_page_date:', idx1.status === 202 ? '✅' : idx1.data?.message || idx1.status);

  const idx2 = await apiCall('POST', `/databases/${DB}/collections/page_views/indexes`, {
    key: 'idx_ip_date', type: 'key', attributes: ['IP', 'DATE'], orders: ['ASC', 'ASC'],
  });
  console.log('  idx_ip_date:', idx2.status === 202 ? '✅' : idx2.data?.message || idx2.status);

  console.log('\n⏳ Wait ~30s for Appwrite to process.');
}

main().catch(console.error);
