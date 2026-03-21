'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

type DocCategory = 'all' | 'staff_forms' | 'checklists' | 'senior_lg' | 'pool_tech' | 'training' | 'audits';

interface DocItem {
  id: string;
  name: string;
  description: string;
  folder: string;            // original folder for clarity
  category: DocCategory;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'video' | 'image' | 'doc';
  // Access positions: who can see this document
  accessPositions: UserRole[];
  size: string;
  tags?: string[];
}

// ━━━ REAL DOCUMENTS FROM UPLOADED FOLDERS ━━━
// Access rules:
//   Staff Forms → lifeguard + pool_tech + sr_guard + admin (all staff)
//   Aquatic Checklist Forms → pool_tech + sr_guard + admin (NOT lifeguard, mainly pool tech & seniors)
//   Senior Lifeguard → sr_guard + admin ONLY (NOT pool tech)
//   Audit docs → sr_guard + admin ONLY

const DOCUMENTS: DocItem[] = [
  // ══════ STAFF FORMS (All Staff) ══════
  { id: 'sf-1', name: 'Change of Address Form', description: 'Staff address change request form', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '71 KB', tags: ['hr', 'forms'] },
  { id: 'sf-2', name: 'Direct Deposit Request Form', description: 'Payroll direct deposit setup', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '43 KB', tags: ['hr', 'payroll'] },
  { id: 'sf-3', name: 'ESuite Account Setup', description: 'Employee system account instructions', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '122 KB', tags: ['onboarding'] },
  { id: 'sf-4', name: 'Emergency Form', description: 'Emergency contact information form', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '56 KB', tags: ['hr', 'emergency'] },
  { id: 'sf-5', name: 'Notice of Resignation Paperwork', description: 'Resignation form', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '24 KB', tags: ['hr'] },
  { id: 'sf-6', name: 'PST Absence Request', description: 'Paid Sick Time absence request form (2024)', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '424 KB', tags: ['hr', 'time-off'] },
  { id: 'sf-7', name: 'Paid Sick Time Policy Updates 2024', description: 'Updated sick time policies', folder: 'Staff Forms', category: 'staff_forms', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '96 KB', tags: ['hr', 'policy'] },

  // ══════ AQUATIC CHECKLIST FORMS (Pool Tech + Senior + Admin) ══════
  { id: 'ac-1', name: 'AED Daily Checklist', description: 'Daily AED equipment verification', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '397 KB', tags: ['safety', 'daily'] },
  { id: 'ac-2', name: 'Chemical Check Log', description: 'Daily pool chemical readings log', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '260 KB', tags: ['chemical', 'daily'] },
  { id: 'ac-3', name: 'Chemical & First Aid Inventory Checklist', description: 'Monthly chemical and first aid inventory', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '18 KB', tags: ['chemical', 'inventory'] },
  { id: 'ac-4', name: 'Daily/Weekly LG Checklist — Offseason', description: 'Off-season shift checklist for lifeguards', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '10 KB', tags: ['checklist'] },
  { id: 'ac-5', name: 'Daily/Weekly LG Checklist — Summer', description: 'Summer shift checklist for lifeguards', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '11 KB', tags: ['checklist'] },
  { id: 'ac-6', name: 'Incident Report 2024', description: 'Incident reporting form', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '416 KB', tags: ['forms', 'required'] },
  { id: 'ac-7', name: 'Monthly Maintenance — Offseason', description: 'Offseason monthly facility maintenance', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '25 KB', tags: ['maintenance'] },
  { id: 'ac-8', name: 'Monthly Maintenance — On Season', description: 'On-season monthly maintenance checklist', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '25 KB', tags: ['maintenance'] },
  { id: 'ac-9', name: 'Oxygen Daily Checklist', description: 'Emergency oxygen unit verification', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '359 KB', tags: ['safety', 'daily'] },
  { id: 'ac-10', name: 'Pre-Opening Inspection Log 2023', description: 'Pre-opening facility check form', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '19 KB', tags: ['checklist'] },
  { id: 'ac-11', name: 'Rescue Report 2024', description: 'Rescue incident documentation', folder: 'Aquatic Checklist Forms', category: 'checklists', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '1.5 MB', tags: ['report'] },

  // ══════ SENIOR LIFEGUARD (Senior + Admin ONLY) ══════
  { id: 'sl-1', name: '2021 Swim Lesson Preschool Report Cards', description: 'Preschool swim lesson grading documents', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '3.3 MB', tags: ['swim-lessons', 'records'] },
  { id: 'sl-2', name: '2021 Swim Lesson Youth Report Cards', description: 'Youth swim lesson report cards', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '1.2 MB', tags: ['swim-lessons', 'records'] },
  { id: 'sl-3', name: '2023 Master Class Roster', description: 'Class enrollment for 2023', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '229 KB', tags: ['swim-lessons', 'roster'] },
  { id: 'sl-4', name: '2024 Master Class Roster', description: 'Class enrollment for 2024', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '280 KB', tags: ['swim-lessons', 'roster'] },
  { id: 'sl-5', name: '2025 Master Class Roster', description: 'Class enrollment for 2025', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '315 KB', tags: ['swim-lessons', 'roster'] },
  { id: 'sl-6', name: '2026 Master Class Roster', description: 'Current class enrollment', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '286 KB', tags: ['swim-lessons', 'roster'] },
  { id: 'sl-7', name: '2026 Skills Boost Roster', description: 'Sunday skills boost enrollment', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '222 KB', tags: ['swim-lessons', 'roster'] },
  { id: 'sl-8', name: 'Level Record Sheet', description: 'Student progress tracking template', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'docx', accessPositions: ['admin', 'sr_guard'], size: '10 KB', tags: ['swim-lessons'] },
  { id: 'sl-9', name: 'Family Tot & Preschool — Activities', description: 'Images, games, songs for tot lessons', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '556 KB', tags: ['swim-lessons', 'curriculum'] },
  { id: 'sl-10', name: 'Games Resource', description: 'Pool games for swim lessons', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '321 KB', tags: ['swim-lessons'] },
  { id: 'sl-11', name: 'Senior Swim Lesson Goals & Expectations', description: 'Goals doc for senior LG lesson program', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '124 KB', tags: ['swim-lessons'] },
  { id: 'sl-12', name: 'Sunday Skills Boost Rosters', description: 'Sunday skills boost enrollment sheets', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '41 KB', tags: ['swim-lessons'] },
  { id: 'sl-13', name: 'Swim Lesson Roster Template — Weekday', description: 'Blank roster template for weekday', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '75 KB', tags: ['swim-lessons', 'template'] },
  { id: 'sl-14', name: 'Swim Lesson Roster Template — Weekend', description: 'Blank roster template for weekend', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'xlsx', accessPositions: ['admin', 'sr_guard'], size: '73 KB', tags: ['swim-lessons', 'template'] },
  { id: 'sl-15', name: 'Teaching Activities, Drills, Games', description: 'Activity and drill resources', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '302 KB', tags: ['swim-lessons', 'curriculum'] },
  { id: 'sl-16', name: 'Testing Guide 2018', description: 'Skills testing guide', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '415 KB', tags: ['swim-lessons'] },
  { id: 'sl-17', name: 'USMS Adult Learn to Swim Manual', description: 'US Masters Swimming adult program manual', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '14.6 MB', tags: ['swim-lessons', 'manual'] },
  { id: 'sl-18', name: 'USMS Adult Learn to Swim PowerPoint', description: 'Training presentation for adult lessons', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '5.8 MB', tags: ['swim-lessons', 'training'] },
  { id: 'sl-19', name: 'Senior Lifeguard Orientation', description: 'Orientation slideshow with new manual', folder: 'Senior Lifeguard', category: 'senior_lg', fileType: 'pptx', accessPositions: ['admin', 'sr_guard'], size: '27.7 MB', tags: ['orientation', 'required'] },

  // ══════ POOL TECH / SHARED REFERENCE (Pool Tech + Senior + Admin) ══════
  { id: 'pt-1', name: 'O&M Manual — Group A', description: 'Operations & Maintenance manual Group A', folder: 'Pool Tech', category: 'pool_tech', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '2.7 MB', tags: ['manual', 'equipment'] },
  { id: 'pt-2', name: 'O&M Manual — Group P', description: 'Operations & Maintenance manual Group P', folder: 'Pool Tech', category: 'pool_tech', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '1.2 MB', tags: ['manual', 'equipment'] },
  { id: 'pt-3', name: 'BECSystem Quick Reference', description: 'BEC system quick reference guide', folder: 'Pool Tech', category: 'pool_tech', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '107 KB', tags: ['equipment'] },
  { id: 'pt-4', name: 'Pool Tech Waterslide Training Sign-Off', description: 'Waterslide operator training verification', folder: 'Pool Tech', category: 'pool_tech', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'], size: '8 KB', tags: ['training', 'waterslide'] },

  // ══════ SHARED TRAINING (Admin + Sr + PT + LG) ══════
  { id: 'tr-1', name: 'SFAC Lifeguard Manual', description: 'Full lifeguard operations manual', folder: 'Shared', category: 'training', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '3.3 MB', tags: ['manual', 'required'] },
  { id: 'tr-2', name: 'Swim Instructor Manual 2018', description: 'Swim lesson instruction guide', folder: 'Shared', category: 'training', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '1.7 MB', tags: ['manual', 'swim-lessons'] },
  { id: 'tr-3', name: 'Wildfire Smoke Training 2020', description: 'Environmental safety protocols', folder: 'Shared', category: 'training', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'], size: '985 KB', tags: ['training', 'safety'] },

  // ══════ AUDIT FORMS (Senior + Admin ONLY) ══════
  { id: 'au-1', name: 'VAT Audit Sheet', description: 'Visual Acuity Test tracking document', folder: 'Audits', category: 'audits', fileType: 'docx', accessPositions: ['admin', 'sr_guard'], size: '124 KB', tags: ['audit'] },
  { id: 'au-2', name: 'Lifeguard CPR Audit', description: 'CPR skills audit form', folder: 'Audits', category: 'audits', fileType: 'docx', accessPositions: ['admin', 'sr_guard'], size: '10 KB', tags: ['audit'] },
  { id: 'au-3', name: 'Swim Instructor Audit', description: 'Swim instructor skills assessment', folder: 'Audits', category: 'audits', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'], size: '23 KB', tags: ['audit'] },
];

const CATEGORIES: { key: DocCategory; label: string; icon: string; minRole?: UserRole }[] = [
  { key: 'all', label: 'All Documents', icon: '📚' },
  { key: 'staff_forms', label: 'Staff Forms', icon: '📝' },
  { key: 'checklists', label: 'Checklist Forms', icon: '☑' },
  { key: 'senior_lg', label: 'Senior Lifeguard', icon: '🏅' },
  { key: 'pool_tech', label: 'Pool Tech', icon: '🔧' },
  { key: 'training', label: 'Training', icon: '📖' },
  { key: 'audits', label: 'Audit Forms', icon: '✓' },
];

const FILE_ICONS: Record<string, string> = { pdf: '📄', docx: '📝', xlsx: '📊', pptx: '📑', video: '🎬', image: '🖼️', doc: '📝' };
const FILE_COLORS: Record<string, string> = { pdf: '#f87171', docx: '#4285f4', xlsx: '#22c55e', pptx: '#f97316', video: '#a855f7', image: '#2dd4bf', doc: '#4285f4' };

export default function DocumentsPage() {
  const { user, hasRole } = useAuth();
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [search, setSearch] = useState('');

  const accessible = DOCUMENTS.filter(d => user && d.accessPositions.includes(user.role));

  const filtered = accessible.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory;
    const matchSearch = search === '' || d.name.toLowerCase().includes(search.toLowerCase()) || d.tags?.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Only show category pills that contain at least 1 accessible doc
  const visibleCategories = CATEGORIES.filter(cat => {
    if (cat.key === 'all') return true;
    return accessible.some(d => d.category === cat.key);
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Document Library</h1>
          <p className="page-subtitle">{accessible.length} files available to you</p>
        </div>
        {hasRole('admin') && (
          <button className="btn btn-primary btn-sm">⬆ Upload Document</button>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {visibleCategories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`btn btn-sm ${activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: 6 }}
          >
            {cat.icon} {cat.label}
            <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: 4 }}>
              ({accessible.filter(d => cat.key === 'all' || d.category === cat.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-wrapper mb-6" style={{ maxWidth: 360 }}>
        <span className="search-icon" style={{ fontSize: '0.875rem' }}>🔍</span>
        <input className="form-input search-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} id="doc-search" />
      </div>

      {/* Document Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(doc => (
          <div key={doc.id} className="doc-card card">
            <div className="flex items-start gap-3">
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${FILE_COLORS[doc.fileType] || '#888'}15`,
                border: `1px solid ${FILE_COLORS[doc.fileType] || '#888'}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
              }}>
                {FILE_ICONS[doc.fileType] || '📄'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm font-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name}
                </div>
                <div className="text-xs text-muted mt-1">{doc.description}</div>
                <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                  <span className="tag tag-blue" style={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>{doc.fileType}</span>
                  <span className="text-xs text-muted">{doc.size}</span>
                  <span className="text-xs text-muted">📂 {doc.folder}</span>
                </div>
              </div>
            </div>

            {doc.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                {doc.tags.map(tag => (
                  <span key={tag} className="badge badge-neutral" style={{ padding: '1px 7px', fontSize: '0.65rem' }}>{tag}</span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3" style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>👁 View</button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>⬇ Download</button>
              {hasRole('admin') && (
                <button className="btn btn-ghost btn-sm btn-icon" title="Manage access">⚙</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No documents found</p>
          <p className="text-sm text-muted">Try a different category or search term</p>
        </div>
      )}

      <style jsx>{`
        .doc-card { transition: all 200ms; }
        .doc-card:hover { transform: translateY(-2px); box-shadow: var(--glow-aqua); }
      `}</style>
    </div>
  );
}
