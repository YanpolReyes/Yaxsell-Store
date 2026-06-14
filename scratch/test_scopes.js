const key = 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';
const projectId = '6a0a4e8d0032177f3f90';
const dbId = '6a0a58ca001798410d86';

async function checkProjectInfo() {
  const urls = [
    "https://nyc.cloud.appwrite.io/v1/databases/usage",
    "https://nyc.cloud.appwrite.io/v1/databases/" + dbId + "/usage",
    "https://nyc.cloud.appwrite.io/v1/databases/" + dbId + "/collections/products/usage",
    "https://nyc.cloud.appwrite.io/v1/storage/usage"
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": key
        }
      });
      const text = await res.text();
      console.log(`URL: ${url} | Status: ${res.status}`);
      console.log(`Response: ${text.slice(0, 300)}\n`);
    } catch (err) {
      console.error(`Error on ${url}:`, err.message);
    }
  }
}

checkProjectInfo();
