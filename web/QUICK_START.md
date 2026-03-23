# ⚡ Quick Start Guide — New Features (v1.5)

## What's New?

### 1. User Profile Management ✨
**Location:** Click your profile in the bottom left sidebar → Opens `/profile`

### 2. Staff Forms Builder ✨  
**Location:** Admin → Staff Forms → `/admin/staff-forms`

### 3. Auto-Sync to Staff Directory
When you update your profile, changes automatically sync to the staff directory

---

## 👤 Profile Management Guide

### How to Edit Your Profile

1. **Click your profile** at the bottom left of the sidebar
   - Shows your name and role
   - Click anywhere on the profile card to open

2. **You'll see three tabs:**
   - 👤 **Personal** - Your name, email, photo
   - 📱 **Contact** - Phone, address, emergency contact
   - 🔒 **Security** - Change password

### Personal Tab
- **First Name** - Your first name (displays in staff directory)
- **Last Name** - Your last name (displays in staff directory)
- **Email** - Your login email (read-only, can't change here)
- **Profile Photo URL** - Link to an image (optional)
- Changes auto-sync to staff directory immediately

### Contact Tab
- **Phone** - Your work phone number
- **Address** - Street, city, state, ZIP
- **Emergency Contact** - Name and phone of emergency contact
- All optional fields, but recommended for staff safety records

### Security Tab
- **Current Password** - Enter your current password
- **New Password** - Your new password (6+ characters)
- **Confirm** - Retype to confirm
- Required: uppercase, lowercase, numbers or special characters

### What Gets Synced?
When you save changes:
- ✓ Staff Directory is updated immediately
- ✓ Your display name across the app
- ✓ Contact information available to senior guards/admins
- ✓ Profile photo shows to authorized users

---

## 📋 Staff Forms Builder Guide

### For Admins Only

**Access:** Admin Settings → Staff Forms → Create or edit forms

### Step 1: Form Details
1. Enter **Form Title** (required)
   - Example: "Incident Report - Lifeguard"
2. Enter **Description** (optional)
   - What is this form for? Staff instructions.
3. Choose **Category**
   - 📋 General - Standard paperwork
   - 🚨 Incident - Incident/accident reports
   - ☑️ Checklist - Daily/weekly tasks
   - 🎓 Training - Course feedback
   - 💬 Feedback - Staff feedback
   - ✨ Custom - Other

### Step 2: Add Fields
**Click field types to add:**

| Icon | Type | Use For |
|------|------|---------|
| 📝 | Short Text | Names, titles, IDs |
| 📄 | Long Text | Descriptions, notes |
| ✉️ | Email | Contact emails |
| ☎️ | Phone | Phone numbers |
| 🔢 | Number | Counts, ages, times |
| % | Percentage | Water clarity, attendance |
| ☑️ | Yes/No | Checkbox questions |
| ⬇️ | Drop-down | Select from list |
| 📅 | Date | Calendar date picker |

### Step 3: Configure Each Field
For each field you add:

1. **Change the label** - What question/prompt do you want?
   - Example: "What time did the incident occur?"
   - Change in the text input at top

2. **Select type** - Dropdown shows all 9 types
   - Choose the input type
   - Changes the field behavior

3. **Mark as Required** - Check box for mandatory fields
   - ✓ Required = staff must fill it
   - ☐ Optional = staff can skip

4. **Delete** - Red 🗑 button removes field

### Example Form: Incident Report

**Title:** Incident Report — Pool Incident  
**Category:** 🚨 Incident

**Fields:**
- Date of incident (📅 Date) - Required
- Time of incident (🕐 Time) - Required
- Location (📝 Short Text) - Required
- Incident type (⬇️ Dropdown: Slip, Fall, Injury, Other) - Required
- Description (📄 Long Text) - Required
- Staff member name (📝 Short Text) - Required
- Witness contact (☎️ Phone) - Optional
- Photo/evidence (📝 Short Text - URL) - Optional

### Step 4: Save Form
- Click **Create Form** (new) or **Update Form** (editing)
- Form is now active and available to staff

### Edit Existing Forms
- Click ✏️ **Edit** on any form card
- Make changes
- Click **Update Form**

### Delete Forms
- Click 🗑 **Delete** on form card
- Confirm deletion
- Form is permanently removed

### Manage Forms
All forms shown in cards displaying:
- Form title with category icon
- Description
- Number of fields
- Field types used
- Creator name and creation date
- Edit/Delete buttons

---

## 🔐 Role Display Fix

### What Changed?
**Before:** "Admin User" (name) + "Lifeguard" (wrong role) caused confusion

**Now:** 
- Shows your actual name (e.g., "John Smith")
- Shows your correct role based on Firestore:
  - ⚙️ Administrator
  - 🏅 Senior Guard
  - 🔧 Pool Technician
  - 🏊 Lifeguard

### If Still Showing Wrong Role?
1. **Check Firestore:**
   - Go to Firebase Console
   - Find "users" collection
   - Find your user document
   - Verify "role" field is correct

2. **Check Firestore:**
   - Also check "staff" collection for your record
   - Ensure "positionId" matches your role

3. **Refresh the app:**
   - Alt+F4 to close completely
   - Reopen AquaTrack
   - Role should now be correct

---

## 🔄 Workflow Examples

### Example 1: New Staff Member Onboarding
1. **Admin creates** the staff member account
2. **Staff member logs in** via email/password
3. **Staff member edits** profile to add:
   - First/last name (displays in directory)
   - Phone number
   - Emergency contact
4. **Changes auto-sync** to staff directory
5. **Senior guards can see** their contact info immediately

### Example 2: Creating an Incident Report Form
1. **Go to** Admin → Staff Forms
2. **Click** ➕ New Form
3. **Fill in:**
   - Title: "Pool Incident Report"
   - Category: 🚨 Incident
   - Description: "For all incident reports"
4. **Add fields:**
   - Date of incident (📅)
   - Time (⏰)
   - Type (⬇️ dropdown)
   - Description (📄)
   - Witness (👤 name)
5. **Save** → Form ready for staff to use

### Example 3: Updating Your Phone Number
1. **Click profile** in sidebar
2. **Go to** Contact tab
3. **Update phone number**
4. **Click Save**
5. **Verify** in Staff Directory (that page auto-updates)

---

## ❓ FAQ

**Q: Can I delete my profile?**  
A: No, only admins can remove staff members from the system. Contact your admin.

**Q: Who can see my contact information?**  
A: Senior guards and admins can see phone/address. Lifeguards only see names. Adjust in admin permissions if needed.

**Q: Can I change my email?**  
A: Not from profile page. Contact admin for email changes (security requirement).

**Q: What happens if I don't update my profile?**  
A: App works fine with minimal info. You're prompted on first login to agree to confidentiality notice.

**Q: Can multiple versions of a staff form exist?**  
A: Yes! You can create "Incident Report v1", "Incident Report v2". Admins manage which is active.

**Q: Are completed forms stored?**  
A: Staff Forms builder creates templates. Submissions can be stored in Firestore (setup required per form).

**Q: Can I export a form as PDF?**  
A: Can print from browser (Ctrl+P). PDF export coming soon.

**Q: What if I make a form mandatory?**  
A: Required fields must be filled before form submission. Currently enforced by form builder.

---

## 🔗 Navigation Shortcuts

| Feature | Path | Shortcut |
|---------|------|----------|
| My Profile | `/profile` | Click sidebar profile |
| Staff Forms (Admin) | `/admin/staff-forms` | Admin → Staff Forms |
| Staff Directory | `/staff` | Main → Staff Directory |
| Shift Checklist | `/shift-checklist` | Main → Today's Checklist |
| Admin Settings | `/admin` | Admin → Admin Settings |

---

## 📞 Need Help?

1. **Check this guide** - Covers most common questions
2. **Contact your admin** - Ask in person
3. **Check browser console** - Press F12, look for error messages
4. **Reload the page** - Fixes many issues (F5)

---

**Version:** 1.5 (Profile + Staff Forms)  
**Last Updated:** March 23, 2026  
**Questions?** Contact SFAC Admin
