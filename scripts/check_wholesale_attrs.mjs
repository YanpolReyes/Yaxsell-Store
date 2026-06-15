import https from 'https';

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  port: 443,
  path: '/v1/databases/6a0a58ca001798410d86/collections/wholesale_requests/attributes',
  method: 'GET',
  headers: {
    'X-Appwrite-Project': '6a0a4e8d0032177f3f90',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || 'cc32f508210cd47f9e422896da3fc84c59800a0614a9da96fb29e46a78805f13c6d66e79b977755b41cf13028cd873e32cf628df4191c95b7747fb6fbd8cfce5a18a994cb14f9d0c6ca7e02df6f0b4d4b1a457c0e86a9fdbd58151cb8423fdb190eec2605f1bb5ed18683510c4923e3e2cbe81f9f257d0afeb3467f94bbbcbd5',
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(data));
});

req.on('error', e => console.error(e));
req.end();
