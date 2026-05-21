// Update .env.local with new Appwrite credentials
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

let content = '';
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, 'utf-8');
}

const updates: Record<string, string> = {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: '6a0e374b0009138bc6fa',
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: '6a0e37ac0016762b9dc4',
  APPWRITE_API_KEY: 'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641',
};

for (const [key, value] of Object.entries(updates)) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
    console.log(`✅ Updated ${key}`);
  } else {
    content += `\n${key}=${value}`;
    console.log(`➕ Added ${key}`);
  }
}

fs.writeFileSync(envPath, content, 'utf-8');
console.log('\n✅ .env.local updated');
