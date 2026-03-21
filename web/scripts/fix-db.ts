import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDa-...",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aquatrack-5469f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aquatrack-5469f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "aquatrack-5469f.firebasestorage.app",
  messagingSenderId: "27553399266",
  appId: "1:27553399266:web:19cb7d5ec92f3fecf879bb"
};

// Re-fetch env vars if needed, but since we are running via tsx from root, we can just hardcode for this script or let it pull from .env if we import dotenv.
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

const db = getFirestore(app);

async function run() {
  console.log('Fetching staff...');
  const snap = await getDocs(collection(db, 'staff'));
  for (const d of snap.docs) {
    const data = d.data();
    const updates: any = {};
    
    // Remove fake emails
    if (data.email && data.email.endsWith('@sfac.org') && data.email !== 'test@gmail.com') {
      updates.email = ''; 
    }
    
    // Promote Parth and Amanda
    const name = `${data.firstName} ${data.lastName}`;
    if (name === 'Parth Dave' || name === 'Amanda Daley') {
      updates.positionId = 'sr_guard';
    }
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'staff', d.id), updates);
      console.log(`Updated ${name}:`, updates);
    }
  }

  // Populate documents metadata
  // We use the absolute path provided by user's prompt history
  const docsPath = path.resolve('C:\\Users\\pdave\\Downloads\\DigiTracker\\drive-download-20260321T025803Z-3-001');
  if (fs.existsSync(docsPath)) {
    console.log('Seeding documents metadata...');
    const cats = fs.readdirSync(docsPath);
    for (const cat of cats) {
      const catPath = path.join(docsPath, cat);
      if (fs.statSync(catPath).isDirectory()) {
         const files = fs.readdirSync(catPath);
         for (const file of files) {
           if (file === '.DS_Store') continue;
           const id = file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
           let access = 'lifeguard';
           if (cat.includes('Senior')) access = 'sr_guard';
           if (cat.includes('Checklists')) access = 'pool_tech';
           if (cat.includes('Form')) access = 'lifeguard';
           
           await setDoc(doc(db, 'documents', id), {
             title: file,
             category: cat,
             url: `/documents/${encodeURIComponent(cat)}/${encodeURIComponent(file)}`,
             accessLevel: access,
             createdAt: new Date().toISOString()
           });
         }
      } else {
        if (cat === '.DS_Store') continue;
        const id = cat.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        let access = 'lifeguard';
        if (cat.includes('Audit')) access = 'sr_guard';
        
        await setDoc(doc(db, 'documents', id), {
             title: cat,
             category: 'General',
             url: `/documents/${encodeURIComponent(cat)}`,
             accessLevel: access,
             createdAt: new Date().toISOString()
        });
      }
    }
    console.log('Documents metadata seeded!');
  } else {
    console.log('Drive folder not found at', docsPath);
  }
  
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
