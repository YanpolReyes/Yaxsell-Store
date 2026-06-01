const headers = {
  'X-Appwrite-Project': '6a0a4e8d0032177f3f90',
  'X-Appwrite-Key': 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642'
};

async function run() {
  const q = encodeURIComponent('equal("key", ["store_template"])');
  const url = `https://nyc.cloud.appwrite.io/v1/databases/6a0a58ca001798410d86/collections/sequences/documents?queries[]=${q}`;
  const res = await fetch(url, {headers});
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
