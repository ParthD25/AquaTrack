# 🗺️ AquaTrack Navigation & Feature Map

## 🏠 Main Sidebar Structure

```
AQUATRACK
├─ MAIN SECTION
│  ├─ ⊞ Dashboard (/dashboard)
│  ├─ ✓ Audit Tracker (/audits)
│  ├─ 📋 Certs & Retention (/certs)
│  ├─ 📦 Inventory (/inventory)
│  ├─ 👥 Staff Directory (/staff)
│  └─ ✅ Today's Checklist (/shift-checklist) [NEW]
│
├─ RESOURCES SECTION
│  ├─ 📁 Documents (/documents)
│  ├─ 📝 Staff Forms (/documents?category=staff_forms)
│  ├─ ☑ Aquatic Checklists (/documents?category=checklists)
│  ├─ 🏅 Senior Guard (/documents?category=senior_lg)
│  ├─ 🔧 Pool Tech (/documents?category=pool_tech)
│  ├─ 🎓 Training Videos (/documents?category=training)
│  ├─ 🏅 Senior LG Hub (/seniors)
│  ├─ 👤 Meet the Team (/seniors/meet)
│  └─ 🎓 Pool Tech Training (/training)
│
├─ ADMIN SECTION (Admin Only)
│  ├─ ⚙ Admin Settings (/admin)
│  ├─ ✏️ Manage Shift Tasks (/admin/shift-tasks)
│  ├─ 📊 Shift Reports (/admin/shift-reports)
│  └─ 📋 Staff Forms (/admin/staff-forms) [NEW]
│
└─ BOTTOM (Profile Section)
   ├─ 👤 Your Profile (Click to open) (/profile) [NEW]
   ├─ 🌙 Theme Toggle
   └─ Sign Out Button
```

---

## 👤 User Profile Pages

### Profile Page (`/profile`) ✨ NEW
**Accessible to:** Everyone  
**Click:** Your name in bottom-left sidebar

**Tabs:**
1. **Personal** 👤
   - First name
   - Last name
   - Email (view only)
   - Profile photo URL
   - Auto-syncs to staff directory

2. **Contact** 📱
   - Phone number
   - Address (street, city, state, ZIP)
   - Emergency contact name
   - Emergency contact phone
   - Optional fields

3. **Security** 🔒
   - Current password
   - New password
   - Confirm password
   - Minimum 6 characters

---

## 📋 Forms & Management

### Staff Forms Admin Page (`/admin/staff-forms`) ✨ NEW
**Accessible to:** Admins only  
**Navigate:** Admin (gear icon) → Staff Forms

**What You Can Do:**
- ➕ **Create new form**
  - Enter title (required)
  - Add description (optional)
  - Choose category:
    - 📋 General
    - 🚨 Incident
    - ☑️ Checklist
    - 🎓 Training
    - 💬 Feedback
    - ✨ Custom
  - Add fields (9 types available)
  - Mark required fields
  - Save form

- ✏️ **Edit form**
  - Click Edit button on form card
  - Modify title, description, category
  - Add/remove/edit fields
  - Update required status

- 🗑️ **Delete form**
  - Click Delete button
  - Confirm deletion
  - Form permanently removed

### Available Field Types

| Icon | Type | Example |
|------|------|---------|
| 📝 | Short Text | First Name, Incident Location |
| 📄 | Long Text | Detailed Description |
| ✉️ | Email | Contact Email |
| ☎️ | Phone | Emergency Phone |
| 🔢 | Number | Count of Items |
| % | Percentage | Water Clarity 85% |
| ☑️ | Yes/No | "Incident Occurred?" |
| ⬇️ | Dropdown | Select from List |
| 📅 | Date | Incident Date |

---

## ✅ Shift System

### Staff Shift Checklist (`/shift-checklist`)
**Accessible to:** All staff  
**Navigate:** Sidebar → Today's Checklist

**Features:**
- Start shift (one click)
- View tasks by category:
  - 🧪 Chemical
  - 🛡️ Safety
  - 🧹 Cleaning
  - 🔑 Opening
  - 🔒 Closing
  - 🔧 Maintenance
- Check off tasks
- Add notes to tasks
- Progress bar (visual)
- End shift when done

### Admin Shift Task Management (`/admin/shift-tasks`)
**Accessible to:** Admins only  
**Navigate:** Admin → Manage Shift Tasks

**Features:**
- Add new task (title, category, priority)
- Set priority (high, medium, low)
- View all tasks by category
- Delete tasks

### Admin Shift Reports (`/admin/shift-reports`)
**Accessible to:** Admins only  
**Navigate:** Admin → Shift Reports

**Features:**
- View all completed shifts
- Filter by date
- Filter by staff member
- Performance statistics
- Completion percentages
- Staff performance graphs

---

## 👥 Staff Directory

### Staff Directory Page (`/staff`)
**Accessible to:** All staff  
**Navigate:** Sidebar → Staff Directory

**Features:**
- View all staff members
- Search by name
- Filter by position
- Filter by status (active/inactive/former)
- View contact info (based on role permissions)
- Status history timeline
- Inline editing for admin

**Note:** Updates automatically when staff members edit their profile

---

## 📊 Dashboard

### Dashboard Page (`/dashboard`)
**Accessible to:** All staff  
**Navigate:** Sidebar → Dashboard

**Shows:**
- Current shift schedule
- Today's tasks progress
- Staff count
- Audits needed (certifications missing)
- Retention statistics
- Quick stats for your role

---

## 🔐 Admin Controls

### Admin Settings (`/admin`)
**Accessible to:** Admins only  
**Navigate:** Sidebar → Admin Settings

**Tabs:**
1. **Positions** - Manage roles and permissions
2. **Documents** - Control who sees documents
3. **Access** - View permission matrix
4. **Users** - Manage staff accounts
5. **Shifts** - Define shift schedules
6. **History** - View change log

---

## 📁 Role-Based Access

### What Each Role Can See

**👨‍💼 Admin**
- Everything
- Create/edit/delete forms & tasks
- Manage staff & permissions
- View reports & analytics

**🏅 Senior Guard**
- Dashboard, Audits, Certs, Staff, Docs, Training
- Shift Checklist
- View reports (no creation)
- Manage staff status

**🔧 Pool Tech**
- Dashboard, Inventory, Pool Tech Training
- Shift Checklist
- View documents
- View staff directory

**🏊 Lifeguard**
- Dashboard, Staff Directory
- Shift Checklist
- View documents
- Minimal audit/cert access

---

## 🔍 How Profiles Auto-Sync

```
1. Staff member edits profile
   ↓
2. Saves to users/{uid}
   ↓
3. Saves to staff/{uid}
   ↓
4. Other pages refresh automatically
   ↓
5. Staff directory shows new info
   ↓
6. Senior guards see updated contact info
```

**Result:** No manual sync needed, all data updates instantly!

---

## 📱 Key Features at a Glance

| Feature | Location | For | Access |
|---------|----------|-----|--------|
| Edit Profile | /profile | Everyone | Bottom sidebar |
| Create Forms | /admin/staff-forms | Admin | Admin menu |
| Manage Forms | /admin/staff-forms | Admin | Admin menu |
| Start Shift | /shift-checklist | All staff | Main sidebar |
| View Reports | /admin/shift-reports | Admin | Admin menu |
| Audit Tracking | /audits | Sr Guard+ | Main sidebar |
| Cert Management | /certs | Sr Guard+ | Main sidebar |
| Staff Directory | /staff | All staff | Main sidebar |
| Documents | /documents | All staff | Resources menu |

---

## 🎓 Documentation Links

- **IMPLEMENTATION_v1.5.md** - What was built (this version)
- **FEATURES.md** - Complete feature guide
- **QUICK_START.md** - User-friendly tutorial
- **SHIFT_CHECKLIST_GUIDE.md** - Shift system details

---

## 🚀 Getting Started Checklist

**For All Staff:**
- [ ] Log in
- [ ] Agree to confidentiality notice
- [ ] Click profile (bottom left) → Update your info
- [ ] Go to Shift Checklist → Start your shift
- [ ] Complete daily tasks

**For Admins:**
- [ ] Same as above, PLUS:
- [ ] Admin → Staff Forms → Create custom forms
- [ ] Admin → Manage Shift Tasks → Add daily tasks
- [ ] Admin → Shift Reports → View performance

---

## 🔗 Quick Navigation

**Profile Editing**  
Bottom left → Click your name

**Forms Management**  
Sidebar → Admin → Staff Forms

**Shift Tasks**  
Sidebar → Today's Checklist OR  
Admin → Manage Shift Tasks (to create)

**Staff Directory**  
Sidebar → Staff Directory

**Admin Panel**  
Sidebar → Admin → Admin Settings

**Audit Tracking**  
Sidebar → Audit Tracker (Sr Guard+)

**Reports**  
Admin → Shift Reports (Admin only)

---

## ❓ Common Questions

**Q: Where do I edit my profile?**  
A: Click your name in the bottom-left corner → Profile page opens

**Q: How do I create a form?**  
A: Admin → Staff Forms → New Form (admin only)

**Q: Do changes sync automatically?**  
A: Yes! Edit profile → auto-syncs to staff directory instantly

**Q: Can I see other staff phone numbers?**  
A: Yes, most staff can. Senior guards can see all contact info.

**Q: Where do I start my shift?**  
A: Sidebar → Today's Checklist → Start Shift button

**Q: How do I change my password?**  
A: Profile → Security tab → Enter old password and new password

---

**Last Updated:** March 23, 2026  
**Version:** 1.5
