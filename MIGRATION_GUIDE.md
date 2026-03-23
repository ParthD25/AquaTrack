# Document Library Migration Guide

## Overview
This guide explains the unified document management system migration from the old `documents` collection to the new `documents_library` collection with enhanced metadata and role-based access.

## What Changed

### Schema Migration

**Old `documents` Collection:**
```
{
  title: string
  category: string
  url: string
  year: number (optional)
  accessLevel: string ('admin' | 'sr_guard' | 'pool_tech' | 'lifeguard' | 'all')
}
```

**New `documents_library` Collection:**
```
{
  title: string
  description: string (optional)
  category: 'checklist' | 'incident' | 'hr_form' | 'training' | 'maintenance' | 'operational' | 'archive'
  type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'link' | 'video'
  fileUrl: string (optional)
  fileSize: number (optional)
  uploadedAt: Timestamp
  uploadedBy: string
  tags: string[]
  accessRoles: UserRole[] ('admin' | 'sr_guard' | 'pool_tech' | 'lifeguard')
  version: number
  isActive: boolean
  linkedForms: string[] (optional)
  metadata: Record<string, any> (optional)
}
```

### Key Improvements
1. **Better Access Control**: `accessRoles` array instead of single `accessLevel` string
2. **Rich Metadata**: Added tags, description, file size, upload tracking
3. **Version Control**: Track document versions
4. **Better Categorization**: Standardized category types
5. **Document Status**: `isActive` flag to soft-delete without losing data
6. **File Type Tracking**: Explicit `type` field instead of inferring from filename

## Migration Steps

### Step 1: Run the Migration Script

The migration script is located at: `web/scripts/migrate-documents.ts`

```bash
# Set up Firebase credentials
export GOOGLE_APPLICATION_CREDENTIALS=<path-to-serviceAccountKey.json>

# Run migration (from web directory)
NODE_PATH=dist node -r ts-node/register scripts/migrate-documents.ts
```

**What the script does:**
- Reads all documents from the old `documents` collection
- Transforms them to the new `documents_library` schema
- Infers file types from filenames
- Maps access levels to role arrays
- Extracts tags from document titles and categories
- Saves documents to `documents_library` collection with ID preservation

**Output:**
- Console log showing migration progress
- Summary of successfully migrated and failed documents
- Documents are tagged with `migratedFrom: 'documents'` for tracking

### Step 2: Verify Web Pages Updated

All web pages have been updated to use `documents_library`:

- **Documents Page** (`web/app/(app)/documents/page.tsx`)
  - Reads from `documents_library` collection
  - Uses new access control logic with `accessRoles`
  - Updated UI to display tags instead of year
  - Enhanced document viewer

- **Training Page** (`web/app/(app)/training/page.tsx`)
  - Reads from `documents_library` with category filter `'training'`
  - Uses new document type handling
  - Simplified category display

### Step 3: Verify Mobile App Updated

Material update made to mobile app:

- **Home Screen** (`mobile/lib/home_screen.dart`)
  - Collection changed from `documents` to `documents_library`
  - Access control updated to check `accessRoles` array
  - Removed year-based filtering
  - Added description and tags display
  - Category detection from document data

### Step 4: Verify Firestore Rules Updated

Rules file has been updated (`firestore.rules`):

- **documents_library**: New rules for role-based access
  - Staff can read documents where their role is in `accessRoles`
  - Only admins can create/update/delete
  - Enhanced security with granular access checks

- **documents (deprecated)**: 
  - Read-only for backward compatibility
  - No new writes allowed
  - Can be deleted after confirming migration success

### Step 5: Testing Checklist

- [ ] **Data Migration**
  - [ ] Run migration script successfully
  - [ ] Verify old documents count matches new count
  - [ ] Check a few documents in Firestore console
  - [ ] Verify metadata is correct (tags, type, accessRoles)

- [ ] **Web Pages**
  - [ ] Documents page loads documents from `documents_library`
  - [ ] Category filtering works
  - [ ] Search functionality works
  - [ ] Document viewer works for PDFs and videos
  - [ ] Download links work
  - [ ] Access control respected (lifeguards see only their docs)

- [ ] **Training Page**
  - [ ] Training modules load from `documents_library`
  - [ ] Type filters work (video, PDF, checklist)
  - [ ] Video playback works
  - [ ] PDF viewer works

- [ ] **Mobile App**
  - [ ] Documents load in mobile app
  - [ ] Category filters work
  - [ ] Document opening works
  - [ ] Access control respected

- [ ] **Firestore Rules**
  - [ ] Admin can create/update documents
  - [ ] Non-admin cannot write to documents_library
  - [ ] Access control rules are respected

## Rollback Plan

If issues occur:

1. **Keep old `documents` collection intact** during initial migration
2. **Revert web pages** to read from `documents` collection (temporary)
3. **Revert mobile app** to read from `documents` collection
4. **Investigate issues** with new schema
5. **Delete `documents_library` documents** if needed
6. **Re-run migration script** after fixes

## Post-Migration Cleanup

After confirming everything works:

1. **Delete old `documents` collection** from Firestore console
2. **Update Firestore rules** to remove `documents` section entirely
3. **Remove old document columns** if any custom integrations use them
4. **Archive migration logs** for audit trail

## Category Mapping

The migration script automatically maps old categories to new ones:

| Old Category | New Category |
|-------------|------------|
| checklist | checklist |
| incident | incident |
| hr_form | hr_form |
| training | training |
| pool_tech | training |
| maintenance | maintenance |
| operational | operational |
| forms | operational |
| documents | operational |
| archive | archive |
| (other) | operational |

## Access Level Mapping

The migration script maps access levels to role arrays:

| Old Access Level | New Access Roles |
|-----------------|-----------------|
| 'all' | ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] |
| 'lifeguard' | ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] |
| 'pool_tech' | ['admin', 'sr_guard', 'pool_tech'] |
| 'sr_guard' | ['admin', 'sr_guard'] |
| 'admin' | ['admin'] |
| (empty/null) | ['admin'] |

## Troubleshooting

### Migration Script Fails
- Check that `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- Verify Firebase project credentials in service account key
- Check that database has read/write permissions for both collections
- Look at console errors for specific issues

### Documents Not Showing in Web UI
- Check that `documents_library` collection exists and has documents
- Verify Firestore rules allow your role to read documents
- Check browser console for JavaScript errors
- Verify document `accessRoles` includes your user's role

### Mobile App Shows No Documents
- Clear app cache and restart
- Check that `documents_library` collection is accessible
- Verify Firebase config in mobile app matches web app
- Check user role in Firebase users collection

### Access Control Issues
- Verify user's role in `users` collection
- Check that document's `accessRoles` array contains the user's role
- Review Firestore rules for any issues
- Check that `isAdmin()` and other role functions work correctly

## Migration Timeline

1. **Preparation**: Review this guide and test in development
2. **Migration**: Run script during off-hours
3. **Testing**: Verify data and functionality
4. **Validation**: Have team test pages and mobile app
5. **Cleanup**: Delete old collection after confirmation
6. **Monitor**: Watch logs for any issues post-migration

## Questions?

Refer to the migration script comments in `web/scripts/migrate-documents.ts` for implementation details.
