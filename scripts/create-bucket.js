const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../web/google-services.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.error('Error loading service account. Make sure google-services.json exists in web/ folder');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'aquatrack-5469f',
});

const storage = admin.storage();

async function createBucket() {
  try {
    console.log('Creating Cloud Storage bucket...');
    
    // Create the bucket
    const bucket = storage.bucket('aquatrack-documents');
    
    // Check if bucket exists
    const [exists] = await bucket.exists();
    
    if (exists) {
      console.log('✅ Bucket "aquatrack-documents" already exists!');
    } else {
      console.log('Bucket does not exist. Creating via Firebase Console is recommended.');
      console.log('Visit: https://console.firebase.google.com/project/aquatrack-5469f/storage');
      console.log('Click "Get Started" and create bucket with name: aquatrack-documents');
    }
    
    // List existing buckets
    console.log('\nExisting buckets in project:');
    const [buckets] = await admin.storage().getBuckets();
    
    if (buckets.length === 0) {
      console.log('No buckets found. Please create one via Firebase Console.');
    } else {
      buckets.forEach(b => {
        console.log(`  - ${b.name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    admin.app().delete();
  }
}

createBucket();
