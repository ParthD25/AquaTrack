import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDa-...",
  authDomain: "aquatrack-5469f.firebaseapp.com",
  projectId: "aquatrack-5469f",
});

const db = getFirestore(app);

// Helper to fetch Google URL titles
async function fetchTitle(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      let title = match[1];
      title = title.replace(/ - Google (Drive|Forms|Docs|Slides|Sheets)/gi, '');
      title = title.replace(/&amp;/g, '&');
      return title.trim();
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Clean up raw filenames like "SFAC_Manual.pdf" -> "SFAC Manual"
function beautifyName(name: string) {
  let cleaned = name;
  // Remove extensions
  cleaned = cleaned.replace(/\.(pdf|docx|doc|xlsx|xls|pptx|ppt|mp4|mov|jpg|png|jpeg)$/i, '');
  // Replace underscores with spaces
  cleaned = cleaned.replace(/_/g, ' ');
  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');
  // Trim
  return cleaned.trim();
}

async function run() {
  console.log('Fetching documents for deep cleaning...');
  const snap = await getDocs(collection(db, 'documents'));
  
  for (const d of snap.docs) {
    const data = d.data();
    let currentTitle = data.title || '';
    
    // 1. If it's one of the generic links we just seeded, try to scrape its real title!
    if (currentTitle.startsWith('SFAC Reference Link') || currentTitle.startsWith('SFAC Live Form') || 
        currentTitle.startsWith('SFAC Google Doc') || currentTitle.startsWith('SFAC Slides') || 
        currentTitle.startsWith('SFAC Drive') || currentTitle.startsWith('SFAC Shared')) {
      console.log(`Scraping actual title for ${currentTitle}...`);
      const scraped = await fetchTitle(data.url);
      if (scraped && scraped !== 'Google Forms - create and analyze surveys, for free.') {
        currentTitle = scraped;
        console.log(` -> Found: ${currentTitle}`);
      }
    }
    
    // 2. Beautify title
    const cleanTitle = beautifyName(currentTitle);
    
    // 3. Reclassify based on strictly clean title
    const lowercase = cleanTitle.toLowerCase();
    
    let newCat = data.category;
    let newAccess = data.accessLevel;
    
    // Extract year
    const yearMatch = lowercase.match(/\b(201\d|202\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : (data.year || 0);

    // Advanced Regex Routing
    if (lowercase.includes('maintenance')) {
      newCat = 'checklists'; newAccess = 'pool_tech';
    } else if (lowercase.includes('pool tech') || lowercase.includes('waterslide') || lowercase.includes('o&m') || lowercase.includes('becsystem')) {
      newCat = 'pool_tech'; newAccess = 'pool_tech';
    } else if (lowercase.includes('senior') || lowercase.includes('swim lesson') || lowercase.includes('master class') || lowercase.includes('adult learn') || lowercase.includes('roster')) {
      newCat = 'senior_lg'; newAccess = 'sr_guard';
    } else if (lowercase.includes('manual') || lowercase.includes('training') || lowercase.includes('orientation') || lowercase.includes('smoke') || lowercase.includes('entries+for+swimming')) {
      newCat = 'training'; newAccess = 'lifeguard';
    } else if (lowercase.includes('audit') || lowercase.includes('vat') || lowercase.includes('cpr')) {
      newCat = 'audits'; newAccess = 'sr_guard';
    } else if (lowercase.includes('checklist') || lowercase.includes('check log') || lowercase.includes('inspection')) {
      newCat = 'checklists'; newAccess = 'pool_tech';
    } else if (lowercase.includes('incident') || lowercase.includes('rescue') || lowercase.includes('emergency') || lowercase.includes('absence') || lowercase.includes('availability')) {
      newCat = 'staff_forms'; newAccess = 'lifeguard';
    } else if (data.fileType && data.fileType.startsWith('g')) { // generic google folders/files
      if (newCat === 'General') {
         newCat = 'staff_forms'; newAccess = 'lifeguard';
      }
    }

    if (newCat === 'General') {
      newCat = 'staff_forms'; newAccess = 'lifeguard';
    }
    
    const updates = {
      title: cleanTitle,
      category: newCat,
      accessLevel: newAccess,
      year: year,
    };

    await updateDoc(doc(db, 'documents', d.id), updates);
    console.log(`Saved [${newCat}]: ${cleanTitle}`);
  }
  
  console.log('Finished deep cleaning process!');
  process.exit(0);
}

run().catch(console.error);
