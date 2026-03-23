# 🗺️ DigiTracker — Complete Architecture & Integration Plan

## 📊 Current State Analysis

### Archives Discovered
1. **Aquatic Checklist Forms** - Facility checklists, incident reports, maintenance sheets
2. **Drive-download folders** (×2) - Duplicates/backups of documentation
3. **Senior Lifeguard folder** - Training materials, rosters, orientation
4. **Staff Forms folder** - HR forms (address, direct deposit, resignation, etc.)
5. **Root-level files** - Operational spreadsheets (VAT records, availability, closures)

### Current Tech Stack
- **Mobile:** Flutter + Firebase
- **Web:** Next.js + TypeScript + Firebase
- **Database:** Firestore with security rules
- **AI:** Genkit + Google AI (chat widget)
- **Version Control:** Git (initialized)

---

## 🎯 Integration Strategy

### Phase 1: Firebase Data Structure
**Objective:** Define collections to store all document metadata

### Phase 2: Document Management System
**Objective:** Create admin UI to upload, organize, and manage documents

### Phase 3: Archive Sync System
**Objective:** Import archived forms into Firebase

### Phase 4: Git Automation
**Objective:** Auto-commit and push changes to repository

---

## 📁 NEW FIRESTORE COLLECTIONS STRUCTURE

```
documents_library/
├── document_id
│   ├── title (string)
│   ├── description (string)
│   ├── category (string: "checklist", "incident", "hr_form", "training", "maintenance")
│   ├── type (string: "pdf", "docx", "xlsx", "image", "link")
│   ├── fileUrl (string) - GCS URL
│   ├── fileSize (number)
│   ├── uploadedAt (timestamp)
│   ├── uploadedBy (string) - User ID
│   ├── tags (array) - ["aquatic", "senior-guard", "pool-tech", etc.]
│   ├── accessRoles (array) - ["admin", "sr_guard", "pool_tech", "lifeguard"]
│   ├── version (number)
│   ├── isActive (boolean)
│   └── linkedForms (array) - Related form IDs

document_templates/
├── template_id
│   ├── name (string)
│   ├── category (string)
│   ├── fields (array of FormField objects)
│   ├── description (string)
│   ├── createdAt (timestamp)
│   ├── createdBy (string)
│   ├── usageCount (number)
│   └── lastUsedAt (timestamp)

document_archives/
├── archive_id
│   ├── archiveName (string) - e.g., "Aquatic Checklist Forms-20260321"
│   ├── sourceFolder (string)
│   ├── importDate (timestamp)
│   ├── importedBy (string)
│   ├── totalFiles (number)
│   ├── documents (array of document_ids)
│   ├── status (string: "pending", "importing", "complete", "failed")
│   └── notes (string)

staff_forms_submissions/
├── submission_id
│   ├── formId (string)
│   ├── staffId (string)
│   ├── staffName (string)
│   ├── submissionDate (timestamp)
│   ├── data (object) - Form field values
│   ├── status (string: "draft", "submitted", "approved", "rejected")
│   ├── approvedBy (string) - Admin ID
│   ├── approvalDate (timestamp)
│   └── notes (string)

checklists_library/
├── checklist_id
│   ├── title (string)
│   ├── category (string)
│   ├── items (array)
│   │   ├── itemId (string)
│   │   ├── label (string)
│   │   ├── required (boolean)
│   │   └── order (number)
│   ├── createdAt (timestamp)
│   ├── updatedAt (timestamp)
│   ├── versions (array) - Historical versions
│   └── usedIn (array) - Shift IDs using this checklist

incident_reports_archive/
├── report_id
│   ├── date (date)
│   ├── time (string)
│   ├── location (string)
│   ├── incidentType (string)
│   ├── description (string)
│   ├── reportedBy (string)
│   ├── witnesses (array)
│   ├── severity (string: "minor", "moderate", "severe")
│   ├── fileUrl (string)
│   ├── archived (boolean)
│   └── linkedAssignments (array)

senior_lifeguard_resources/
├── resource_id
│   ├── title (string)
│   ├── resourceType (string: "roster", "training", "audit", "lesson", "manual")
│   ├── fileUrl (string)
│   ├── description (string)
│   ├── year (number)
│   ├── uploadedAt (timestamp)
│   ├── tags (array)
│   ├── accessibleTo (array) - Role IDs
│   └── linkedStaff (array) - Staff member IDs
```

---

## 🔐 FIRESTORE SECURITY RULES (Updated)

```firestore
match /documents_library/{docId} {
  allow read: if isStaff();
  allow create, update: if isAdmin();
  allow delete: if isAdmin();
}

match /document_templates/{templateId} {
  allow read: if isStaff();
  allow create, update, delete: if isAdmin();
}

match /document_archives/{archiveId} {
  allow read: if isAdmin();
  allow create, update, delete: if isAdmin();
}

match /staff_forms_submissions/{submissionId} {
  allow read: if request.auth.uid == resource.data.staffId || isAdmin();
  allow create: if request.auth != null;
  allow update: if isAdmin() || (request.auth.uid == resource.data.staffId && resource.data.status == 'draft');
}

match /checklists_library/{checklistId} {
  allow read: if isStaff();
  allow create, update, delete: if isAdmin();
}

match /incident_reports_archive/{reportId} {
  allow read: if isSrGuard();
  allow create, update: if isSrGuard();
  allow delete: if isAdmin();
}

match /senior_lifeguard_resources/{resourceId} {
  allow read: if isSrGuard();
  allow create, update, delete: if isAdmin();
}
```

---

## 🛠️ IMPLEMENTATION PHASES

### PHASE 1: Firebase Collections Setup
- Create Firestore collections matching structure above
- Set up security rules ✅
- Create indexes for fast queries
- Set up Firebase Cloud Storage buckets

### PHASE 2: Admin Dashboard Pages ✅
Create these new admin pages:
- ✅ `/admin/documents-library` - Manage all documents (COMPLETE)
- ✅ `/admin/document-archives` - View imported archives (COMPLETE)
- 🟡 `/admin/checklists-management` - Manage checklists (READY TO BUILD)
- 🟡 `/admin/form-submissions` - View submitted forms (READY TO BUILD)
- 🟡 `/admin/incident-reports` - Archive & search incidents (READY TO BUILD)

### PHASE 3: Document Upload System ✅
- ✅ File upload interface (drag-drop) - IMPLEMENTED
- Document Preview (next feature)
- OCR for scanned PDFs (optional)
- Automatic categorization (using Genkit)

### PHASE 4: Archive Import System
- Script to parse archive folders (Node.js/PowerShell)
- Auto-import to Firebase Storage
- Metadata extraction
- Progress tracking UI

### PHASE 5: Git Automation
- GitHub Actions for auto-commit
- Conventional Commits format
- Auto-push on code changes
- Deployment pipeline

---

## 📱 NEW WEB PAGES TO CREATE

### Admin Document Management
```
/admin/documents-library
├── Search & Filter
├── Upload New Document
├── Document Grid View
└── Document Details/Edit Panel

/admin/document-archives
├── Archive List
├── Import Archive Button
├── Import Progress
└── Archive Details

/admin/checklists-management
├── Create Checklist
├── Edit Checklist
├── View Usage Statistics
└── Version History

/admin/form-submissions
├── Filter by Form Type
├── Filter by Staff
├── View Submission
├── Approve/Reject Form
└── Export Data

/admin/incident-reports
├── Search Incidents
├── Filter by Date/Type
├── View Report Details
├── Export Archive
└── Link to Investigations
```

---

## 🔄 GIT AUTOMATION SETUP

### GitHub Actions Workflow (`.github/workflows/auto-commit.yml`)
```yaml
name: Auto Commit Changes
on:
  push:
    branches: [main, develop]
    paths:
      - 'web/**'
      - 'mobile/**'
      - 'firestore.rules'
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure Git
        run: |
          git config --global user.email "bot@aquatrack.local"
          git config --global user.name "AquaTrack Bot"
      - name: Commit Changes
        run: |
          git add -A
          git commit -m "chore: automated update [$(date)]" || echo "No changes"
          git push
```

---

## 📚 Document Archive Mapping

### Aquatic Checklist Forms
```
Source: Aquatic Checklist Forms-20260321T023049Z-3-001/
Documents:
├── AED Daily Checklist.pdf → checklists_library + documents_library
├── Chemical Check Log.pdf → documents_library
├── Chemical & First Aid Inventory → documents_library
├── Daily_Weekly LG Checklist - Summer → documents_library
├── Daily_Weekly LG Checklist - Offseason → documents_library
├── Incident report 2024.pdf → incident_reports_archive
├── Oxygen Daily Checklist.pdf → checklists_library
├── Pre-Opening Inspection → checklists_library
├── Monthly Maintenance Sheets → documents_library
└── RESCUE REPORT 2024.pdf → incident_reports_archive
```

### Senior Lifeguard Folder
```
Source: Senior Lifeguard-20260321T025547Z-3-001/
Documents:
├── Master Class Rosters → senior_lifeguard_resources
├── Swim Lesson Materials → senior_lifeguard_resources
├── Teaching Activities/Drills → senior_lifeguard_resources
├── Level Record Sheets → senior_lifeguard_resources
├── Testing Guides → senior_lifeguard_resources
├── Orientation Materials → senior_lifeguard_resources
├── Audit Sheets → documents_library
└── Training Videos → senior_lifeguard_resources
```

### Staff Forms Folder
```
Source: Staff Forms -20260321T030415Z-3-001/
Documents:
├── Change of Address Form.pdf → staff_forms + documents_library
├── Direct Deposit Request Form.pdf → staff_forms
├── Emergency Form.pdf → staff_forms
├── ESuite Account Setup.pdf → staff_forms
├── Notice of Resignation Paperwork.pdf → staff_forms
└── PST Absence Request.pdf → staff_forms
```

---

## ✨ Key Integration Features

### 1. **Smart Document Search**
- Full-text search across all documents
- Filter by type, category, date range
- Save favorite searches
- Integration with Firestore search

### 2. **Document Versioning**
- Track all document versions
- Rollback capability
- Document history audit trail
- Change attribution

### 3. **Form Workflow**
- Draft → Submit → Review → Approve
- Email notifications on approval
- Bulk approval for admins
- Submission history

### 4. **Archive Management**
- Import external archives
- De-duplicate documents
- Organize into collections
- Automatic metadata extraction

### 5. **Access Control**
- Role-based document visibility
- Granular permission management
- Team-based access
- Secure document sharing

### 6. **Compliance & Reporting**
- Document usage auditing
- Form submission tracking
- Data export (CSV/PDF)
- Compliance reporting

---

## 🚀 Priority Implementation Order

1. **Week 1:** Firestore collections + security rules
2. **Week 2:** Admin document library page + upload system
3. **Week 3:** Archive import system + metadata parser
4. **Week 4:** Form submission tracking + approval workflow
5. **Week 5:** Git automation + CI/CD pipeline
6. **Week 6:** Search & analytics features
7. **Week 7+:** Advanced features (OCR, AI categorization, email)

---

## 📊 Expected Data Volume

| Collection | Estimated Docs | Update Frequency |
|---|---|---|
| documents_library | 500-1000 | Monthly |
| document_templates | 50-100 | Quarterly |
| staff_forms_submissions | 10,000+ | Daily |
| checklists_library | 30-50 | Quarterly |
| incident_reports_archive | 200-500 | Weekly |
| senior_lifeguard_resources | 100-200 | Quarterly |

---

## 🔗 Integration Points

### Mobile App (Flutter)
- Sync forms to device storage
- Offline form completion
- Push submission to Firebase

### Web Dashboard
- View all documents
- Search library
- Submit forms
- View submission status

### Backend (Firebase)
- Store documents in Cloud Storage
- Index metadata in Firestore
- Trigger notifications on events
- Generate reports

---

## ✅ Success Metrics

- ✓ All archives imported to Firebase
- ✓ Zero-loss data migration
- ✓ Sub-second document search
- ✓ 100% Git history maintained
- ✓ Auto-commit on all changes
- ✓ Daily backups configured
- ✓ Role-based access enforced
- ✓ Audit trail for all actions

