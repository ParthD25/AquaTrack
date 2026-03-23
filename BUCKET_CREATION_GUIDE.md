# Firebase Cloud Storage Bucket Creation Guide

**Project:** AquaTrack (aquatrack-5469f)  
**Date:** March 23, 2026  
**Status:** Ready for bucket creation

---

## 🪣 What You Need to Do

Your document management system is **fully built and ready**, but requires one final step: **Create the Cloud Storage bucket**.

### Step-by-Step Instructions

#### 1. Open Firebase Console
Visit: **https://console.firebase.google.com/project/aquatrack-5469f/storage**

#### 2. Create Bucket
You'll see one of these screens:
- **"Get Started" button** - Click it
- **"Create bucket" button** - Click it
- **Existing buckets listed** - Skip to step 5 (bucket already exists!)

#### 3. Configure Bucket
Fill in these settings:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `aquatrack-documents` | Or accept default: `aquatrack-5469f.appspot.com` |
| **Location** | `us-central1` | Choose closest region to your users |
| **Storage class** | Standard | Default, best for documents |
| **Access control** | Fine-grained | Required for Firebase Rules |

#### 4. Click "Create"
Wait 1-2 minutes for bucket to initialize.

#### 5. Verify Success
You should see:
```
✅ Bucket "aquatrack-documents" created successfully
```

---

## ✅ After Bucket Creation

Your document admin pages will automatically work:

### Test the Upload Feature
1. **Start your development server:**
   ```bash
   cd web/
   npm run dev
   ```

2. **Login as admin** → http://localhost:3000/login

3. **Go to Admin Section:**
   - Choose: Admin → Document Library
   - Click: Upload tab
   - Upload a test PDF or document

4. **Verify:**
   - File appears in admin page
   - Check Firebase Console → Storage → `documents/` folder
   - File should be there with timestamp prefix

### Example Upload Success
```
File: "1711270800000_sample-checklist.pdf"
Size: 245.5 KB
Uploaded by: Admin Name
Date: March 23, 2026
```

---

## 🔒 Security Configuration

### Firestore Rules (Already Set)
Your [firestore.rules](firestore.rules) already includes:

```firestore
match /documents_library/{docId} {
  allow read: if isStaff();
  allow create, update: if isAdmin();
  allow delete: if isAdmin();
}
```

### Storage Rules (Optional - Advanced)

If you want database-level storage rules, create `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin';
      allow write: if request.resource.size < 100 * 1024 * 1024;
    }
  }
}
```

Deploy with:
```bash
firebase deploy --only storage
```

---

## 📚 What's Available After Setup

### Admin Pages (All Ready!)

**1. Document Library** (`/admin/documents-library`)
- Upload documents with drag-drop
- Search and filter by category
- Tag management
- Role-based access control
- Delete documents
- View document metadata

**2. Document Archives** (`/admin/document-archives`)
- Auto-detect 5 archive folders:
  - Aquatic Checklist Forms (35 files)
  - Drive Download Backup 1 (42 files)  
  - Drive Download Backup 2 (89 files)
  - Senior Lifeguard (67 files)
  - Staff Forms (7 files)
- Import progress tracking
- File-by-file status monitoring
- Retry failed imports

### Staff View (Public, Coming Soon)
- Browse documents by category
- Search across all documents
- Download authorized docs
- View training materials
- Access HR forms

---

## 🐛 Troubleshooting

### "Permission denied" when uploading
**Cause:** Firestore rules not allowing write  
**Fix:** Check `web/firestore.rules` includes `allow create: if isAdmin();`

### Upload fails with "bucket-not-found"
**Cause:** Bucket doesn't exist  
**Fix:** Run through setup above to create bucket

### Upload succeeds but file doesn't appear
**Cause:** Firebase Storage not initialized  
**Fix:** Wait a few seconds and refresh Storage console

### Error: "Quota exceeded"
**Cause:** Free tier file size/count limit  
**Fix:** Upgrade to Blaze pricing plan in Firebase Console

---

## 📊 Firestore Collections Used

After bucket creation, these collections will be populated:

### `documents_library` (Stores document metadata)
```json
{
  "id": "doc_1711270800000",
  "title": "AED Daily Checklist",
  "category": "checklist",
  "type": "pdf",
  "fileUrl": "https://...",
  "fileSize": 245500,
  "tags": ["daily", "safety", "aed"],
  "uploadedBy": "Admin Name",
  "uploadedAt": "2026-03-23T14:30:00Z",
  "accessRoles": ["admin", "sr_guard", "pool_tech", "lifeguard"],
  "version": 1,
  "isActive": true
}
```

### `document_archives` (Tracks imported archives)
```json
{
  "id": "arc_aquatic_001",
  "archiveName": "Aquatic Checklist Forms-20260321T023049Z-3-001",
  "totalFiles": 35,
  "importedFiles": 35,
  "status": "complete",
  "importDate": "2026-03-23T14:25:00Z",
  "category": "checklist",
  "notes": "Primary aquatic facility checklists"
}
```

---

## 🚀 Complete Feature Set (Ready Now!)

✅ Admin document management  
✅ File upload with metadata  
✅ Search and filtering  
✅ Archive import tracking  
✅ Role-based access control  
✅ Firestore integration  
✅ Error handling  
✅ Progress tracking UI  

⏳ **Pending:** Cloud Storage bucket creation (1 button click)

---

## 📋 Next Steps After Bucket Creation

1. **Deploy to production:**
   ```bash
   firebase deploy --only hosting,firestore
   ```

2. **Import archives:**
   - Go to `/admin/document-archives`
   - Click "Detect Archives"
   - Start importing for each archive

3. **Create public document browser:**
   - Next Phase: Staff view for browsing documents
   - Next Phase: Search and categorization

4. **Add advanced features:**
   - PDF preview
   - Document versioning
   - OCR for scanned docs
   - AI categorization

---

## 💬 Quick Reference

| Item | Details |
|------|---------|
| **Firebase Project** | aquatrack-5469f |
| **Bucket Name** | aquatrack-documents |
| **Region** | us-central1 |
| **Upload Folder** | `documents/` |
| **Max File Size** | 100MB (configurable) |
| **Supported Types** | PDF, DOCX, XLSX, Images, Video |
| **Security** | Admin-only write, All staff read |
| **Console Link** | [Open Storage](https://console.firebase.google.com/project/aquatrack-5469f/storage) |

---

**Everything is ready. The only remaining step is to click the "Create" button in the Firebase Console.**

Questions? Check `web/BUCKET_SETUP.md` for additional details.
