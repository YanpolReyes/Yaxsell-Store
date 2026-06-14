const key = 'e7be702069e0d440e2379d33208b1652cfedaad9e2ab9df4921f94165d5c14e8d39b31a45c935d85ed2109d81ea1d283c3ce7a5ef68e8cd91a93af5cfb0e0a0896be616ed760163e59d9a8e68d23ee894542c0aebfe1eb839d53e390bb61b9322240b01f8cffd307a3870cbb712adb693eb9d7984d459a9ee03b6742fceeafe3';
const projectId = '6a0e374b0009138bc6fa';

async function testEndpoints() {
  const endpoints = [
    { name: "health", path: "/v1/health" },
    { name: "databases", path: "/v1/databases" }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://nyc.cloud.appwrite.io${ep.path}`, {
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": key
        }
      });
      const text = await res.text();
      console.log(`Endpoint: ${ep.name} | Status: ${res.status}`);
      console.log(`Response: ${text.slice(0, 300)}\n`);
    } catch (err) {
      console.error(`Error on ${ep.name}:`, err.message);
    }
  }
}

testEndpoints();
