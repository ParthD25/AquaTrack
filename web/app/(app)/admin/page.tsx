'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
}

const ADMIN_CARDS: AdminCard[] = [
  {
    id: 'staff',
    title: 'Staff Directory',
    description: 'Manage lifeguards, roles, positions, and certifications',
    icon: '👥',
    href: '/staff',
  },
  {
    id: 'documents',
    title: 'Documents Library',
    description: 'Upload and manage checklists, forms, and training materials',
    icon: '📁',
    href: '/admin/documents-library',
  },
  {
    id: 'positions',
    title: 'Positions & Roles',
    description: 'Configure custom positions and manage role permissions',
    icon: '🏷️',
    href: '/admin/positions',
  },
  {
    id: 'shifts',
    title: 'Shift Templates',
    description: 'Define shift schedules and daily task templates',
    icon: '🕐',
    href: '/admin/shifts',
  },
  {
    id: 'audits',
    title: 'Audit Configuration',
    description: 'Set up and manage audit types and renewal requirements',
    icon: '✓',
    href: '/admin/audits',
  },
  {
    id: 'access',
    title: 'Access & Permissions',
    description: 'Manage user access levels and document visibility',
    icon: '🔐',
    href: '/admin/access',
  },
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.roleTier === 'admin';

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

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Admin Control Panel</h1>
        <p className="page-subtitle">Manage staff, documents, positions, and system configuration</p>
      </div>

      {/* Admin Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {ADMIN_CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => router.push(card.href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              textAlign: 'left',
              textDecoration: 'none',
              color: 'inherit',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--aqua-400)';
              el.style.boxShadow = '0 4px 12px rgba(0, 184, 224, 0.1)';
              el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--border-color)';
              el.style.boxShadow = 'none';
              el.style.transform = 'translateY(0)';
            }}
          >
            {/* Icon and Title Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{card.icon}</span>
              {card.badge && <span className="badge badge-admin" style={{ marginLeft: 'auto' }}>{card.badge}</span>}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', margin: 0 }}>{card.title}</h3>

            {/* Description */}
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                margin: 0,
                marginBottom: '12px',
                flex: 1,
              }}
            >
              {card.description}
            </p>

            {/* Arrow */}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aqua-400)' }}>
              <span style={{ fontSize: '12px' }}>Manage</span>
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(74, 222, 128, 0.05)',
          border: '1px solid rgba(74, 222, 128, 0.2)',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
        }}
      >
        <p style={{ margin: 0, marginBottom: '8px' }}>
          <strong>💡 Tip:</strong> Changes made in these sections affect all users and operations immediately.
        </p>
        <p style={{ margin: 0 }}>
          For staff management, permissions, and certifications, see the <strong>Staff Directory</strong> page.
        </p>
      </div>
    </div>
  );
}
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

      {/* ━━━ ACCESS CONTROL ━━━ */}
      {activeTab === 'access' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Access Control</h2>
              <p className="text-sm text-muted mt-1">Manage roles and visibility for each employee.</p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLoading && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Loading staff...</td></tr>
                  )}
                  {!accessLoading && accessStaff.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="text-sm font-semibold">{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-muted">{s.email || 'No email on file'}</div>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 30px 4px 10px', width: 'auto', fontSize: '0.8rem' }}
                          value={s.positionId}
                          onChange={async e => {
                            const positionId = e.target.value;
                            setAccessStaff(prev => prev.map(mem => mem.id === s.id ? { ...mem, positionId } : mem));
                            await updateDoc(doc(db, 'staff', s.id), { positionId }).catch(console.error);
                          }}
                        >
                          {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 30px 4px 10px', width: 'auto', fontSize: '0.8rem' }}
                          value={s.status || 'active'}
                          onChange={async e => {
                            const status = e.target.value;
                            setAccessStaff(prev => prev.map(mem => mem.id === s.id ? { ...mem, status } : mem));
                            await updateDoc(doc(db, 'staff', s.id), { status }).catch(console.error);
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="former">Former</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={async () => {
                            const visible = s.visible === false ? true : false;
                            setAccessStaff(prev => prev.map(mem => mem.id === s.id ? { ...mem, visible } : mem));
                            await updateDoc(doc(db, 'staff', s.id), { visible }).catch(console.error);
                          }}
                        >
                          {s.visible === false ? 'Show' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!accessLoading && accessStaff.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No staff records found.</td></tr>
                  )}
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
                {usersLoading && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Loading users...</td></tr>
                )}
                {!usersLoading && users.map(u => {
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
                          onChange={async e => {
                            const positionId = e.target.value;
                            setUsers(prev => prev.map(usr => usr.uid === u.uid ? { ...usr, positionId } : usr));
                            await updateDoc(doc(db, 'users', u.uid), { positionId, role: positionId }).catch(console.error);
                            await updateDoc(doc(db, 'staff', u.uid), { positionId }).catch(console.error);
                          }}
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
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Reset password"
                            style={{ fontSize: '0.8rem' }}
                            onClick={async () => {
                              setActionStatus('');
                              const result = await callAdminAction('/api/admin/reset-password', { uid: u.uid, email: u.email });
                              if (!result.ok) {
                                setActionStatus(result.error || 'Reset failed');
                                return;
                              }
                              setActionStatus('Password reset link generated.');
                            }}
                          >
                            🔑 Reset PW
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Revoke access"
                            style={{ fontSize: '0.8rem' }}
                            onClick={async () => {
                              setActionStatus('');
                              const result = await callAdminAction('/api/admin/revoke-user', { uid: u.uid });
                              if (!result.ok) {
                                setActionStatus(result.error || 'Revoke failed');
                                return;
                              }
                              setUsers(prev => prev.map(usr => usr.uid === u.uid ? { ...usr, active: false } : usr));
                              setActionStatus('Access revoked.');
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!usersLoading && users.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No user accounts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {actionStatus && (
            <div className="text-sm text-muted" style={{ marginTop: 10 }}>{actionStatus}</div>
          )}

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
