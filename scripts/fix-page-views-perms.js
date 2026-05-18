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
        console.log(`${method} ${path} → ${res.statusCode}`);
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Update page_views collection to allow any read/write
  console.log('\n🔧 Updating page_views permissions...');
  const pv = await apiCall('PATCH', `/databases/${DB}/collections/page_views`, {
    name: 'Page Views',
    enabled: true,
    documentSecurity: false,
  });
  console.log('Result:', JSON.stringify(pv, null, 2));

  // Update store_settings
  console.log('\n🔧 Updating store_settings permissions...');
  const ss = await apiCall('PATCH', `/databases/${DB}/collections/store_settings`, {
    name: 'Store Settings',
    enabled: true,
    documentSecurity: false,
  });
  console.log('Result:', JSON.stringify(ss, null, 2));

  // Delete the test document
  console.log('\n🧹 Deleting test document...');
  const del = await apiCall('DELETE', `/databases/${DB}/collections/page_views/documents/6a0b6e4466a6c2199efb`);
  console.log('Delete result:', del);

  // Now test creating a document WITHOUT API key (simulating client-side)
  console.log('\n📝 Testing client-side write (no API key)...');
  const testNoKey = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      path: `/v1/databases/${DB}/collections/page_views/documents`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT,
        // NO API KEY — simulating client-side
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log(`Client-side write → ${res.statusCode}`);
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({
      documentId: 'unique()',
      data: { PAGE: '/client-test', DATE: '2026-05-18', VIEWS: 1 },
    }));
    req.end();
  });
  console.log('Client-side result:', JSON.stringify(testNoKey, null, 2));
}

main().catch(console.error);
