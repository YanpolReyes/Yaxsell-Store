// Create media bucket via REST API
import https from 'https';

const data = JSON.stringify({
  bucketId: 'media',
  name: 'Media',
  fileSize: 52428800,
  enabled: true,
  encryption: false,
  antivirus: false,
  permissions: [
    'read("any")',
    'create("any")',
    'update("any")',
    'delete("any")'
  ]
});

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/storage/buckets',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': '6a0e374b0009138bc6fa',
    'X-Appwrite-Key': 'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('Status:', res.statusCode, d));
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
