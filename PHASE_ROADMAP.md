# AquaTrack Roadmap to Professional Self-Managed Portal

**Status:** Phase 1 Complete ✅  
**Last Updated:** March 23, 2026

---

## What Was Just Done: Phase 1 - Custom Role System ✅

**Commit:** `c4351b2`

### Changes Made
1. **Auth context now loads custom positions** at login from Firestore `positions` collection
2. **Added permission checking methods:**
   - `hasPermission(key)` → Check single permission
   - `hasAnyPermission(...keys)` → Check multiple permissions
3. **Added `positionId` to AppUser** → Tracks actual position, not just normalized role
4. **Backward compatible:** Built-in roles still work, custom roles now also work

### How It Works Now
```
User logs in
  ↓
Auth checks: is positionId a custom position ID?
  ↓
  If yes → Load Position from Firestore, get permissions
  If no → Use built-in role (admin/sr_guard/pool_tech/lifeguard)
  ↓
Set user.role (for backward compat) + permissions context
  ↓
Components can now call useAuth().hasPermission('canViewDocuments')
```

### What's Still Missing (Phases 2-6)

---

## Phase 2: Unify Document System (HIGH PRIORITY)

**Impact:** Massive — uploads won't show everywhere until fixed  
**Effort:** 6-10 hours  
**Blocker for:** Mobile docs, training page, documents page

### The Problem

| Page | Collection | Schema | Notes |
|------|-----------|--------|-------|
| `/documents` | `documents` | `url`, `category`, `accessLevel` | Old schema |
| `/admin/documents-library` | `documents_library` | `fileUrl`, `type`, `accessRoles` | New schema |
| `/training` | `documents` | Old schema | Reads same as documents page |
| Mobile Docs | None | Placeholder | Says "coming soon" |

**When an admin uploads in Document Library:** ✅ File goes to Storage, ❌ metadata ignored by other pages

### What to Do

1. **Pick one collection:** `documents_library` (already has upload working)
2. **Migrate old docs:** Transform `documents` → `documents_library` schema
3. **Update schemas:** Make sure `fileUrl` and `accessRoles` are consistent
4. **Update all readers:**
   - `/documents` page → read `documents_library`
   - `/training` page → read `documents_library` filtered by `type='training'`
   - Mobile Docs tab → read `documents_library`
5. **Test upload → view flow** end-to-end

### Code Locations
- Upload: [web/app/(app)/admin/documents-library/page.tsx](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/admin/documents-library/page.tsx#L86)
- Reader: [web/app/(app)/documents/page.tsx](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/documents/page.tsx)
- Training: [web/app/(app)/training/page.tsx](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/training/page.tsx)

---

## Phase 3: Unify Task System (HIGH PRIORITY)

**Impact:** One source of truth for shifts, checklists, tasks  
**Effort:** 12-16 hours  
**Blocker for:** Mobile tasks, shift reports accuracy

### The Problem

| Page | Source | Notes |
|------|--------|-------|
| `/dashboard` | `DEMO_TASKS` hardcoded | + `task_completions` from Firestore — not real |
| Shift checklist | `shift_checklists` from Firestore | Real data ✅ |
| Shift reports | `shift_reports` from Firestore | Real data ✅ |
| Mobile Tasks | None | Placeholder "will mirror web app" |

**Two task models exist. Neither talks to the other.**

### What to Do

**Option A (Recommended):** Unify around `shift_tasks` + `shift_checklists`
```
1. Dashboard: Replace DEMO_TASKS with real shift_tasks
2. Shift page: Use shift_tasks + shift_checklists
3. Mobile: Implement real Tasks tab reading shift_tasks
4. Remove DEMO_TASKS and DEMO_AUDITS_NEEDED from dashboard
```

**Option B:** Create a single "tasks" model that covers both shift tasks and personal tasks
```
1. New collection: tasks (with shift_id, assigned_to, type, etc.)
2. Merge DEMO_TASKS into this model
3. Update all pages to read from tasks
4. Maintain backward compat with shift_checklists for now
```

**Pick Option A** — it's cleaner and already 70% built.

### Code Locations
- Dashboard: [web/app/(app)/dashboard/page.tsx](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/dashboard/page.tsx#L1) (lines 1-50: DEMO_TASKS)
- Shift checklist: [web/app/(app)/shift-checklist/page.tsx](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/shift-checklist/page.tsx)
- Mobile: [mobile/lib/home_screen.dart](https://github.com/ParthD25/AquaTrack/blob/main/mobile/lib/home_screen.dart#L1)

---

## Phase 4: Real Admin Console (HIGH PRIORITY)

**Impact:** Owner can manage staff from one place  
**Effort:** 10-14 hours  
**Blocker for:** Professional UX, owner trust

### The Problem

- `/admin` root page still loads `DEMO_DOCS`, `MOCK_USERS`, `DEMO_HISTORY`
- Buttons like "Upload Document" and "Send Invite" render but do nothing
- Real staff actions are hidden in `/staff` page table

### What to Do

1. **Replace `/admin` root page** with Staff Lifecycle Management Console:
   ```
   - List all staff (read from staff collection)
   - For each staff member, show action buttons:
     ✅ Promote (change position)
     ✅ Demote (change position)
     ❌ Activate (update status)
     ❌ Deactivate (update status)
     ❌ Revoke Access (disable Firebase user)
     ❌ Archive (soft-delete)
     ❌ Restore (un-archive)
     ❌ Delete Permanently (hard-delete)
     ❌ Reset Password (generate reset link)
     ❌ Hide from Directory (toggle visibility)
   - Show change history for each action
   ```

2. **Remove mock admin pages:**
   - Delete: `DEMO_DOCS`, `MOCK_USERS`, `DEMO_HISTORY`
   - Delete: non-functional buttons ("Upload Document", "Send Invite", "Add Shift")

3. **Wire real actions:**
   - Promote → API call to update `staff.positionId` + `users.positionId`
   - Revoke → Call `/api/admin/revoke-user`
   - Reset Password → Call `/api/admin/reset-password`
   - Delete → Call `/api/admin/delete-staff`
   - Archive → Update `status: 'archived'` in staff doc

4. **Add audit log display:**
   - Show last changed, changed by, reason (if provided)
   - Use real audit_log collection data

### Code Locations
- Admin root: [web/app/(app)/admin/page.tsx](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/admin/page.tsx)
- Staff actions (already working): [web/app/(app)/staff/page.tsx#L100-200](https://raw.githubusercontent.com/ParthD25/AquaTrack/main/web/app/%28app%29/staff/page.tsx)

---

## Phase 5: Real Audit & History (MEDIUM PRIORITY)

**Impact:** Compliance, transparency  
**Effort:** 4-6 hours

### What to Do

1. **Replace `/admin` DEMO_HISTORY** with real `audit_log` collection data
2. **Log new events:**
   - Custom position created/updated
   - Document uploaded
   - Staff status changed
   - Access revoked
   - Password reset requested

3. **Create audit page** showing:
   - What changed
   - Who changed it
   - When
   - Why (if reason provided)

### Code Location
- Admin history section: [web/app/(app)/admin/page.tsx#L200-250](https://github.com/ParthD25/AquaTrack/blob/main/web/app/%28app%29/admin/page.tsx)

---

## Phase 6: Mobile Parity (MEDIUM PRIORITY)

**Impact:** Feature completeness  
**Effort:** 16-20 hours  
**Blocker for:** Production mobile app

### What to Do

1. **Tasks Tab:**
   - Replace placeholder with real `shift_tasks` reader
   - Show tasks for current shift
   - Allow task completion toggle
   - Sync with web checklist system

2. **Audits Tab:**
   - Currently shows staff directory
   - Either make it a real audit viewer OR hide it

3. **Docs Tab:**
   - Replace placeholder with real `documents_library` reader
   - Show training docs, forms, etc.
   - Allow download/view

4. **AI Button:**
   - Either remove or implement real mobile AI feature
   - Don't sell capability you don't have yet

5. **Home Dashboard:**
   - Replace hard-coded shift ("Morning 5:30 AM")
   - Read real shift data from Firestore
   - Show real task completion count

6. **Auth:**
   - Update mobile auth to use updated auth-context
   - Ensure custom roles work on mobile too

### Code Locations
- Mobile home: [mobile/lib/home_screen.dart](https://github.com/ParthD25/AquaTrack/blob/main/mobile/lib/home_screen.dart)
- Mobile auth: Check Flutter `lib/firebase_options.dart`

---

## Bonus: Certification System (MEDIUM PRIORITY)

**Impact:** Compliance tracking  
**Effort:** 8-12 hours

### Current State
- ✅ Can view and edit expiration dates inline
- ❌ Cannot create cert types
- ❌ Cannot assign required certs by role
- ❌ Cannot upload proof documents
- ❌ Cannot auto-expire by policy
- ❌ Cannot bulk import

### What to Do

1. **Admin: Cert Type Management**
   - Create new cert types
   - Set auto-expiration policy (e.g., CPR expires 24 months)
   - Assign required certs by position

2. **Admin: Bulk Import**
   - Upload CSV or spreadsheet
   - Parse staff + cert expiry
   - Bulk update staff records

3. **Staff: Upload Proof**
   - Cert page has "Upload Proof" button
   - Stores in `documents_library` linked to cert record

4. **Admin: Expiration Report**
   - Show certs expiring within 30/60/90 days
   - Auto-notify staff

### Code Location
- Cert page: [web/app/(app)/certs/page.tsx](https://raw.githubusercontent.com/ParthD25/AquaTrack/main/web/app/%28app%29/certs/page.tsx)

---

## Summary: What Blocks What

```
Phase 1 ✅ Custom Roles
  └─→ Everything (auth now works for custom positions)

Phase 2: Documents ⚠️ BLOCKS
  └─→ Phase 6 (Mobile can't have real docs until schema unified)

Phase 3: Tasks ⚠️ BLOCKS
  └─→ Phase 6 (Mobile can't have real tasks)

Phase 4: Admin Console 🔴 CRITICAL (for owner UX)
  └─→ Professional product readiness

Phase 5: Audit 🟡 Nice to have
  └─→ Compliance & transparency

Phase 6: Mobile 🔴 CRITICAL (for product completeness)
  └─→ Depends on Phases 2, 3
```

## Recommended Order

1. **Phase 2: Documents** (6-10 hrs) — Unblock mobile + trust
2. **Phase 3: Tasks** (12-16 hrs) — Unblock mobile + coherence
3. **Phase 4: Admin Console** (10-14 hrs) — Owner self-service
4. **Phase 6: Mobile** (16-20 hrs) — Feature parity
5. **Phase 5: Audit** (4-6 hrs) — Compliance

**Phases 2 + 3 can run in parallel** if you have two developers.

---

## How to Track Progress

After each phase, verify:
- [ ] No hardcoded demo data
- [ ] All pages reading from same collection
- [ ] Actions have real API calls
- [ ] Changes persist in Firestore
- [ ] Mobile reflects web changes
- [ ] Owner can complete workflow without code

---

**Next Step:** Start Phase 2 (Document unification)
