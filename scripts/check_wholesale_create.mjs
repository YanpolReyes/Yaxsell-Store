import { Client, Databases, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6a0a4e8d0032177f3f90');

const databases = new Databases(client);

databases.createDocument('6a0a58ca001798410d86', 'wholesale_requests', ID.unique(), {
  userId: 'test_user_id',
  name: 'Test Name',
  email: 'test@example.com',
  rut: '12345678-9',
  phone: '123456789',
  companyName: 'Test Business',
  status: 'pending',
  createdAt: new Date().toISOString()
})
  .then(res => console.log("Created successfully", res.$id))
  .catch(err => console.error("Create Error:", err));
