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
  console.log('\n🧹 Cleaning old page_views data...\n');

  let deleted = 0;
  let offset = '';
  
  while (true) {
    const queries = [`limit(100)`];
    if (offset) queries.push(`cursor("${offset}")`);
    
    const res = await apiCall('GET', `/databases/${DB}/collections/page_views/documents?queries[]=${queries.join('&queries[]=')}`);
    
    if (!res.documents || res.documents.length === 0) break;
    
    for (const doc of res.documents) {
      // Delete docs with admin paths or old format (no IP field)
      const page = doc.PAGE || '';
      const hasIP = doc.IP !== undefined && doc.IP !== null;
      
      if (page.startsWith('/admin') || page.startsWith('/_next') || page.startsWith('/api') || page.startsWith('/inventario') || !hasIP) {
        await apiCall('DELETE', `/databases/${DB}/collections/page_views/documents/${doc.$id}`);
        deleted++;
        process.stdout.write(`\r  🗑️  Deleted ${deleted} docs...`);
      }
    }
    
    if (res.documents.length < 100) break;
    offset = res.documents[res.documents.length - 1].$id;
  }
  
  console.log(`\n\n  ✅ Cleaned ${deleted} old documents.`);
  
  // Show remaining
  const remaining = await apiCall('GET', `/databases/${DB}/collections/page_views/documents?queries[]=limit(1)&queries[]=offset(0)`);
  console.log(`  📊 Total remaining: ${remaining.total || 'unknown'}`);
}

main().catch(console.error);
