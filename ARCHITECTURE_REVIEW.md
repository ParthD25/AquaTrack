# DigiTracker Architecture Review & Remediation Plan

**Date**: March 23, 2026  
**Status**: Strategic Planning Phase  
**Prepared for**: Development Team

---

## Executive Summary

The current DigiTracker codebase suffers from **9 critical structural defects** and **3 significant organizational anti-patterns**. These are not bugs in individual features—they are architectural misalignments that make the system unprofessional, unmaintainable, and impossible to hand off to an owner. The root causes are:

1. **Data model fragmentation**: Multiple collections represent the same domain (documents, documents_library)
2. **Role/permission inflation**: Hard-coded 4-role model instead of flexible position-based permissions
3. **Content chaos**: Fragmented exports + inconsistent naming in the root repository
4. **Feature incompleteness**: Routes promised in UI don't exist in code; mobile is a hollow shell
5. **Task system confusion**: Three overlapping task patterns with no unified model

This review provides a **tier-based remediation strategy** and detailed file reorganization plan.

---

## Part 1: The 9 Critical Problems

### Problem 1: No Single Document Source of Truth

**Current State**:
- Admin upload page writes to `documents_library` with fields: `fileUrl`, `category`, `accessRoles`, `type`
- Documents page reads from `documents` collection with fields: `url`, `accessLevel`, `title`, `year`
- Training page reads from `documents`, not `documents_library`
- **Result**: Admin upload does NOT power user-facing pages

**Impact**: Admin work is invisible to staff. Content changes don't propagate.

**Owner Impact**: Confusing to manage—uploads disappear from view.

---

### Problem 2: Inventory Route Promised But Not Built

**Current State**:
- Sidebar includes `/inventory` link
- Protected route tree has: `admin`, `audits`, `certs`, `dashboard`, `documents`, `seniors`, `staff`, `training`
- No `/inventory` route exists in app

**Impact**: Page crashes on click; feature is complete UI theater.

**Owner Impact**: Looks broken immediately.

---

### Problem 3: Certifications Are Hard-Coded

**Current State**:
- Six cert types are baked in: lifeguard, CPR/AED, O2, waterpark, Title 22, swim instructor
- No cert template manager; no "add new cert type" feature
- No per-role cert requirements table
- No proof upload flow in codebase

**Impact**: Any new cert type requires code changes. Certs can't be managed by staff.

**Owner Impact**: Locked into six types forever; can't adapt to facility needs.

---

### Problem 4: Role System Is Still Hard-Coded

**Current State**:
- Four roles only: `admin`, `sr_guard`, `pool_tech`, `lifeguard`
- Staff page writes `role: positionId` to users doc, but...
- Auth layer, sidebar, Firestore rules still check against the four hard-coded roles
- Custom positions from Admin Settings become data field, not permission model

**Impact**: Position changes don't cascade; sidebar visibility doesn't change; rules don't update.

**Owner Impact**: Promotions don't work; new position types are silent failures.

---

### Problem 5: Legacy Portal Sections Missing

**Current State**:
- Old senior-guard portal had: Calendar, Infractions, Swim Lessons, Orientation, Staff Training, When to Work, Links
- Current route tree is much smaller
- Most old areas exist only as uploaded documents, not workflows

**Impact**: Feature regression. Sections users knew are gone.

**Owner Impact**: Feels like downgrade; staff loses access to familiar tools.

---

### Problem 6: Web and Mobile Are Out of Sync

**Current State**:
- Mobile AI button: "Coming soon to mobile"
- Mobile Tasks: "Tasks list will mirror web app"
- Mobile Audits: Actually shows staff directory, not audits
- Mobile Documents: Placeholder text only
- Mobile Dashboard: Hard-coded morning shift + "0 of 4 tasks"

**Impact**: Mobile is a broken shell. Data doesn't match web.

**Owner Impact**: Mobile is unusable; staff confusion about which version is real.

---

### Problem 7: Two Separate Task Systems

**Current State**:
- Dashboard listens to `task_completions` (user + date keyed)
- Admin shift task page manages `shift_tasks`
- Shift checklist page creates `shift_checklists`
- Firestore rules allow ANY staff user to read/write `task_completions`

**Impact**: Task data is scattered. No unified reporting. Collisions and overwrites possible.

**Owner Impact**: Can't trust task completion data; no audit trail.

---

### Problem 8: Archive Import Is Still Simulated

**Current State**:
- Archives page creates `mockFiles`
- Simulates detection
- Waits 2 seconds
- Auto-marks as imported

**Impact**: Demo code in production. Doesn't actually ingest anything.

**Owner Impact**: Archive feature doesn't work; looks like a toy demo.

---

### Problem 9: Document Upload Requires Manual Firebase Setup

**Current State**:
- Upload page throws alerts if Storage isn't configured
- Tells admin to create bucket manually
- No automated setup in admin bootstrap

**Impact**: Deployment requires manual Firebase steps—not owner-friendly.

**Owner Impact**: Broken setup experience; requires technical knowledge to fix.

---

## Part 2: Organizational Anti-Patterns

### Anti-Pattern 1: Fragmented Content Library

**Current State**:
```
repo-root/
├── Aquatic Checklist Forms/          (in dated export)
├── drive-download-20260321T023049Z.../
│   └── Aquatic Checklist Forms/      (duplicate)
├── Staff Forms/                       (in dated folder)
├── Staff Forms -20260321.../
│   └── Staff Forms/                  (duplicate)
├── Senior Lifeguard/                 (in dated folder)
├── drive-download-20260321.../
│   └── Senior Lifeguard/             (duplicate)
├── Incident report 2024.pdf          (loose at root)
├── LG Availability_Eligibility.xlsx  (loose at root)
└── VAT files...                      (loose at root)
```

**Problem**: Same content in multiple places. Unclear which is canonical. Manual dedup required.

---

### Anti-Pattern 2: Inconsistent File Naming

**Current State**:
- Spaces: `AED Daily Checklist.pdf`
- Underscores: `Daily_Weekly LG Checklist`
- Duplicates: `Chemical and First Aid Inventory (1).docx`
- Typos: `Wildfire Smoke Traning_ 2020.pdf`
- Machine exports: `entries+for+swimming+remix.mp4`
- Junk: `Untitled document.docx`

**Problem**: Search, automation, and management become guesswork.

---

### Anti-Pattern 3: Admin Page Uses Mock Data

**Current State**:
- Admin root page seeds from `DEMO_DOCS` and `MOCK_USERS`
- Some sub-pages are real; root behaves like prototype

**Problem**: Admin hub looks functional but isn't; creates confusion about what's prod.

---

## Part 3: Proposed Content Structure

Use a **separate, clean content library** (outside app repo) with this hierarchy:

```
content-library/
├── 01_operations/
│   ├── 01_checklists/
│   │   ├── aed/
│   │   ├── oxygen/
│   │   ├── daily-weekly-lifeguard/
│   │   ├── pre-opening/
│   │   ├── chemical-inventory/
│   │   └── maintenance/
│   ├── 02_audits/
│   │   ├── cpr/
│   │   ├── vat/
│   │   └── swim-instructor/
│   ├── 03_incident-and-rescue/
│   │   ├── incident-reports/
│   │   └── rescue-reports/
│   ├── 04_inventory/
│   └── 05_manuals-and-reference/
│       ├── lifeguard/
│       ├── facility-om/
│       └── equipment/
├── 02_staff/
│   ├── 01_hr-forms/
│   │   ├── onboarding/
│   │   ├── payroll/
│   │   ├── leave-and-absence/
│   │   ├── emergency/
│   │   └── resignation/
│   ├── 02_policies/
│   │   ├── driver-clearance/
│   │   └── workplace-injury/
│   └── 03_agreements/
│       └── senior-guard/
├── 03_training/
│   ├── 01_senior-lifeguard-orientation/
│   │   ├── core/
│   │   ├── waterslide-inspector/
│   │   └── ada/
│   ├── 02_swim-lessons/
│   │   ├── manuals/
│   │   ├── report-cards/
│   │   ├── testing/
│   │   ├── activities-and-games/
│   │   └── videos/
│   ├── 03_pool-tech/
│   │   └── sign-off-sheets/
│   └── 04_safety-and-compliance/
├── 04_scheduling-and-rosters/
│   ├── 01_master-class/
│   ├── 02_skills-boost/
│   ├── 03_roster-templates/
│   └── 04_availability-and-eligibility/
└── 99_archive/
    ├── old-forms/
    ├── legacy/
    └── by-year/
```

### File Naming Standard

**Pattern**: `area_subarea_title_year_v01.ext`

**Examples**:
- `ops_checklist_aed_daily_v01.pdf`
- `ops_audit_vat_record_2024_v01.xlsx`
- `staff_form_direct_deposit_request_v01.pdf`
- `train_orientation_senior_guard_core_v01.pdf`
- `roster_master_class_2026_v01.xlsx`

---

## Part 4: Remediation Roadmap

### Tier 1: Critical (Blocking Production Handoff)

These must be fixed before the owner takes control.

#### 1.1: Unify Document Collection
- **Effort**: Moderate (2–3 days)
- **Scope**:
  - Merge `documents` + `documents_library` → single `documents` collection
  - New schema: `title`, `slug`, `section`, `subsection`, `roleScope`, `storagePath`, `mimeType`, `year`, `version`, `status`, `tags`, `externalUrl`, `previewType`, `sortOrder`
  - Migrate all old records with data transformation
  - Update Documents, Training, Audits, Mobile pages to read from one collection
- **Deliverable**: One collection + three pages reading from it
- **Owner Benefit**: Admin uploads immediately visible everywhere

#### 1.2: Implement Flexible Role/Permission Engine
- **Effort**: Moderate (2–3 days)
- **Scope**:
  - Decouple `position` from `role`
  - Create permission templates that map position → capabilities
  - Update Firestore rules to check permission templates, not hard-coded roles
  - Update auth context to read permissions from template, not role field
  - Update sidebar visibility based on permissions, not role name
- **Deliverable**: Position changes cascade; sidebar/rules/auth stay in sync
- **Owner Benefit**: New positions don't require code changes

#### 1.3: Complete Inventory Route & Page
- **Effort**: Small (1 day)
- **Scope**:
  - Create `/app/(app)/inventory/page.tsx`
  - Link to inventory tracking (use `storagePath` from documents collection to derive inventory counts)
  - Or integrate with internal inventory collection if one exists
- **Deliverable**: Working inventory page; sidebar link doesn't crash
- **Owner Benefit**: Promised feature exists

#### 1.4: Unify Task System
- **Effort**: Moderate (2–3 days)
- **Scope**:
  - Retire dashboard `task_completions` pattern
  - Consolidate all tasks → `shift_tasks` + `shift_checklists`
  - Add per-user, per-shift write scope to Firestore rules
  - Update dashboard to read from `shift_tasks` with proper filtering
- **Deliverable**: One task model; scoped, auditable writes
- **Owner Benefit**: Reliable task tracking; no collisions

#### 1.5: Clean Root Repository Structure
- **Effort**: Small (½ day)
- **Scope**:
  - Remove all `drive-download-*`, dated export folders
  - Consolidate content → single clean structure (or move to separate repo)
  - Delete duplicate files
  - Rename files to standard naming (area_subarea_title_year_v01.ext)
- **Deliverable**: Clean root; content organized by standard
- **Owner Benefit**: Professional appearance; no confusion

---

### Tier 2: High Priority (Feature Completeness)

These restore missing functionality within 2–3 sprints.

#### 2.1: Implement Admin Cert Manager
- **Effort**: Moderate (2 days)
- **Scope**:
  - Create cert template collection in Firestore
  - Build admin UI to add/edit/delete cert types
  - Add per-position cert requirements table
  - Implement proof upload flow in staff cert page
- **Deliverable**: Owner can add new cert types; staff can upload proofs
- **Owner Benefit**: Certs adapt to facility needs; no code changes required

#### 2.2: Restore & Rebuild Legacy Portal Sections
- **Effort**: High (3–5 days per section)
- **Sections**:
  - **Calendar**: Schedule view; sync with rosters
  - **Infractions**: Staff misconduct log with tracking
  - **Swim Lessons**: Structured lesson management, scheduling, progress tracking
  - **Orientation**: Guided onboarding workflow
  - **Staff Training**: Agenda builder + training calendar
  - **When to Work**: Availability self-service
  - **External Links**: Managed shortcuts to external resources
- **Deliverable**: Each as first-class route + data model
- **Owner Benefit**: Feature parity restored; staff has familiar workflows

#### 2.3: Achieve Web/Mobile Parity
- **Effort**: High (5–7 days)
- **Scope**:
  - Tasks tab: Real task list from `shift_tasks`
  - Audits tab: Real audits (not staff directory)
  - Documents tab: Real documents from `documents` collection
  - AI tab: Wire real AI chat (or remove "coming soon")
  - Dashboard: Real shift data + task progress
- **Deliverable**: Mobile reads same Firestore collections as web
- **Owner Benefit**: Consistent experience; staff doesn't pick between versions

---

### Tier 3: Professional Polish (Quality & UX)

These improve owner experience in future sprints.

#### 3.1: Automated Firebase Setup
- **Effort**: Small (1 day)
- **Scope**:
  - Detect missing Storage bucket in admin bootstrap
  - Provision bucket automatically via Firebase Admin SDK
  - Remove manual setup instructions
- **Deliverable**: Upload page never shows error; setup is silent
- **Owner Benefit**: Instant deployment; no Firebase knowledge required

#### 3.2: Real Archive Ingestion
- **Effort**: Moderate (2 days)
- **Scope**:
  - Replace mock flow with real archive scan/ingest
  - Parse actual file metadata + timestamps
  - Classify to correct collection + path
  - Log ingestion events
- **Deliverable**: Archive page actually imports files
- **Owner Benefit**: Historical content gets organized automatically

#### 3.3: Admin Demo-to-Prod Data Migration
- **Effort**: Small (½ day)
- **Scope**:
  - Delete seeded `DEMO_DOCS` and `MOCK_USERS` from admin page
  - Replace with real data fetch (or empty state)
- **Deliverable**: Admin page is live immediately on open
- **Owner Benefit**: No confusion between demo and real

---

## Part 5: File Remapping for Content Library

### From Aquatic Checklist Forms

| Current | → Target |
|---------|----------|
| AED Daily Checklist.pdf | 01_operations/01_checklists/aed/ops_checklist_aed_daily_v01.pdf |
| Chemical Check Log.pdf | 01_operations/01_checklists/chemical-inventory/ops_checklist_chemical_daily_v01.pdf |
| Chemical and First Aid Inventory Monthly Checklist.docx | 01_operations/04_inventory/ops_inventory_chemical_ai_monthly_v01.docx |
| Daily_Weekly LG Checklist - Offseason_.docx | 01_operations/01_checklists/daily-weekly-lifeguard/ops_checklist_lg_offseason_v01.docx |
| Daily_Weekly LG Checklist - Summer.docx | 01_operations/01_checklists/daily-weekly-lifeguard/ops_checklist_lg_summer_v01.docx |
| Incident report 2024.pdf | 01_operations/03_incident-and-rescue/incident-reports/ops_report_incident_2024_v01.pdf |
| Monthly Maintenance Sheet 2023(Offseason).docx | 01_operations/01_checklists/maintenance/ops_checklist_maintenance_offseason_2023_v01.docx |
| Monthly Maintenance Sheet 2023(Onseason).docx | 01_operations/01_checklists/maintenance/ops_checklist_maintenance_onseason_2023_v01.docx |
| Oxygen Daily Checklist.pdf | 01_operations/01_checklists/oxygen/ops_checklist_oxygen_daily_v01.pdf |
| Pre-Opening Inspection Check Log 2023.docx | 01_operations/01_checklists/pre-opening/ops_checklist_preopening_2023_v01.docx |
| RESCUE REPORT 2024.pdf | 01_operations/03_incident-and-rescue/rescue-reports/ops_report_rescue_2024_v01.pdf |
| Untitled document.docx | 99_archive/legacy/review-needed/untitled_document_v01.docx |
| Old Forms/ | 99_archive/old-forms/ |

### From Staff Forms

| Current | → Target |
|---------|----------|
| Change of Address Form.pdf | 02_staff/01_hr-forms/onboarding/staff_form_change_address_v01.pdf |
| Direct Deposit Request Form.pdf | 02_staff/01_hr-forms/payroll/staff_form_direct_deposit_v01.pdf |
| ESuite Account Setup.pdf | 02_staff/01_hr-forms/onboarding/staff_form_esuite_setup_v01.pdf |
| Emergency Form.pdf | 02_staff/01_hr-forms/emergency/staff_form_emergency_contact_v01.pdf |
| Notice of Resignation Paperwork.pdf | 02_staff/01_hr-forms/resignation/staff_form_resignation_v01.pdf |
| PST Absence Request_Ver.2024.02.pdf | 02_staff/01_hr-forms/leave-and-absence/staff_form_absence_request_2024_v01.pdf |
| Paid Sick Time Policy Updates January 2024.pdf | 02_staff/02_policies/staff_policy_sick_time_2024_v01.pdf |

### From Senior Lifeguard Orientation

| Current | → Target |
|---------|----------|
| 2024 Slide & Lazy River INSPECTOR Training_.docx | 03_training/01_senior-lifeguard-orientation/waterslide-inspector/train_orientation_waterslide_inspector_2024_v01.docx |
| ADA Chairlift Instructions.pdf | 03_training/01_senior-lifeguard-orientation/ada/train_orientation_ada_manual_v01.pdf |
| ADA Information.pdf | 03_training/01_senior-lifeguard-orientation/ada/train_orientation_ada_info_v01.pdf |
| DMV.pdf | 02_staff/02_policies/staff_policy_driver_clearance_v01.pdf |
| Newark Critical Incident Stress Management 2018.pdf | 03_training/04_safety-and-compliance/train_safety_cism_plan_2018_v01.pdf |
| Pool Service Room Scantrol Quick Reference.pdf | 01_operations/05_manuals-and-reference/equipment/ops_manual_scantrol_reference_v01.pdf |
| Reporting Agreement for Senior Lifeguards.docx.pdf | 02_staff/03_agreements/senior-guard/staff_agreement_reporting_lg_v01.pdf |
| Senior Lifeguard Orientation Training.pdf | 03_training/01_senior-lifeguard-orientation/core/train_orientation_senior_guard_core_v01.pdf |
| VAT Audit Sheet.pdf | 01_operations/02_audits/vat/ops_audit_vat_sheet_v01.pdf |
| What To Do When An Employee is Injured.pdf | 02_staff/02_policies/staff_policy_injury_response_v01.pdf |

### From Senior Lifeguard

| Current | → Target |
|---------|----------|
| 2021 Swim Lesson Preschool Report Cards.pdf | 03_training/02_swim-lessons/report-cards/train_swim_reportcard_preschool_2021_v01.pdf |
| 2021 Swim Lesson Youth Report Cards.pdf | 03_training/02_swim-lessons/report-cards/train_swim_reportcard_youth_2021_v01.pdf |
| 2023–2026 Master Class Roster.xlsx | 04_scheduling-and-rosters/01_master-class/roster_master_class_YYYY_v01.xlsx |
| 2026 Master Skills Boost Roster.xlsx | 04_scheduling-and-rosters/02_skills-boost/roster_skills_boost_2026_v01.xlsx |
| Sunday Skills Boost Rosters.xlsx | 04_scheduling-and-rosters/02_skills-boost/roster_skills_boost_sunday_v01.xlsx |
| Chemical Check Log.docx | 01_operations/01_checklists/chemical-inventory/ops_checklist_chemical_daily_v01.docx |
| Family Tot & Preschool Swimming - Images, Games, Songs.pdf | 03_training/02_swim-lessons/activities-and-games/train_swim_activities_tots_preschool_v01.pdf |
| Games.pdf | 03_training/02_swim-lessons/activities-and-games/train_swim_activities_games_v01.pdf |
| Level Record Sheet.docx | 03_training/02_swim-lessons/testing/train_swim_testing_level_record_v01.docx |
| Senior Swim Lesson Goals & Expectations.pdf | 03_training/02_swim-lessons/manuals/train_swim_manual_goals_expectations_v01.pdf |
| Swim Instructor Audit.pdf | 01_operations/02_audits/swim-instructor/ops_audit_swim_instructor_v01.pdf |
| Swim Instructor Manual 2018.docx.pdf | 03_training/02_swim-lessons/manuals/train_swim_manual_instructor_2018_v01.pdf |
| Swim Lesson Roster Templates (Weekday/Weekend).xlsx | 04_scheduling-and-rosters/03_roster-templates/roster_swim_lesson_template_PERIOD_v01.xlsx |
| Teaching Activities, Drills, Games.pdf | 03_training/02_swim-lessons/activities-and-games/train_swim_activities_teaching_v01.pdf |
| Testing Guide 2018.pdf | 03_training/02_swim-lessons/testing/train_swim_testing_guide_2018_v01.pdf |
| USMS Adult Learn to Swim Manual.pdf | 03_training/02_swim-lessons/manuals/train_swim_manual_usms_adult_v01.pdf |
| USMS Adult Learn to Swim Training Powerpoint.pdf | 03_training/02_swim-lessons/manuals/train_swim_manual_usms_adult_ppt_v01.pdf |

### From Mixed Drive-Download Root

| Current | → Target |
|---------|----------|
| 2022 Absence Request Areas to Complete.jpg | 02_staff/01_hr-forms/leave-and-absence/staff_form_absence_request_guide_2022_v01.jpg |
| 2022 Absence_Request.pdf | 02_staff/01_hr-forms/leave-and-absence/staff_form_absence_request_2022_v01.pdf |
| 37424 Group A O&M Manual - signed.pdf | 01_operations/05_manuals-and-reference/facility-om/ops_manual_om_group_a_signed_v01.pdf |
| 37424 Group P O&M - signed.pdf | 01_operations/05_manuals-and-reference/facility-om/ops_manual_om_group_p_signed_v01.pdf |
| BECSystem Quick Reference.pdf | 01_operations/05_manuals-and-reference/equipment/ops_manual_becsystem_reference_v01.pdf |
| LG Availability_Eligibility.xlsx | 04_scheduling-and-rosters/04_availability-and-eligibility/roster_lg_availability_eligibility_v01.xlsx |
| Lifeguard CPR Audit.docx | 01_operations/02_audits/cpr/ops_audit_cpr_lifeguard_v01.docx |
| SFAC Lifeguard Manual.pdf | 01_operations/05_manuals-and-reference/lifeguard/ops_manual_lifeguard_sfac_v01.pdf |
| SFAC Swim Lesson Manual 2018.pdf | 03_training/02_swim-lessons/manuals/train_swim_manual_sfac_2018_v01.pdf |
| VAT Audit Sheet.docx | 01_operations/02_audits/vat/ops_audit_vat_sheet_v01.docx |
| VAT Record Sheet_.xlsx | 01_operations/02_audits/vat/ops_audit_vat_record_2024_v01.xlsx |
| Waterslide Operator Training Sign Off Sheet.docx | 03_training/03_pool-tech/sign-off-sheets/train_pooltech_waterslide_signoff_v01.docx |
| pool tech waterslide training sign off sheet.doc.docx | 03_training/03_pool-tech/sign-off-sheets/train_pooltech_waterslide_signoff_v01.docx |
| Wildfire Smoke Traning_ 2020.pdf | 03_training/04_safety-and-compliance/train_safety_wildfire_smoke_2020_v01.pdf |
| entries+for+swimming+remix.mp4 | 03_training/02_swim-lessons/videos/train_swim_video_entries_remix_v01.mp4 |

---

## Part 6: Implementation Sequencing

### Week 1: Foundation
1. **Unify Document Collection** (1.1)
2. **Clean Root Structure** (1.5)
3. **Migrate File Organization** (1.5 + remapping)

### Week 2–3: Core Systems
1. **Implement Flexible Permissions** (1.2)
2. **Unify Task System** (1.4)

### Week 3: Completeness
1. **Inventory Route** (1.3)
2. **Cert Manager** (2.1) — start

### Week 4+: Feature Restoration
1. **Cert Manager** (2.1) — finish
2. **Legacy Sections** (2.2) — Calendar, Infractions, Swim Lessons, Orientation
3. **Web/Mobile Parity** (2.3)

### Polish Phase (optional)
1. Auto Firebase setup (3.1)
2. Real archive ingest (3.2)
3. Admin demo-to-prod (3.3)

---

## Part 7: Success Criteria

### By End of Tier 1
- ✅ Admin uploads immediately visible on Documents, Training, Audits, Mobile
- ✅ Inventory page doesn't crash
- ✅ Task data is reliable and auditable
- ✅ Position changes cascade to sidebar, rules, auth
- ✅ Root repository is clean; content follows one naming standard

### By End of Tier 2
- ✅ Owner can add/manage cert types without code changes
- ✅ All legacy sections exist as real routes + workflows
- ✅ Mobile and web read from same Firestore collections
- ✅ Staff experience is consistent across platforms

### By End of Tier 3
- ✅ Setup is fully automated; owner never sees manual Firebase steps
- ✅ Archive ingestion is a real, auditable process
- ✅ No demo data; everything is production

---

## Appendix A: Current vs. Proposed Comparison

| Area | Current | Proposed |
|------|---------|----------|
| **Document Collections** | documents + documents_library | documents (unified) |
| **Roles** | 4 hard-coded | Position-based + permission templates |
| **Task Systems** | 3 separate patterns | 1 unified (shift_tasks + shift_checklists) |
| **Content Location** | Fragmented, duplicated, messy | Organized hierarchy + standard naming |
| **Certs** | Fixed 6 types | Admin-managed templates |
| **Inventory** | Promised, non-functional | Real route + tracking |
| **Mobile** | Hollow shell | Feature parity with web |
| **Admin Hub** | Demo-driven | Production data |
| **Firebase Setup** | Manual | Automated |

---

## Appendix B: Firestore Schema for Unified Documents

```typescript
interface DocumentLibraryItem {
  id: string;
  title: string;                     // e.g., "AED Daily Checklist"
  slug: string;                      // e.g., "aed-daily-checklist"
  section: string;                   // e.g., "01_operations"
  subsection: string;                // e.g., "01_checklists"
  category: string;                  // e.g., "aed" (for filtering)
  roleScope: string[];               // e.g., ["admin", "sr_guard", "lifeguard"]
  storagePath: string;               // e.g., "content-library/01_operations/01_checklists/aed/ops_checklist_aed_daily_v01.pdf"
  mimeType: string;                  // e.g., "application/pdf"
  year?: number;                     // e.g., 2024
  version: number;                   // e.g., 1 (from v01)
  status: "published" | "draft" | "archived";
  tags: string[];                    // e.g., ["safety", "daily-check", "equipment"]
  externalUrl?: string;              // For linked resources
  previewType: "pdf" | "doc" | "sheet" | "video" | "image" | "link";
  sortOrder: number;                 // For custom ordering within subsection
  uploadedAt: timestamp;
  uploadedBy: string;                // User ID
  description?: string;
}
```

---

## Appendix C: Permission Template Schema

```typescript
interface PermissionTemplate {
  id: string;
  name: string;                      // e.g., "Senior Lifeguard"
  positionId: string;                // e.g., "sr_guard"
  capabilities: Capability[];
  docRoles: string[];                // e.g., ["admin", "sr_guard"]
  certRequirements: CertRequirement[];
  sidebarVisibility: SidebarItem[];
  level: number;                     // For hierarchy (higher = more access)
}

interface Capability {
  action: string;                    // e.g., "shift.create", "staff.edit"
  resource?: string;
  conditions?: Record<string, any>;
}
```

---

## Conclusion

This project has a strong foundation but suffers from **incomplete unification**. The fixes are not difficult—they require consolidating overlapping systems, not building new ones. Following this roadmap will transform DigiTracker from a prototype into a production-ready, owner-manageable system.

**Next Step**: Prioritize Tier 1 items and begin unification sprints. Track progress against success criteria.
