// init-user.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMYxnmAnak43upyX2EDbPNOX1vcv8wipU",
  authDomain: "aquatrack-5469f.firebaseapp.com",
  projectId: "aquatrack-5469f",
  storageBucket: "aquatrack-5469f.firebasestorage.app",
  messagingSenderId: "27553399266",
  appId: "1:27553399266:web:803820e015f35b81f879bb",
  measurementId: "G-DF1PS50TZR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function init() {
  const email = 'test1@gmail.com';
  const password = '123456';
  
  let user;
  try {
    console.log(`Attempting to create user ${email}...`);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log('User created:', user.uid);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('User already exists. Signing in...');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      user = cred.user;
    } else {
      console.error('Error creating user:', err);
      process.exit(1);
    }
  }

  // Create the AppUser doc in firestore
  const userDoc = doc(db, 'users', user.uid);
  await setDoc(userDoc, {
    uid: user.uid,
    email: email,
    displayName: 'Test Sr. Guard',
    role: 'sr_guard',
    orgId: 'defaultOrg',
  }, { merge: true });

  console.log('User doc created successfully in Firestore with role sr_guard.');
  process.exit(0);
}

init();
