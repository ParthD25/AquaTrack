// Firebase configuration — AquaTrack project
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
