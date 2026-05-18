const h: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': '6a0a4e8d0032177f3f90',
  'X-Appwrite-Key': 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d',
};

async function main() {
  const r = await fetch('https://nyc.cloud.appwrite.io/v1/databases/6a0a58ca001798410d86/collections/favorites/attributes', { headers: h });
  const d = await r.json();
  console.log('favorites attributes:', JSON.stringify(d.attributes?.map((a: any) => ({ key: a.key, type: a.type, status: a.status })), null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
