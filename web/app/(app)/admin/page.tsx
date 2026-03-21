'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  DEFAULT_POSITIONS, DEFAULT_SHIFTS, Position,
  PERMISSION_GROUPS, PERMISSION_LABELS, PositionPermissions, ShiftDefinition
} from '@/lib/types';

type AdminTab = 'positions' | 'documents' | 'users' | 'shifts' | 'history';

// Demo docs — same set as documents page
const DEMO_DOCS = [
  { id: '1', name: 'SFAC Lifeguard Manual', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
  { id: '2', name: 'Daily/Weekly LG Checklist — Summer', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
  { id: '3', name: 'Daily/Weekly LG Checklist — Offseason', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
  { id: '4', name: 'VAT Audit Sheet', fileType: 'docx', accessPositions: ['admin', 'sr_guard'] },
  { id: '5', name: 'Lifeguard CPR Audit', fileType: 'docx', accessPositions: ['admin', 'sr_guard'] },
  { id: '6', name: 'Swim Instructor Audit', fileType: 'pdf', accessPositions: ['admin', 'sr_guard'] },
  { id: '7', name: 'Pre-Opening Inspection Log 2023', fileType: 'docx', accessPositions: ['admin', 'sr_guard'] },
  { id: '8', name: 'Senior Lifeguard Orientation', fileType: 'pptx', accessPositions: ['admin', 'sr_guard'] },
  { id: '9', name: 'Monthly Maintenance — On Season', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '10', name: 'Monthly Maintenance — Off Season', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '11', name: 'Chemical Check Log', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '12', name: 'Chemical & First Aid Inventory', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '13', name: 'Pool Tech Waterslide Training', fileType: 'docx', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '14', name: 'O&M Manual — Group A', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '15', name: 'O&M Manual — Group P', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '16', name: 'BECSystem Quick Reference', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech'] },
  { id: '17', name: 'Incident Report 2024', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
  { id: '18', name: 'AED Daily Checklist', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
  { id: '19', name: 'Wildfire Smoke Training 2020', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
  { id: '20', name: 'Swim Instructor Manual 2018', fileType: 'pdf', accessPositions: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
];

// Demo change history
const DEMO_HISTORY = [
  { id: '1', performedBy: 'Branden Uyeda', action: 'add_audit', description: 'Marked VAT audit complete for Emma Knab', performedAt: '2026-03-20T14:32:00Z', undone: false },
  { id: '2', performedBy: 'Sophia Smith', action: 'add_audit', description: 'Marked CPR audit complete for Patrick Ama', performedAt: '2026-03-20T11:15:00Z', undone: false },
  { id: '3', performedBy: 'Branden Uyeda', action: 'add_audit', description: 'Marked Brick Test complete for Ethan Gallagher', performedAt: '2026-03-19T16:45:00Z', undone: false },
  { id: '4', performedBy: 'Admin', action: 'toggle_doc_access', description: 'Added "lifeguard" access to Swim Instructor Manual', performedAt: '2026-03-18T09:00:00Z', undone: false },
  { id: '5', performedBy: 'Admin', action: 'add_staff', description: 'Added new employee: Katie Clinton (Lifeguard)', performedAt: '2026-03-15T10:30:00Z', undone: false },
  { id: '6', performedBy: 'Sophia Smith', action: 'add_audit', description: 'Marked Live Recognition audit for Bryan Jung', performedAt: '2026-03-14T13:20:00Z', undone: true },
];

const ACTION_ICON: Record<string, string> = {
  add_audit: '✓', edit_audit: '✏️', add_staff: '👤', remove_staff: '🗑', toggle_visibility: '👁',
  change_role: '🏷', upload_doc: '📁', toggle_doc_access: '🔐',
};

const MOCK_USERS = [
  { uid: '1', name: 'Branden Uyeda', email: 'branden@sfac.org', positionId: 'sr_guard', active: true, lastLogin: '2026-03-20' },
  { uid: '2', name: 'Hector Macias', email: 'hector@sfac.org', positionId: 'pool_tech', active: true, lastLogin: '2026-03-19' },
  { uid: '3', name: 'Sophia Smith', email: 'sophia@sfac.org', positionId: 'sr_guard', active: true, lastLogin: '2026-03-20' },
  { uid: '4', name: 'Emma Knab', email: 'emma@sfac.org', positionId: 'lifeguard', active: true, lastLogin: '2026-03-18' },
  { uid: '5', name: 'Bryan Jung', email: 'bryan@sfac.org', positionId: 'lifeguard', active: false, lastLogin: '2026-03-10' },
];

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: on ? 'var(--aqua-500)' : 'var(--bg-elevated)',
        position: 'relative', transition: 'background 200ms', flexShrink: 0,
        boxShadow: on ? '0 0 8px rgba(0,184,224,0.4)' : 'none',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: '50%', background: 'white', transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('positions');
  const [positions, setPositions] = useState<Position[]>(DEFAULT_POSITIONS);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('sr_guard');
  const [docs, setDocs] = useState(DEMO_DOCS);
  const [shifts, setShifts] = useState<ShiftDefinition[]>(DEFAULT_SHIFTS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [showNewPositionModal, setShowNewPositionModal] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [newPosColor, setNewPosColor] = useState('#00d4ff');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Admin Only</p>
          <p className="text-sm text-muted">This area is for administrators only.</p>
        </div>
      </div>
    );
  }

  const selectedPosition = positions.find(p => p.id === selectedPositionId)!;

  const updatePermission = (key: keyof PositionPermissions, value: boolean) => {
    if (selectedPositionId === 'admin') return; // admin perms are locked
    setPositions(prev => prev.map(p =>
      p.id === selectedPositionId
        ? { ...p, permissions: { ...p.permissions, [key]: value } }
        : p
    ));
  };

  const toggleDocAccess = (docId: string, positionId: string) => {
    setDocs(prev => prev.map(d => {
      if (d.id !== docId) return d;
      const current = d.accessPositions;
      if (positionId === 'admin') return d; // admin always has access
      const has = current.includes(positionId);
      return { ...d, accessPositions: has ? current.filter(p => p !== positionId) : [...current, positionId] };
    }));
  };

  const setDocAdminOnly = (docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, accessPositions: ['admin'] } : d));
  };

  const addPosition = () => {
    if (!newPosName.trim()) return;
    const newPos: Position = {
      id: `custom-${Date.now()}`,
      name: newPosName,
      color: newPosColor,
      isBuiltIn: false,
      rank: positions.length,
      permissions: { ...DEFAULT_POSITIONS[3].permissions }, // copy lifeguard defaults
    };
    setPositions(prev => [...prev, newPos]);
    setNewPosName('');
    setShowNewPositionModal(false);
    setSelectedPositionId(newPos.id);
  };

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'positions', label: 'Positions & Permissions', icon: '🏷' },
    { key: 'documents', label: 'Document Access', icon: '🔐' },
    { key: 'users', label: 'Users & Accounts', icon: '👤' },
    { key: 'shifts', label: 'Shift Schedule', icon: '🕐' },
    { key: 'history', label: 'Change History', icon: '📜' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-subtitle">Manage positions, permissions, document access, and staff accounts</p>
        </div>
        <span className="badge badge-admin">⚙ Administrator</span>
      </div>

      {/* Tab Bar (horizontal scroll on mobile) */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', marginBottom: 28, overflowX: 'auto', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--aqua-500)' : '2px solid transparent',
              color: activeTab === t.key ? 'var(--aqua-400)' : 'var(--text-secondary)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 200ms',
              marginBottom: -1,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ━━━ POSITIONS & PERMISSIONS ━━━ */}
      {activeTab === 'positions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Position List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Positions</div>
              <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowNewPositionModal(true)}>+ Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {positions.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPositionId(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 8, border: 'none',
                    background: selectedPositionId === p.id ? `${p.color}18` : 'var(--bg-card)',
                    borderLeft: selectedPositionId === p.id ? `3px solid ${p.color}` : '3px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    color: selectedPositionId === p.id ? p.color : 'var(--text-secondary)',
                    fontWeight: selectedPositionId === p.id ? 600 : 400,
                    transition: 'all 200ms',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{p.name}</span>
                  {!p.isBuiltIn && <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }} onClick={e => { e.stopPropagation(); setPositions(prev => prev.filter(pos => pos.id !== p.id)); }}>✕</button>}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions for selected position */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedPosition?.color }} />
              <h2 className="section-title">{selectedPosition?.name} Permissions</h2>
              {selectedPosition?.isBuiltIn && selectedPositionId !== 'admin' && (
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Built-in · customizable</span>
              )}
              {selectedPositionId === 'admin' && (
                <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>Admin · locked</span>
              )}
            </div>

            {selectedPositionId === 'admin' && (
              <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <p className="text-sm text-secondary">Administrators always have full access to everything. These permissions cannot be changed.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label} className="card" style={{ padding: '16px 20px' }}>
                  <div className="flex items-center gap-2 mb-14" style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: '1rem' }}>{group.icon}</span>
                    <h3 className="font-semibold text-sm">{group.label}</h3>
                    {group.adminOnly && <span className="tag tag-blue" style={{ fontSize: '0.6rem' }}>Admin-locked</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.keys.map(key => {
                      const isLocked = selectedPositionId === 'admin' || (group.adminOnly && selectedPositionId !== 'admin');
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <label className="text-sm" style={{ color: isLocked ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: isLocked ? 'default' : 'pointer' }}>
                            {PERMISSION_LABELS[key]}
                          </label>
                          <Toggle
                            on={selectedPosition?.permissions[key] ?? false}
                            onChange={v => updatePermission(key, v)}
                            disabled={isLocked}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedPositionId !== 'admin' && (
              <div className="flex gap-3 mt-4">
                <button className="btn btn-primary">Save Changes</button>
                <button className="btn btn-ghost btn-sm">Reset to Default</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━ DOCUMENT ACCESS ━━━ */}
      {activeTab === 'documents' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Document Access Control</h2>
              <p className="text-sm text-muted mt-1">Toggle which positions can see each document. Admin always has access.</p>
            </div>
            <button className="btn btn-primary btn-sm">⬆ Upload Document</button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 240 }}>Document</th>
                    {positions.filter(p => p.id !== 'admin').map(p => (
                      <th key={p.id} style={{ textAlign: 'center', minWidth: 100, color: p.color }}>{p.name}</th>
                    ))}
                    <th style={{ textAlign: 'center', minWidth: 120 }}>Admin Only</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div className="font-medium text-sm">{doc.name}</div>
                        <div className="text-xs text-muted">{doc.fileType.toUpperCase()}</div>
                      </td>
                      {positions.filter(p => p.id !== 'admin').map(p => (
                        <td key={p.id} style={{ textAlign: 'center' }}>
                          <Toggle
                            on={doc.accessPositions.includes(p.id)}
                            onChange={() => toggleDocAccess(doc.id, p.id)}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: doc.accessPositions.length === 1 && doc.accessPositions[0] === 'admin'
                              ? 'rgba(168,85,247,0.15)' : 'var(--bg-elevated)',
                            color: 'var(--purple-400)',
                            border: '1px solid rgba(168,85,247,0.2)',
                            padding: '4px 10px',
                            fontSize: '0.7rem',
                          }}
                          onClick={() => setDocAdminOnly(doc.id)}
                        >
                          🔒 Lock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ USERS & ACCOUNTS ━━━ */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">User Accounts</h2>
              <p className="text-sm text-muted mt-1">Staff who can log into the app. Invite new staff after adding them to the Staff Directory.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInviteModal(true)}>📧 Invite User</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Position</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const pos = positions.find(p => p.id === u.positionId) || DEFAULT_POSITIONS[3];
                  return (
                    <tr key={u.uid}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm">{u.name.split(' ').map(n => n[0]).join('')}</div>
                          <div>
                            <div className="font-medium text-sm">{u.name}</div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 30px 4px 10px', width: 'auto', fontSize: '0.8rem', color: pos.color }}
                          value={u.positionId}
                          onChange={e => setUsers(prev => prev.map(usr => usr.uid === u.uid ? { ...usr, positionId: e.target.value } : usr))}
                        >
                          {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td><span className="text-sm text-muted">{u.lastLogin}</span></td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-success' : 'badge-neutral'}`}>
                          {u.active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" title="Reset password" style={{ fontSize: '0.8rem' }}>🔑 Reset PW</button>
                          <button className="btn btn-danger btn-sm" title="Revoke access" style={{ fontSize: '0.8rem' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Invite modal */}
          {showInviteModal && (
            <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3 className="section-title mb-2">Invite New User</h3>
                <p className="text-sm text-muted mb-6">Send a login invite email. User sets their own password on first sign-in.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" placeholder="name@email.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Position</label>
                    <select className="form-select">
                      {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                    <p className="text-xs text-secondary">They will receive an email with a link to set their password and log in. Their app access is determined by their assigned position.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1 }}>Send Invite</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━ SHIFTS ━━━ */}
      {activeTab === 'shifts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Shift Schedule</h2>
              <p className="text-sm text-muted mt-1">Shift context for dashboard to-do lists. Scheduling managed in DigiAquatics.</p>
            </div>
            <button className="btn btn-primary btn-sm">+ Add Shift</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shifts.map(shift => (
              <div key={shift.id} className="card" style={{ padding: '14px 18px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{shift.name}</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {shift.days.map(d => (
                          <span key={d} className="tag tag-blue" style={{ fontSize: '0.6rem' }}>{d.slice(0, 3).toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted mt-1">{shift.startTime} – {shift.endTime}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle on={shift.active} onChange={v => setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, active: v } : s))} />
                    <button className="btn btn-secondary btn-sm">✏️ Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━ CHANGE HISTORY ━━━ */}
      {activeTab === 'history' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Change History</h2>
              <p className="text-sm text-muted mt-1">All changes made by Senior Guards and Admins — visible to Admin only.</p>
            </div>
            <button className="btn btn-secondary btn-sm">⬇ Export</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_HISTORY.map(entry => (
              <div key={entry.id} className="card" style={{ padding: '14px 18px', opacity: entry.undone ? 0.6 : 1, borderColor: entry.undone ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{ACTION_ICON[entry.action]}</span>
                  <div style={{ flex: 1 }}>
                    <div className="text-sm font-medium" style={{ textDecoration: entry.undone ? 'line-through' : 'none' }}>
                      {entry.description}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      By <strong>{entry.performedBy}</strong> · {new Date(entry.performedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {entry.undone && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Undone</span>}
                    {!entry.undone && <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>↩ Undo</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Position Modal */}
      {showNewPositionModal && (
        <div className="modal-overlay" onClick={() => setShowNewPositionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="section-title mb-2">New Position</h3>
            <p className="text-sm text-muted mb-6">Permissions will default to Lifeguard-level. Customize after creating.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Position Name</label>
                <input className="form-input" placeholder="e.g. Jr. Lifeguard, Swim Instructor, Dispatcher..." value={newPosName} onChange={e => setNewPosName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#00d4ff', '#22c55e', '#f59e0b', '#a855f7', '#f97316', '#f87171', '#2dd4bf', '#60a5fa'].map(c => (
                    <div
                      key={c}
                      onClick={() => setNewPosColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: newPosColor === c ? '3px solid white' : '2px solid transparent',
                        boxShadow: newPosColor === c ? `0 0 0 2px ${c}` : 'none',
                        transition: 'all 150ms',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewPositionModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addPosition} disabled={!newPosName.trim()}>Create Position</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
