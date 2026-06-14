const key = 'e7be702069e0d440e2379d33208b1652cfedaad9e2ab9df4921f94165d5c14e8d39b31a45c935d85ed2109d81ea1d283c3ce7a5ef68e8cd91a93af5cfb0e0a0896be616ed760163e59d9a8e68d23ee894542c0aebfe1eb839d53e390bb61b9322240b01f8cffd307a3870cbb712adb693eb9d7984d459a9ee03b6742fceeafe3';
const projectId = '6a0a4e8d0032177f3f90';

async function testPrefixes() {
  const prefixes = [
    "",
    "live_",
    "test_",
    "personal_",
    "secret_",
    "token_",
    "admin_",
    "session_",
    "client_",
    "appwrite_",
    "console_"
  ];

  for (const prefix of prefixes) {
    const testKey = `${prefix}${key}`;
    try {
      const res = await fetch("https://nyc.cloud.appwrite.io/v1/health", {
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": testKey
        }
      });
      console.log(`Prefix: '${prefix}' -> Status: ${res.status}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`SUCCESS! Response: ${text}`);
        break;
      }
    } catch (err) {
      console.error(`Error on ${prefix}:`, err.message);
    }
  }
}

testPrefixes();
