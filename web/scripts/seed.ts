// Firebase Firestore seeding script
// Run once to create test account and seed staff data
// Usage: npx ts-node --esm scripts/seed.ts (or node scripts/seed.mjs)

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMYxnmAnak43upyX2EDbPNOX1vcv8wipU",
  authDomain: "aquatrack-5469f.firebaseapp.com",
  projectId: "aquatrack-5469f",
  storageBucket: "aquatrack-5469f.firebasestorage.app",
  messagingSenderId: "27553399266",
  appId: "1:27553399266:web:803820e015f35b81f879bb",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  console.log('🌊 AquaTrack Seed Script');
  console.log('========================');

  // 1. Create test admin account
  console.log('\n1. Creating test@gmail.com (admin)...');
  try {
    const testUser = await createUserWithEmailAndPassword(auth, 'test@gmail.com', '123456');
    await updateProfile(testUser.user, { displayName: 'Admin User' });
    await setDoc(doc(db, 'users', testUser.user.uid), {
      uid: testUser.user.uid,
      email: 'test@gmail.com',
      displayName: 'Admin User',
      role: 'admin',
      orgId: 'sfac',
    });
    console.log('   ✅ test@gmail.com created as admin (UID: ' + testUser.user.uid + ')');
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('   ⚠️ test@gmail.com already exists — skipping');
    } else {
      console.error('   ❌ Error:', err.message);
    }
  }

  // 2. Seed staff roster
  console.log('\n2. Seeding staff roster...');
  const staffRoster = [
    { firstName: 'Patrick', lastName: 'Ama', positionId: 'lifeguard', phone: '555-0101', active: true, visible: true },
    { firstName: 'Amanda', lastName: 'Daley', positionId: 'lifeguard', phone: '555-0102', active: true, visible: true },
    { firstName: 'Parth', lastName: 'Dave', positionId: 'lifeguard', phone: '555-0103', active: true, visible: true },
    { firstName: 'Serguei', lastName: 'Delgado', positionId: 'lifeguard', phone: '555-0104', active: true, visible: true },
    { firstName: 'Noah', lastName: 'Elam', positionId: 'lifeguard', phone: '555-0105', active: true, visible: true, isHighSchool: true, gradYear: 2026 },
    { firstName: 'Ethan', lastName: 'Gallagher', positionId: 'lifeguard', phone: '555-0106', active: true, visible: true },
    { firstName: 'Jaden', lastName: 'Garcia', positionId: 'lifeguard', phone: '555-0107', active: true, visible: true },
    { firstName: 'Rachel', lastName: 'Handran', positionId: 'sr_guard', phone: '555-0108', active: true, visible: true },
    { firstName: 'Christian', lastName: 'Higareda', positionId: 'lifeguard', phone: '555-0109', active: true, visible: true },
    { firstName: 'DJ', lastName: 'Howard', positionId: 'lifeguard', phone: '555-0110', active: true, visible: true },
    { firstName: 'Bryan', lastName: 'Jung', positionId: 'lifeguard', phone: '555-0111', active: true, visible: true },
    { firstName: 'Emma', lastName: 'Knab', positionId: 'lifeguard', phone: '555-0112', active: true, visible: true, isHighSchool: true, gradYear: 2026 },
    { firstName: 'Lorene', lastName: 'Lee', positionId: 'lifeguard', phone: '555-0113', active: true, visible: true },
    { firstName: 'Lynda', lastName: 'Lee', positionId: 'lifeguard', phone: '555-0114', active: true, visible: true },
    { firstName: 'Selena', lastName: 'Lopez', positionId: 'lifeguard', phone: '555-0115', active: true, visible: true },
    { firstName: 'Hector', lastName: 'Macias', positionId: 'sr_guard', phone: '555-0116', active: true, visible: true },
    { firstName: 'Alex', lastName: 'Mahan', positionId: 'lifeguard', phone: '555-0117', active: true, visible: true },
    { firstName: 'Aashirya', lastName: 'Murugan', positionId: 'lifeguard', phone: '555-0118', active: true, visible: true },
    { firstName: 'Quincy', lastName: 'Nemie', positionId: 'lifeguard', phone: '555-0119', active: true, visible: true },
    { firstName: 'Erik', lastName: 'Rauholt', positionId: 'lifeguard', phone: '555-0120', active: true, visible: true },
    { firstName: 'Gavin', lastName: 'Small', positionId: 'pool_tech', phone: '555-0121', active: true, visible: true },
    { firstName: 'Sophia', lastName: 'Smith', positionId: 'sr_guard', phone: '555-0122', active: true, visible: true },
    { firstName: 'Sean', lastName: 'Tan', positionId: 'lifeguard', phone: '555-0123', active: true, visible: true },
    { firstName: 'Travis', lastName: 'Tsuei', positionId: 'lifeguard', phone: '555-0124', active: true, visible: true },
    { firstName: 'Francesca', lastName: 'Uy', positionId: 'lifeguard', phone: '555-0125', active: true, visible: true },
    { firstName: 'Branden', lastName: 'Uyeda', positionId: 'sr_guard', phone: '555-0126', active: true, visible: true },
    { firstName: 'Michael', lastName: 'Wood', positionId: 'lifeguard', phone: '555-0127', active: true, visible: true },
    { firstName: 'Tristin', lastName: 'Wilson', positionId: 'lifeguard', phone: '555-0128', active: true, visible: true },
    { firstName: 'Emily', lastName: 'Wu', positionId: 'lifeguard', phone: '555-0129', active: true, visible: true },
    { firstName: 'Samantha', lastName: 'Wu', positionId: 'lifeguard', phone: '555-0130', active: true, visible: true },
    { firstName: 'Neo', lastName: 'Wynn', positionId: 'lifeguard', phone: '555-0131', active: true, visible: true },
    { firstName: 'Hafsa', lastName: 'Zafar', positionId: 'lifeguard', phone: '555-0132', active: true, visible: true },
    { firstName: 'Aodan', lastName: 'Lovato', positionId: 'lifeguard', phone: '555-0133', active: true, visible: true },
    { firstName: 'Rachel', lastName: 'Tom', positionId: 'sr_guard', phone: '555-0134', active: true, visible: true },
    { firstName: 'Katie', lastName: 'Clinton', positionId: 'lifeguard', phone: '555-0135', active: true, visible: true },
    { firstName: 'Jacob', lastName: 'Malimban', positionId: 'lifeguard', phone: '555-0136', active: true, visible: true },
    { firstName: 'Boaz', lastName: 'Kwong', positionId: 'lifeguard', phone: '555-0137', active: true, visible: true },
    { firstName: 'Aiden', lastName: 'Ramirez', positionId: 'lifeguard', phone: '555-0138', active: true, visible: true },
  ];

  const batch = writeBatch(db);
  staffRoster.forEach((staff, i) => {
    const id = `staff-${i + 1}`;
    batch.set(doc(db, 'staff', id), {
      ...staff,
      id,
      email: `${staff.firstName.toLowerCase()}.${staff.lastName.toLowerCase()}@sfac.org`,
      orgId: 'sfac',
      status: 'active', // active | inactive | former
      statusHistory: [{ status: 'active', date: new Date().toISOString(), changedBy: 'seed' }],
    });
  });
  await batch.commit();
  console.log(`   ✅ ${staffRoster.length} staff members seeded`);

  console.log('\n✅ Seed complete!');
  console.log('   Login: test@gmail.com / 123456');
  process.exit(0);
}

seed().catch(console.error);
