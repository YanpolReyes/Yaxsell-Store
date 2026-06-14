// Native fetch in Node 18+

async function checkUsage() {
  const url = "https://nyc.cloud.appwrite.io/v1/project/usage?range=30d"; // We want to check this week/month
  const options = {
    method: "GET",
    headers: {
      "X-Appwrite-Project": "6a0a4e8d0032177f3f90", // Extracted from appwrite.json
      "X-Appwrite-Key": "standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642",
      "Content-Type": "application/json"
    }
  };

  try {
    const res = await globalThis.fetch(url, options);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkUsage();
