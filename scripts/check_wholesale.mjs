import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6a0a4e8d0032177f3f90');

const databases = new Databases(client);

databases.listDocuments('6a0a58ca001798410d86', 'wholesale_requests')
  .then(res => {
    console.log("Documents found:", res.documents.length);
  })
  .catch(err => {
    console.error("Error:", err);
  });
