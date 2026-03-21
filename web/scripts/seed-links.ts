import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDa-...",
  authDomain: "aquatrack-5469f.firebaseapp.com",
  projectId: "aquatrack-5469f",
});

const db = getFirestore(app);

const links = [
  "https://drive.google.com/file/d/1Z3msL0FD5Jj-oh8uyqvLX0n1Qy8QYzMc/view",
  "https://drive.google.com/drive/folders/14g_16wFfr7PR7SdW8WYJZvqLEwbI_t7i",
  "https://drive.google.com/file/d/1UYBgwz8VTSVq74p7SB4Ei5T_lWCQg6jf/view",
  "https://docs.google.com/forms/d/e/1FAIpQLSfVnnwXrBTJvLkJfJ28b4y3cGpxQGddq0-uIGspOuuH4lywig/viewform?embedded=true",
  "https://drive.google.com/drive/folders/11Pueh87JLPEwpTOuK_KT_UnXK1CXw1AC",
  "https://docs.google.com/forms/d/e/1FAIpQLScz02lWb1-u4TvSp0aYFzDSKtlZgDQOEDlv9duszK0ZhE-mdw/viewform?embedded=true",
  "https://docs.google.com/forms/d/e/1FAIpQLSc55hFHJT28CEpNVO8eeJt72roiRBGTGq96PfZtGUZthxVVjA/viewform?embedded=true",
  "https://docs.google.com/document/d/102cv587Vam4oYxWaXAImypGwper_MAu82JkAiDOeejs/edit?tab=t.0",
  "https://drive.google.com/file/d/13vhSxhjW-SEOrUdLO86iV6cz503gSB-D/view",
  "https://drive.google.com/file/d/15zugpHpQxNywSDJoqCcUipVn9GkDnz9d/view",
  "https://docs.google.com/forms/d/e/1FAIpQLSc9hEo9IAg-nDhKbUk100UwQcexqvM8M2CxZlUWuVtiOAtUqw/viewform?embedded=true",
  "https://drive.google.com/drive/folders/1W94FQZcbNN_fNaZ3N1ujnJbCWvWLKPbv",
  "https://docs.google.com/presentation/d/1D8BbPOuVYoquJmW2OhSWLNxHETYaBJM0g72jnVCbug4/edit?slide=id.p#slide=id.p",
  "https://drive.google.com/drive/folders/1yTaSwhR7duvxLeG7UV2mywbl406M86XA"
];

async function run() {
  console.log('Seeding ' + links.length + ' links...');
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    let type = 'link';
    let namePrefix = 'SFAC Reference Link';
    
    if (link.includes('forms')) { type = 'gform'; namePrefix = 'SFAC Live Form'; }
    else if (link.includes('document')) { type = 'gdoc'; namePrefix = 'SFAC Google Doc'; }
    else if (link.includes('presentation')) { type = 'gslides'; namePrefix = 'SFAC Slides Presentation'; }
    else if (link.includes('folders')) { type = 'gfolder'; namePrefix = 'SFAC Drive Archive Folder'; }
    else if (link.includes('file')) { type = 'gfile'; namePrefix = 'SFAC Shared File'; }
    
    const title = `${namePrefix} ${i+1}`;
    
    await setDoc(doc(db, 'documents', `shared-ext-link-${i}`), {
      title,
      category: 'General',
      accessLevel: 'lifeguard',
      url: link,
      fileType: type,
      year: 2026
    });
  }
  console.log('Successfully seeded links!');
  process.exit(0);
}

run().catch(console.error);
