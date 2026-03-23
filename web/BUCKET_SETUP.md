# Firebase Cloud Storage Bucket Setup

## Quick Start (Manual via Console)

**URL:** https://console.firebase.google.com/project/aquatrack-5469f/storage

**Steps to Create Bucket:**

1. **Open Firebase Console** → Go to Storage
2. **Click "Get Started" or "Create bucket"**
3. **Fill in bucket details:**
   - Name: `aquatrack-documents` (recommended) or `aquatrack-5469f.appspot.com` (default)
   - Location: `us-central1` (or your preferred region)
   - Storage class: Standard
   - Fine-grained access control (for Firebase Rules)
4. **Click "Create"** and wait 1-2 minutes

## After Bucket Creation

Once the bucket is created, your document upload page will automatically work with:

```javascript
// Firebase Storage initialization (already in web/lib/firebase.ts)
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload example
const storageRef = ref(storage, `documents/${Date.now()}_${fileName}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

## Firestore Rules (Security)

The bucket access is controlled by Firestore rules. Only authenticated users pass through to Storage rules:

```firestore
match /b/{bucket}/o {
  match /documents/{allPaths=**} {
    allow read: if isAuthenticated();
    allow write: if isAdmin();
  }
}
```

## Storage Rules (storage.rules)

If you want custom Storage-level rules, create `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{allPaths=**} {
      // Read: Only authenticated users
      allow read: if request.auth != null;
      
      // Write: Only admins
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin';
      
      // Limit file size to 100MB
      allow write: if request.resource.size < 100 * 1024 * 1024;
    }
  }
}
```

To deploy: `firebase deploy --only storage`

## Testing Upload Functionality

After bucket is created, test the admin page:

1. Go to **http://localhost:3000/admin/documents-library** (if running locally)
2. Click **Upload tab**
3. Select a file and upload
4. Check Firebase Console → Storage → `documents/` folder
5. Verify file appears with timestamp prefix

## Troubleshooting

### "Permission denied" errors
- Check that bucket exists in Storage console
- Verify Firestore rules include Storage path access
- Confirm user is authenticated as admin

### Upload fails silently
- Check browser console for errors
- Verify bucket name in `web/lib/firebase.ts`
- Ensure file is <100MB

### Files not appearing
- Refresh Storage console page
- Check if bucket location is correct
- Verify upload completed in Network tab

## Environment Variables (if needed)

Add to `.env.local` in web/:
```
NEXT_PUBLIC_STORAGE_BUCKET=aquatrack-documents
NEXT_PUBLIC_STORAGE_URL=gs://aquatrack-documents
```

Then reference in code:
```typescript
const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'aquatrack-documents';
const storageRef = ref(storage, `documents/${filename}`);
```

## Deployment

After setup, deploy with:
```bash
cd web/
npm run build
firebase deploy --only hosting,firestore
```

---

**Status:** Ready for manual bucket creation via Firebase Console
**Time to complete:** ~5 minutes
**Impact:** Document upload page will be fully functional
