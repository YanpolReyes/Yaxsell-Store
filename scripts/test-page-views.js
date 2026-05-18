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
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Check page_views
  const pv = await apiCall('GET', `/databases/${DB}/collections/page_views`);
  console.log('page_views:', JSON.stringify({ id: pv.$id, name: pv.name, enabled: pv.enabled, documentSecurity: pv.documentSecurity }, null, 2));

  // Check store_settings
  const ss = await apiCall('GET', `/databases/${DB}/collections/store_settings`);
  console.log('store_settings:', JSON.stringify({ id: ss.$id, name: ss.name, enabled: ss.enabled, documentSecurity: ss.documentSecurity }, null, 2));

  // Try to create a test document in page_views
  console.log('\n📝 Creating test document in page_views...');
  const testDoc = await apiCall('POST', `/databases/${DB}/collections/page_views/documents`, {
    documentId: 'unique()',
    data: { PAGE: '/test', DATE: '2026-05-18', VIEWS: 1 },
    permissions: ['read("any")', 'write("any")'],
  });
  console.log('Test doc result:', JSON.stringify(testDoc, null, 2));
}

main().catch(console.error);
