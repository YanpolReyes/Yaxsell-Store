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

async function main() {
  console.log('\n📦 Adding USER_NAME to page_views...\n');
  const r = await addStringAttr('page_views', 'USER_NAME', 256);
  console.log('  USER_NAME:', r.status === 202 ? '✅' : '❌', r.data?.message || '');
  console.log('\n⏳ Wait ~30s for Appwrite to process.');
}

main().catch(console.error);
