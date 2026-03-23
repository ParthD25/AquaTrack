# 📋 Shift Checklist System

A comprehensive system for managing daily shift tasks and staff accountability at SFAC Aquatic Center.

## Overview

The Shift Checklist System allows:
- **Admins** to create and customize shift tasks across different categories (chemical, safety, cleaning, opening, closing, maintenance, custom)
- **Staff** to complete daily shift checklists with task tracking and notes
- **Supervisors** to view detailed reports on task completion rates and staff performance

## Features

### 👤 Staff Features
- **Today's Shift Checklist** (`/shift-checklist`)
  - Start shift with one click
  - Check off tasks as completed
  - Add notes to specific tasks for documentation
  - Visual progress tracking
  - End shift confirmation

### ⚙️ Admin Features
- **Manage Shift Tasks** (`/admin/shift-tasks`)
  - Add new tasks with title, category, and priority
  - Organize tasks by category (🧪 Chemical, 🛡️ Safety, 🧹 Cleaning, 🔑 Opening, 🔒 Closing, 🔧 Maintenance, 📋 Custom)
  - Set priority levels (High, Medium, Low)
  - Delete outdated or duplicate tasks
  - Real-time task list synchronization

- **Shift Reports** (`/admin/shift-reports`)
  - View all completed shifts with detailed statistics
  - Filter by date and staff member
  - Track completion percentages per task
  - Monitor staff performance over time
  - Duration tracking (shift start to end times)
  - Staff performance analytics

## Data Structure

### Firestore Collections

#### `shift_tasks`
Stores the master list of tasks available for all shifts.

```
{
  id: "task_1234567890",
  title: "Check chemical pH",
  category: "chemical",
  priority: "high"
}
```

#### `shift_checklists`
Stores individual shift checklists for each staff member per day.

```
{
  id: "shift_{userId}_{date}",
  userId: "user-123",
  staffName: "John Doe",
  date: "2024-03-21",
  startTime: Timestamp,
  endTime: Timestamp,
  completed: true,
  checklist: [
    {
      taskId: "task_1234567890",
      completed: true,
      completedAt: Timestamp,
      completedBy: "user-123",
      notes: "pH was 7.2, added buffer"
    }
  ]
}
```

## Usage Guide

### For Staff

1. **Start Your Shift**
   - Navigate to "Today's Checklist" from the sidebar
   - Click "Start Shift" to begin
   - Your shift is now tracked

2. **Complete Tasks**
   - Tasks are grouped by category
   - Check the box when you complete a task
   - Add notes for accountability (e.g., "Checked at 10:30 AM")
   - Progress bar updates in real-time

3. **End Your Shift**
   - Click "End Shift" when done
   - Confirm to save your completed checklist
   - Shifts are now available for supervisor review

### For Admins

1. **Create Shift Tasks**
   - Go to "Manage Shift Tasks" in Admin section
   - Fill in task title, category, and priority
   - Click "Add Task"
   - Tasks are immediately available to staff

2. **View Reports**
   - Go to "Shift Reports" in Admin section
   - Filter by specific dates or staff members
   - Review completion percentages and durations
   - Click "Staff Performance" to see aggregate analytics

## Security Rules

All data is protected by Firestore security rules:

- **shift_tasks**: Readable by all staff, editable by admins only
- **shift_checklists**: Each staff member can only read/write their own shifts, admins can read all

## Integration with Auth

The system integrates with your existing auth system:
- User role validation (admin, sr_guard, pool_tech, lifeguard)
- Automatic user identification for shift attribution
- Admin-only access to management pages

## Technical Stack

- **Frontend**: Next.js with React
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (via auth-context)
- **Database Rules**: Firestore Security Rules

## Styling & UI Components

The system uses:
- Consistent card-based layout (`card`, `section-title`)
- Progress bars and visual indicators
- Category icons and color coding
- Responsive grid layouts
- Loading states and transitions

## Future Enhancements

Potential improvements:
- Task templates for different shift types (morning, evening, weekend)
- Email/SMS reminders for incomplete tasks
- Notification system for overdue shifts
- Task analytics and trend reporting
- Photo/image attachments for verification
- QR code scanning integration
- Bulk export of shift data (CSV/PDF)

## Troubleshooting

### Shift not saving
- Check your internet connection
- Ensure you're logged in as an authorized user
- Check browser console for error messages

### Tasks not showing up
- Admin may not have added tasks yet
- Try refreshing the page
- Check Firestore rules in Firebase Console

### Permission denied errors
- Verify your user role is set correctly in Firestore
- Check that admin-only pages are accessed as admin
- Ensure you're using the correct Firebase project

## Support

For issues or questions:
1. Check Firebase Console logs
2. Verify Firestore security rules
3. Check browser console for error messages
4. Contact system administrator
