const API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923a';
const EP = 'https://nyc.cloud.appwrite.io/v1';
const PID = '6a0a4e8d0032177f3f90';
const DB = '6a0a58ca001798410d86';
const H = { 'Content-Type': 'application/json', 'X-Appwrite-Project': PID, 'X-Appwrite-Key': API_KEY };

async function addAttr(colId, key, type, size, required, def) {
  const body = { key, type, size: size || 1, required: !!required };
  if (def !== undefined) body.default = def;
  const res = await fetch(EP + '/databases/' + DB + '/collections/' + colId + '/attributes', {
    method: 'POST', headers: H, body: JSON.stringify(body)
  });
  const json = await res.json();
  console.log('  ' + key + ': ' + res.status + ' ' + (json.message || json.key || 'OK'));
}

async function main() {
  // 1. List all collections to find live_streams
  console.log('Listing collections...');
  const listRes = await fetch(EP + '/databases/' + DB + '/collections', { headers: H });
  const listData = await listRes.json();
  const cols = listData.collections || [];
  cols.forEach(function(c) { console.log('  ' + c.name + ' [' + c.$id + ']'); });
  
  const found = cols.find(function(c) { return c.name === 'live_streams'; });
  
  let colId;
  if (found) {
    colId = found.$id;
    console.log('\nUsing existing live_streams [' + colId + ']');
  } else {
    console.log('\nlive_streams not found, creating...');
    const cr = await fetch(EP + '/databases/' + DB + '/collections', {
      method: 'POST', headers: H,
      body: JSON.stringify({ collectionId: 'live_streams', name: 'Live Streams', permissions: [] })
    });
    const cd = await cr.json();
    if (cr.ok) {
      colId = 'live_streams';
      console.log('  Created: ' + cd.$id);
    } else {
      console.log('  Error: ' + cr.status + ' ' + (cd.message || ''));
      console.log('  Trying to find by name again...');
      const retry = await fetch(EP + '/databases/' + DB + '/collections', { headers: H });
      const retryData = await retry.json();
      const retryFound = (retryData.collections || []).find(function(c) { return c.name === 'live_streams'; });
      if (retryFound) { colId = retryFound.$id; }
      else { console.log('FATAL: Cannot create or find live_streams'); return; }
    }
  }

  // 2. Check existing attributes
  const attrRes = await fetch(EP + '/databases/' + DB + '/collections/' + colId + '/attributes', { headers: H });
  const attrData = await attrRes.json();
  const existing = (attrData.attributes || []).map(function(a) { return a.key; });
  console.log('Existing attrs:', existing.join(', ') || 'none');

  // 3. Add missing attributes
  const attrs = [
    ['title', 'string', 256, true, ''],
    ['description', 'string', 2048, false, ''],
    ['url', 'string', 2048, true, ''],
    ['platform', 'string', 32, false, 'youtube'],
    ['isActive', 'boolean', null, false, false],
    ['status', 'string', 32, false, 'scheduled'],
    ['thumbnailUrl', 'string', 2048, false, ''],
    ['bannerUrl', 'string', 2048, false, ''],
    ['viewerCount', 'integer', null, false, 0],
    ['scheduledAt', 'string', 256, false, ''],
    ['startAt', 'string', 256, false, ''],
    ['endAt', 'string', 256, false, ''],
    ['autoplay', 'boolean', null, false, true],
    ['muted', 'boolean', null, false, false],
    ['showText', 'boolean', null, false, false],
    ['allowFullscreen', 'boolean', null, false, true],
    ['productIds', 'string', 65536, false, '[]'],
    ['pinnedProductId', 'string', 256, false, ''],
    ['isRotationEnabled', 'boolean', null, false, false],
    ['rotationInterval', 'integer', null, false, 30],
    ['defaultDiscount', 'integer', null, false, 0],
    ['errorMessage', 'string', 1024, false, ''],
    ['createdBy', 'string', 256, false, ''],
  ];

  console.log('\nAdding attributes...');
  for (var i = 0; i < attrs.length; i++) {
    var a = attrs[i];
    if (existing.indexOf(a[0]) === -1) {
      await addAttr(colId, a[0], a[1], a[2], a[3], a[4]);
    } else {
      console.log('  ' + a[0] + ': SKIP (exists)');
    }
  }
  console.log('\nDone!');
}

main().catch(function(e) { console.error(e); });
