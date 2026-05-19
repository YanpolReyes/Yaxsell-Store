const AK = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923a';
const EP = 'https://nyc.cloud.appwrite.io/v1';
const PID = '6a0a4e8d0032177f3f90';
const DB = '6a0a58ca001798410d86';
const H = { 'Content-Type': 'application/json', 'X-Appwrite-Project': PID, 'X-Appwrite-Key': AK };

async function main() {
  var res = await fetch(EP + '/databases/' + DB + '/collections', { headers: H });
  var data = await res.json();
  var cols = data.collections || [];
  console.log('Total collections:', cols.length);
  cols.forEach(function(c) {
    console.log(c.name + ' | ' + c.$id);
  });
  
  // Find live_streams
  var live = cols.find(function(c) { return c.name === 'live_streams'; });
  if (live) {
    console.log('\nFound live_streams with ID:', live.$id);
    // List existing attributes
    var attrRes = await fetch(EP + '/databases/' + DB + '/collections/' + live.$id + '/attributes', { headers: H });
    var attrData = await attrRes.json();
    var attrs = attrData.attributes || [];
    console.log('Existing attrs (' + attrs.length + '):');
    attrs.forEach(function(a) { console.log('  ' + a.key + ' (' + a.type + ')'); });
  } else {
    console.log('\nlive_streams NOT found');
  }
}
main().catch(function(e) { console.error(e); });
