import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDa-...", // Will be overridden if we provide project ID correctly
  authDomain: "aquatrack-5469f.firebaseapp.com",
  projectId: "aquatrack-5469f",
  storageBucket: "aquatrack-5469f.firebasestorage.app",
});

const db = getFirestore(app);

async function run() {
  console.log('Fetching documents for reclassification...');
  const snap = await getDocs(collection(db, 'documents'));
  
  for (const d of snap.docs) {
    const data = d.data();
    const title = (data.title || '').toLowerCase();
    
    let newCat = data.category;
    let newAccess = data.accessLevel;
    
    // Extract year (first 4 digit number found)
    const yearMatch = title.match(/\b(201\d|202\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : 0;

    if (title.includes('maintenance')) {
      newCat = 'checklists';
      newAccess = 'pool_tech';
    } else if (title.includes('pool tech') || title.includes('waterslide') || title.includes('o&m') || title.includes('becsystem')) {
      newCat = 'pool_tech';
      newAccess = 'pool_tech';
    } else if (title.includes('senior') || title.includes('swim lesson') || title.includes('master class') || title.includes('adult learn') || title.includes('roster')) {
      newCat = 'senior_lg';
      newAccess = 'sr_guard';
    } else if (title.includes('manual') || title.includes('training') || title.includes('orientation') || title.includes('smoke') || title.includes('entries+for+swimming')) {
      newCat = 'training';
      newAccess = 'lifeguard';
    } else if (title.includes('audit') || title.includes('vat')) {
      newCat = 'audits';
      newAccess = 'sr_guard';
    } else if (title.includes('checklist') || title.includes('check log') || title.includes('inspection')) {
      newCat = 'checklists';
      newAccess = 'pool_tech';
    } else if (title.includes('incident') || title.includes('rescue') || title.includes('emergency')) {
      newCat = 'staff_forms';
      newAccess = 'lifeguard';
    }

    if (newCat === 'General') {
      newCat = 'staff_forms';
      newAccess = 'lifeguard';
    }
    
    const fixedUrl = data.url ? data.url.replace(/\\/g, '/') : data.url;

    const updates = {
      category: newCat,
      accessLevel: newAccess,
      year: year,
      url: fixedUrl
    };

    await updateDoc(doc(db, 'documents', d.id), updates);
    console.log(`Updated ${data.title} -> Cat: ${newCat}, Year: ${year}`);
  }
  
  console.log('Done reclassifying.');
  process.exit(0);
}

run().catch(console.error);
