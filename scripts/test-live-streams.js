// Test if live_streams collection exists by trying to list documents
const AK = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923a';
const EP = 'https://nyc.cloud.appwrite.io/v1';
const PID = '6a0a4e8d0032177f3f90';
const DB = '6a0a58ca001798410d86';
const H = { 'Content-Type': 'application/json', 'X-Appwrite-Project': PID, 'X-Appwrite-Key': AK };

async function main() {
  // Try listing documents from live_streams
  var res = await fetch(EP + '/databases/' + DB + '/collections/live_streams/documents?queries[]=' + encodeURIComponent(JSON.stringify({method: 'limit', values: [1]})), { headers: H });
  console.log('live_streams documents:', res.status);
  var text = await res.text();
  console.log(text.substring(0, 500));
  
  // Try getting collection attributes directly
  var attrRes = await fetch(EP + '/databases/' + DB + '/collections/live_streams/attributes', { headers: H });
  console.log('\nlive_streams attributes:', attrRes.status);
  var attrText = await attrRes.text();
  console.log(attrText.substring(0, 500));
}
main().catch(function(e) { console.error(e); });
