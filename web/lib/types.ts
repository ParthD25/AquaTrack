// Extended types for the position-based permissions system

export type UserRole = 'admin' | 'sr_guard' | 'pool_tech' | 'lifeguard';

// AppUser — the authenticated user's profile stored in Firestore
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  orgId: string;
}

// A "Position" is the admin-configurable role definition.
// Built-in positions map to UserRole. Admin can add custom positions (e.g. "Jr. Lifeguard").
export interface Position {
  id: string;
  name: string;
  color: string;           // hex or CSS var
  isBuiltIn: boolean;      // built-in positions can't be deleted
  permissions: PositionPermissions;
  rank: number;            // lower = more access (admin=0, sr_guard=1, etc.)
}

export interface PositionPermissions {
  // Audit Tracker
  canViewAudits: boolean;
  canAddAuditEntry: boolean;
  // Cert Tracker
  canViewCerts: boolean;
  canEditCerts: boolean;
  // Staff Directory
  canViewStaffDirectory: boolean;
  canViewStaffPhone: boolean;
  canViewStaffEmail: boolean;
  canViewStaffAddress: boolean;    // admin only by default
  canViewSeniorContacts: boolean;
  // Documents
  canViewDocuments: boolean;       // further filtered per-doc
  // Seniors Hub
  canViewSeniorsHub: boolean;
  canViewOrientation: boolean;
  // Pool Tech Training
  canViewPoolTechTraining: boolean;
  // Shift / Tasks
  canViewShiftTasks: boolean;
  canCompleteShiftTasks: boolean;
  // Admin-only
  canAddEmployees: boolean;        // only admin
  canDeleteEmployees: boolean;     // only admin
  canViewChangeHistory: boolean;   // only admin
  canManagePositions: boolean;     // only admin
  canManageDocumentAccess: boolean; // only admin
  canResetPasswords: boolean;      // only admin
  canInviteUsers: boolean;         // only admin
}

export const DEFAULT_POSITIONS: Position[] = [
  {
    id: 'admin',
    name: 'Administrator',
    color: '#a855f7',
    isBuiltIn: true,
    rank: 0,
    permissions: {
      canViewAudits: true, canAddAuditEntry: true,
      canViewCerts: true, canEditCerts: true,
      canViewStaffDirectory: true, canViewStaffPhone: true, canViewStaffEmail: true,
      canViewStaffAddress: true, canViewSeniorContacts: true,
      canViewDocuments: true, canViewSeniorsHub: true, canViewOrientation: true,
      canViewPoolTechTraining: true, canViewShiftTasks: true, canCompleteShiftTasks: true,
      canAddEmployees: true, canDeleteEmployees: true, canViewChangeHistory: true,
      canManagePositions: true, canManageDocumentAccess: true, canResetPasswords: true, canInviteUsers: true,
    },
  },
  {
    id: 'sr_guard',
    name: 'Senior Guard',
    color: '#00d4ff',
    isBuiltIn: true,
    rank: 1,
    permissions: {
      canViewAudits: true, canAddAuditEntry: true,
      canViewCerts: true, canEditCerts: true,
      canViewStaffDirectory: true, canViewStaffPhone: true, canViewStaffEmail: true,
      canViewStaffAddress: false, canViewSeniorContacts: true,
      canViewDocuments: true, canViewSeniorsHub: true, canViewOrientation: true,
      canViewPoolTechTraining: true, canViewShiftTasks: true, canCompleteShiftTasks: true,
      canAddEmployees: false, canDeleteEmployees: false, canViewChangeHistory: false,
      canManagePositions: false, canManageDocumentAccess: false, canResetPasswords: false, canInviteUsers: false,
    },
  },
  {
    id: 'pool_tech',
    name: 'Pool Tech',
    color: '#f59e0b',
    isBuiltIn: true,
    rank: 2,
    permissions: {
      canViewAudits: false, canAddAuditEntry: false,
      canViewCerts: false, canEditCerts: false,
      canViewStaffDirectory: true, canViewStaffPhone: true, canViewStaffEmail: false,
      canViewStaffAddress: false, canViewSeniorContacts: true,
      canViewDocuments: true, canViewSeniorsHub: false, canViewOrientation: false,
      canViewPoolTechTraining: true, canViewShiftTasks: true, canCompleteShiftTasks: true,
      canAddEmployees: false, canDeleteEmployees: false, canViewChangeHistory: false,
      canManagePositions: false, canManageDocumentAccess: false, canResetPasswords: false, canInviteUsers: false,
    },
  },
  {
    id: 'lifeguard',
    name: 'Lifeguard',
    color: '#22c55e',
    isBuiltIn: true,
    rank: 3,
    permissions: {
      canViewAudits: false, canAddAuditEntry: false,
      canViewCerts: false, canEditCerts: false,
      canViewStaffDirectory: true, canViewStaffPhone: true, canViewStaffEmail: false,
      canViewStaffAddress: false, canViewSeniorContacts: false,
      canViewDocuments: true, canViewSeniorsHub: false, canViewOrientation: false,
      canViewPoolTechTraining: false, canViewShiftTasks: true, canCompleteShiftTasks: true,
      canAddEmployees: false, canDeleteEmployees: false, canViewChangeHistory: false,
      canManagePositions: false, canManageDocumentAccess: false, canResetPasswords: false, canInviteUsers: false,
    },
  },
];

// Permission group definitions for the admin UI
export interface PermissionGroup {
  label: string;
  icon: string;
  keys: (keyof PositionPermissions)[];
  adminOnly?: boolean;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Audit Tracker',
    icon: '✓',
    keys: ['canViewAudits', 'canAddAuditEntry'],
  },
  {
    label: 'Certifications',
    icon: '📋',
    keys: ['canViewCerts', 'canEditCerts'],
  },
  {
    label: 'Staff Directory',
    icon: '👥',
    keys: ['canViewStaffDirectory', 'canViewStaffPhone', 'canViewStaffEmail', 'canViewStaffAddress', 'canViewSeniorContacts'],
  },
  {
    label: 'Documents & Training',
    icon: '📁',
    keys: ['canViewDocuments', 'canViewSeniorsHub', 'canViewOrientation', 'canViewPoolTechTraining'],
  },
  {
    label: 'Shift Tasks',
    icon: '☑',
    keys: ['canViewShiftTasks', 'canCompleteShiftTasks'],
  },
  {
    label: 'Admin Controls',
    icon: '⚙',
    adminOnly: true,
    keys: ['canAddEmployees', 'canDeleteEmployees', 'canViewChangeHistory', 'canManagePositions', 'canManageDocumentAccess', 'canResetPasswords', 'canInviteUsers'],
  },
];

export const PERMISSION_LABELS: Record<keyof PositionPermissions, string> = {
  canViewAudits: 'View Audit Tracker',
  canAddAuditEntry: 'Add/Edit Audit Entries',
  canViewCerts: 'View Cert Tracker',
  canEditCerts: 'Edit Certifications',
  canViewStaffDirectory: 'View Staff Directory',
  canViewStaffPhone: 'See Phone Numbers',
  canViewStaffEmail: 'See Email Addresses',
  canViewStaffAddress: 'See Home Addresses',
  canViewSeniorContacts: 'See Senior Contact Info',
  canViewDocuments: 'Access Document Library',
  canViewSeniorsHub: 'Senior LG Hub',
  canViewOrientation: 'Orientation Materials',
  canViewPoolTechTraining: 'Pool Tech Training',
  canViewShiftTasks: 'View Shift Task List',
  canCompleteShiftTasks: 'Check Off Tasks',
  canAddEmployees: 'Add/Remove Employees',
  canDeleteEmployees: 'Delete Employees',
  canViewChangeHistory: 'View Full Change History',
  canManagePositions: 'Manage Positions',
  canManageDocumentAccess: 'Control Document Access',
  canResetPasswords: 'Reset User Passwords',
  canInviteUsers: 'Invite & Create Accounts',
};

// Staff member with extended fields
export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  positionId: string;  // references Position.id
  email?: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  bio?: string;
  active: boolean;
  visible: boolean;    // admin can hide employees (visible: false = only admin sees them)
  isHighSchool?: boolean;
  gradYear?: number;
  certifications?: string[];
  hireDate?: string;
  orgId: string;
}

export type AuditType = 'vat' | 'cpr' | 'brick' | 'live_recognition' | 'swim_instructor';

export interface AuditRecord {
  id: string;
  staffId: string;
  staffName: string;
  auditType: AuditType;
  completedBy: string;
  completedByName: string;
  completedAt: string;
  season: string;
  notes?: string;
  orgId: string;
}

export interface ChangeHistoryEntry {
  id: string;
  action: 'add_audit' | 'edit_audit' | 'add_staff' | 'remove_staff' | 'toggle_visibility' | 'change_role' | 'upload_doc' | 'toggle_doc_access';
  performedBy: string;
  performedByName: string;
  performedAt: string;
  description: string;
  targetId?: string;
  targetName?: string;
  undone?: boolean;
  orgId: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  fileType: string;
  fileURL?: string;
  size?: string;
  uploadedBy: string;
  uploadedAt: string;
  // Access: array of positionIds that can see this doc. Empty = only admin.
  accessPositions: string[];
  tags?: string[];
  orgId: string;
}

export interface ShiftDefinition {
  id: string;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  active: boolean;
}

export const DEFAULT_SHIFTS: ShiftDefinition[] = [
  { id: 'wkday-1', name: 'Weekday Early Morning', days: ['monday','tuesday','wednesday','thursday','friday'], startTime: '05:30', endTime: '09:30', active: true },
  { id: 'wkday-2', name: 'Weekday Mid-Morning', days: ['monday','tuesday','wednesday','thursday','friday'], startTime: '09:30', endTime: '14:00', active: true },
  { id: 'wkday-3', name: 'Weekday Evening', days: ['monday','tuesday','wednesday','thursday','friday'], startTime: '15:45', endTime: '20:15', active: true },
  { id: 'sat-1', name: 'Saturday Early', days: ['saturday'], startTime: '06:30', endTime: '09:00', active: true },
  { id: 'sat-2', name: 'Saturday Morning', days: ['saturday'], startTime: '08:45', endTime: '12:00', active: true },
  { id: 'sat-3', name: 'Saturday Afternoon', days: ['saturday'], startTime: '11:45', endTime: '17:15', active: true },
  { id: 'sat-4', name: 'Saturday Evening', days: ['saturday'], startTime: '17:00', endTime: '20:15', active: true },
  { id: 'sun-1', name: 'Sunday Early', days: ['sunday'], startTime: '06:30', endTime: '09:00', active: true },
  { id: 'sun-2', name: 'Sunday Afternoon', days: ['sunday'], startTime: '11:45', endTime: '17:15', active: true },
  { id: 'sun-3', name: 'Sunday Evening', days: ['sunday'], startTime: '17:00', endTime: '20:15', active: true },
];

export const AUDIT_TYPES = [
  { key: 'vat' as AuditType, label: 'VAT', description: 'Visual Acuity Test', icon: '👁️' },
  { key: 'cpr' as AuditType, label: 'CPR', description: 'CPR Live Exercise', icon: '💓' },
  { key: 'brick' as AuditType, label: 'Brick Test', description: 'Brick Retrieval Exercise', icon: '🧱' },
  { key: 'live_recognition' as AuditType, label: 'Live Recognition', description: 'Red Ball Recognition Exercise', icon: '🔴' },
  { key: 'swim_instructor' as AuditType, label: 'Swim Instructor', description: 'Swim Instructor Skills Audit', icon: '🏊' },
];

export const STAFF_ROSTER: Omit<StaffMember, 'id' | 'orgId'>[] = [
  { firstName: 'Patrick', lastName: 'Ama', positionId: 'lifeguard', phone: '555-0101', active: true, visible: true },
  { firstName: 'Amanda', lastName: 'Daley', positionId: 'lifeguard', phone: '555-0102', active: true, visible: true },
  { firstName: 'Parth', lastName: 'Dave', positionId: 'lifeguard', phone: '555-0103', active: true, visible: true },
  { firstName: 'Serguei', lastName: 'Delgado', positionId: 'lifeguard', phone: '555-0104', active: true, visible: true },
  { firstName: 'Noah', lastName: 'Elam', positionId: 'lifeguard', phone: '555-0105', active: true, visible: true, isHighSchool: true, gradYear: 2026 },
  { firstName: 'Ethan', lastName: 'Gallagher', positionId: 'lifeguard', phone: '555-0106', active: true, visible: true },
  { firstName: 'Jaden', lastName: 'Garcia', positionId: 'lifeguard', phone: '555-0107', active: true, visible: true },
  { firstName: 'Rachel', lastName: 'Handran', positionId: 'sr_guard', phone: '555-0108', active: true, visible: true },
  { firstName: 'Christian', lastName: 'Higareda', positionId: 'lifeguard', phone: '555-0109', active: true, visible: true },
  { firstName: 'DJ', lastName: 'Howard', positionId: 'lifeguard', phone: '555-0110', active: true, visible: true },
  { firstName: 'Bryan', lastName: 'Jung', positionId: 'lifeguard', phone: '555-0111', active: true, visible: true },
  { firstName: 'Emma', lastName: 'Knab', positionId: 'lifeguard', phone: '555-0112', active: true, visible: true, isHighSchool: true, gradYear: 2026 },
  { firstName: 'Lorene', lastName: 'Lee', positionId: 'lifeguard', phone: '555-0113', active: true, visible: true },
  { firstName: 'Lynda', lastName: 'Lee', positionId: 'lifeguard', phone: '555-0114', active: true, visible: true },
  { firstName: 'Selena', lastName: 'Lopez', positionId: 'lifeguard', phone: '555-0115', active: true, visible: true },
  { firstName: 'Hector', lastName: 'Macias', positionId: 'sr_guard', phone: '555-0116', active: true, visible: true },
  { firstName: 'Alex', lastName: 'Mahan', positionId: 'lifeguard', phone: '555-0117', active: true, visible: true },
  { firstName: 'Aashirya', lastName: 'Murugan', positionId: 'lifeguard', phone: '555-0118', active: true, visible: true },
  { firstName: 'Quincy', lastName: 'Nemie', positionId: 'lifeguard', phone: '555-0119', active: true, visible: true },
  { firstName: 'Erik', lastName: 'Rauholt', positionId: 'lifeguard', phone: '555-0120', active: true, visible: true },
  { firstName: 'Gavin', lastName: 'Small', positionId: 'pool_tech', phone: '555-0121', active: true, visible: true },
  { firstName: 'Sophia', lastName: 'Smith', positionId: 'sr_guard', phone: '555-0122', active: true, visible: true },
  { firstName: 'Sean', lastName: 'Tan', positionId: 'lifeguard', phone: '555-0123', active: true, visible: true },
  { firstName: 'Travis', lastName: 'Tsuei', positionId: 'lifeguard', phone: '555-0124', active: true, visible: true },
  { firstName: 'Francesca', lastName: 'Uy', positionId: 'lifeguard', phone: '555-0125', active: true, visible: true },
  { firstName: 'Branden', lastName: 'Uyeda', positionId: 'sr_guard', phone: '555-0126', active: true, visible: true },
  { firstName: 'Michael', lastName: 'Wood', positionId: 'lifeguard', phone: '555-0127', active: true, visible: true },
  { firstName: 'Tristin', lastName: 'Wilson', positionId: 'lifeguard', phone: '555-0128', active: true, visible: true },
  { firstName: 'Emily', lastName: 'Wu', positionId: 'lifeguard', phone: '555-0129', active: true, visible: true },
  { firstName: 'Samantha', lastName: 'Wu', positionId: 'lifeguard', phone: '555-0130', active: true, visible: true },
  { firstName: 'Neo', lastName: 'Wynn', positionId: 'lifeguard', phone: '555-0131', active: true, visible: true },
  { firstName: 'Hafsa', lastName: 'Zafar', positionId: 'lifeguard', phone: '555-0132', active: true, visible: true },
  { firstName: 'Aodan', lastName: 'Lovato', positionId: 'lifeguard', phone: '555-0133', active: true, visible: true },
  { firstName: 'Rachel', lastName: 'Tom', positionId: 'sr_guard', phone: '555-0134', active: true, visible: true },
  { firstName: 'Katie', lastName: 'Clinton', positionId: 'lifeguard', phone: '555-0135', active: true, visible: true },
  { firstName: 'Jacob', lastName: 'Malimban', positionId: 'lifeguard', phone: '555-0136', active: true, visible: true },
  { firstName: 'Boaz', lastName: 'Kwong', positionId: 'lifeguard', phone: '555-0137', active: true, visible: true },
  { firstName: 'Aiden', lastName: 'Ramirez', positionId: 'lifeguard', phone: '555-0138', active: true, visible: true },
];

// Helper: get all nav sections based on a position's permissions
export function getNavForPermissions(perms: PositionPermissions) {
  const items = [
    { href: '/dashboard', icon: '⊞', label: 'Dashboard', show: true },
    { href: '/audits', icon: '✓', label: 'Audit Tracker', show: perms.canViewAudits },
    { href: '/certs', icon: '📋', label: 'Certs & Retention', show: perms.canViewCerts },
    { href: '/staff', icon: '👥', label: 'Staff Directory', show: perms.canViewStaffDirectory },
    { href: '/documents', icon: '📁', label: 'Documents', show: perms.canViewDocuments },
    { href: '/seniors', icon: '🏅', label: 'Senior LG Hub', show: perms.canViewSeniorsHub },
    { href: '/seniors/meet', icon: '👤', label: 'Meet the Team', show: perms.canViewStaffDirectory },
    { href: '/training', icon: '🎓', label: 'Pool Tech Training', show: perms.canViewPoolTechTraining },
    { href: '/admin', icon: '⚙', label: 'Admin Settings', show: perms.canManagePositions },
  ];
  return items.filter(i => i.show);
}
