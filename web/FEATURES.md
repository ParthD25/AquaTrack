# 🌊 AquaTrack — Complete Feature Guide

## Overview
AquaTrack is a comprehensive aquatics management platform for SFAC (Silliman Activity and Family Aquatic Center) built with Next.js, Firebase, and role-based access control.

---

## ✅ Core Features Implemented

### 1. **Authentication & Authorization**
- **Firebase Authentication** with email/password and Google Sign-in
- **Role-Based Access Control** with 4 built-in roles:
  - 👨‍💼 **Administrator** (Level 0) - Full system access
  - 🏅 **Senior Guard** (Level 1) - Supervisor functions, audits, staff management
  - 🔧 **Pool Tech** (Level 2) - Chemical management, maintenance
  - 🏊 **Lifeguard** (Level 3) - Basic shift tasks, document access
- **Position-Based Permissions System** - Admin can customize role permissions
- **Confidentiality Notice** - Legal duty-to-act acknowledgment required on first login
- **Password Reset Flow** - Secure password change requirement for new/reset accounts

---

## 📋 Staff Directory & Profile Management

### Staff Directory Page (`/staff`)
- **View all staff** with active/inactive/former status
- **Search and filter** by position and employment status
- **Status history timeline** - Track when staff changed status
- **Contact information** - Phone, email, department
- **Batch status updates** with change history logging
- **Inline editing** for quick updates

### Profile Management Page (`/profile`) ✨ NEW
- **Personal Information**
  - Edit first/last name
  - Update profile photo URL
  - View email address
- **Contact Information**
  - Phone number
  - Home address (street, city, state, ZIP)
  - Emergency contact name & phone
- **Security**
  - Change password
  - Password strength requirements
- **Auto-Sync** - Changes automatically update staff directory

---

## ✓ Audit Tracking System

### Audit Types
1. **VAT** (Vertical Awareness Test)
2. **CPR/AED** (Cardiopulmonary Resuscitation)
3. **Live Recognition** (Water awareness test)
4. **Brick Test** (Diving ability assessment)
5. **Swim Instructor** (WSI certification)

### Features (`/audits`)
- **Track audit completion** for all staff
- **Filter by status** - All, Done, Pending
- **Add audit records** with date, evaluator, notes
- **Audit history** - View previous audits and evaluators
- **Season tracking** (e.g., "Summer 2026")
- **Staff-wide reporting** on audit readiness
- **Need-to-audit dashboard** showing missing certifications

---

## 📜 Certifications & Compliance

### Certification Types
- 🏊 **Lifeguard** (24-month renewal)
- 💓 **CPR/AED** (24-month renewal)
- 🫁 **Emergency O2** (24-month renewal)
- 🌊 **Waterpark LG** (24-month renewal)
- 📜 **Title 22** (12-month renewal)
- 🎓 **WSI/Swim Instructor** (36-month renewal)

### Features (`/certs`)
- **Inline editing** of certification dates
- **Status indicators**
  - ✓ OK (expires in 60+ days)
  - ⚠ Soon (expires in <60 days)
  - ✕ Expired
  - ❓ Missing
- **Retention analytics** - Staff retention by year hired
- **Color-coded priorities** for urgency
- **Batch certification updates**

---

## 📑 Documents & Resources

### Features (`/documents`)
- **Google Drive integration** - Direct links to shared documents
- **Category-based organization**
  - 📝 Staff Forms
  - ☑ Aquatic Checklists
  - 🏅 Senior Guard Resources
  - 🔧 Pool Tech Materials
  - 🎓 Training Videos
  - ✓ Audit Templates
- **Role-based access control** per document
- **Preview functionality** for PDFs and Google Docs
- **Quick download** buttons
- **Search across all documents**

---

## 📋 Staff Forms Management ✨ NEW

### Admin Controls (`/admin/staff-forms`)
- **Create custom forms** with dynamic field builder
- **Form categories**
  - 📋 General
  - 🚨 Incident Report
  - ☑ Checklist
  - 🎓 Training
  - 💬 Feedback
  - ✨ Custom

### Form Builder Features
**Field Types Available:**
- 📝 Short Text
- 📄 Long Text (Textarea)
- ✉️ Email
- ☎️ Phone
- 🔢 Number
- % Percentage
- ☑️ Yes/No (Checkbox)
- ⬇️ Dropdown
- 📅 Date

**Form Controls:**
- ✏️ Edit existing forms
- 🗑 Delete forms
- Mark required fields
- Add/remove fields dynamically
- Set field labels and placeholders
- Define dropdown options

### Form Management
- **View all forms** in card layout
- **Search by title/description**
- **Track form creator** and creation date
- **Field type indicators** on form cards
- **Active/Inactive status**

---

## ✅ Shift Checklist System

### Staff Features (`/shift-checklist`)
- **Start shift** with one click
- **View daily tasks** organized by category:
  - 🧪 Chemical
  - 🛡️ Safety
  - 🧹 Cleaning
  - 🔑 Opening
  - 🔒 Closing
  - 🔧 Maintenance
  - 📋 Custom
- **Check off tasks** as completed
- **Add notes** to individual tasks
- **Track progress** with visual progress bar
- **End shift confirmation** with timestamp

### Admin Features (`/admin/shift-tasks`)
- **Create shift tasks** with title, category, priority
- **Set priority levels** (High, Medium, Low)
- **Organize by category**
- **Delete outdated tasks**
- **Real-time synchronization** across all staff

### Reports (`/admin/shift-reports`)
- **View completed shifts** with detailed statistics
- **Filter by date** and staff member
- **Track completion percentages** per shift
- **Duration tracking** (start to end times)
- **Performance analytics**
  - Total shifts
  - Completed shifts
  - Average completion percentage
- **Staff performance summary** with completion trends

---

## 🏅 Senior Lifeguard Hub

### Senior Guard Hub (`/seniors`)
- **Orientation materials**
- **Team member directory**
- **Meeting schedule**
- **Resource library**

### Meet the Team (`/seniors/meet`)
- **View all senior guards** with bios
- **Contact information**
- **Years of experience**
- **Specialties/certifications**

---

## 🎓 Pool Tech Training

### Training Materials (`/training`)
- **Online training modules**
- **O&M manuals**
- **Chemical management guides**
- **Equipment operation videos**
- **Safety procedures**
- **Waterslide operation**

---

## 📊 Dashboard (`/dashboard`)

### Quick Stats
- 📅 **Today's schedule** - Current and next shifts
- ✅ **Task completion** - Today's checklist progress
- 👥 **Staff overview** - Total active staff
- 📋 **Audits needed** - Staff missing certifications
- 📈 **Retention chart** - Staff by start year

### Task Management
- **Daily shift tasks** with priority indicators
- **Filter by category**
- **Quick task completion**
- **Visual progress tracking**

### Performance Indicators
- **Staffing status** (Active/Inactive/Former)
- **Certification compliance**
- **Audit readiness**

---

## 🔧 Admin Panel

### Admin Settings (`/admin`)

**Tabs:**
1. **Positions** - Manage roles and permissions
2. **Documents** - Control document access
3. **Access** - View user permissions
4. **Users** - Staff member list
5. **Shifts** - Define shift schedules
6. **History** - Change log and audit trail

### Permission Management
**Granular Controls:**
- Audit Tracker (view, add)
- Certifications (view, edit)
- Staff Directory (view all, phone, email, address)
- Documents (view, manage access)
- Seniors Hub (view, manage)
- Training (view, manage)
- Shift Tasks (view, complete, manage)
- Admin Functions (add/delete employees, reset passwords, view history, manage positions, manage docs)

---

## 🔐 Security & Compliance

### Data Protection
- **Firestore Security Rules** - Role-based collection access
- **User authentication** - Firebase Auth with password requirements
- **Legal agreements** - Confidentiality and duty-to-act acknowledgment
- **Data encryption** - Firebase security by default

### Audit Trail
- **Change history** - Log all admin actions
- **Timestamp tracking** - When/who made changes
- **Undo capability** - Reverse previous actions
- **Compliance reporting** - Track all modifications

### Access Control
- **Per-collection permissions** - Different rules for each data type
- **User-scoped views** - Staff can only see/edit their own data
- **Role-based visibility** - Contents change by role
- **Admin-only pages** - Protected dashboard sections

---

## 🎨 User Interface Features

### Theme System
- **Light/Dark mode toggle**
- **System preference detection**
- **Persistent theme preference**
- **Smooth transitions**

### Navigation
- **Responsive sidebar** - Collapses on mobile
- **Role-based menu** - Different items per role
- **Active page indicator**
- **Quick access to profile**

### Responsive Design
- **Mobile-friendly layout**
- **Touch-friendly buttons**
- **Adaptive grid layouts**
- **Full tablet support**

### Loading States
- **Skeleton screens**
- **Spinner indicators**
- **Progress bars**
- **Disabled states** for pending actions

---

## 🔌 Data Structure

### Firestore Collections

| Collection | Purpose | Accessible To |
|-----------|---------|----------------|
| `users` | User profiles & auth | Self + Admin |
| `staff` | Staff directory | All staff |
| `positions` | Role definitions | Admin |
| `audits_history` | Audit records | Sr Guard + Admin |
| `shift_tasks` | Daily task list | All staff |
| `shift_checklists` | Staff daily checklists | User + Admin |
| `documents` | Shared resources | Based on role |
| `staff_forms` | Custom forms | Admin to create, all to view |

---

## 🚀 Getting Started

### For Staff
1. **Login** with email/password or Google
2. **Agree to confidentiality** notice
3. **View dashboard** for today's schedule
4. **Complete shift checklist** at beginning of shift
5. **Update profile** in settings if needed

### For Senior Guards
1. All staff features +
2. **Track audits** for team members
3. **View staff directory** with contact info
4. **Check certifications** and renewal dates
5. **Manage audit history**

### For Admins
1. All staff features +
2. **Create shift tasks** and forms
3. **View shift reports** and analytics
4. **Manage staff** (add, remove, status)
5. **Control document access**
6. **Define roles** and permissions
7. **View change history** for compliance

---

## 📱 Mobile Support
- Full responsive design for phones and tablets
- Touch-optimized buttons and inputs
- Mobile-friendly navigation
- Adaptive layouts for small screens

---

## 🔄 Integration Points

### Firebase Services
- **Authentication** - User login management
- **Firestore** - Real-time database
- **Storage** - Document/photo storage
- **Cloud Functions** - Optional backend tasks

### External Services
- **Google Drive** - Document integration
- **Google OAuth** - Alternative login
- **Email** - Password reset notifications

---

## 📝 Legal & Compliance

### Terms of Service
- Aquatic center confidentiality requirements
- American Red Cross standard of care
- Duty to Act acknowledgment
- Equipment liability

### Data Privacy
- No data shared externally
- Based on facility security requirements
- FERPA compliance for minors
- User data encryption

---

## 🎯 Future Enhancements

- Task templates for different shift types
- Email/SMS reminders for incomplete tasks
- Photo/image attachments for verification
- QR code scanning integration
- Bulk export of reports (CSV/PDF)
- Advanced analytics and dashboards
- Custom position creation UI
- Delegation/coverage scheduling
- Performance metrics and KPIs
- Integration with payroll systems

---

## 🆘 Support & Troubleshooting

### Common Issues

**Can't see certain features?**
- Check your assigned role
- Ask admin to verify your permissions

**Form not saving?**
- Check internet connection
- Verify you have the correct permissions
- Try refreshing the page

**Profile changes not updating?**
- Wait a few seconds for sync
- Hard refresh the page (Ctrl+F5)
- Check browser console for errors

### Contact
- Email: [admin email]
- Role: Administrator
- Location: SFAC Office

---

**Last Updated:** March 23, 2026  
**Version:** 1.5 (Profile + Staff Forms)
