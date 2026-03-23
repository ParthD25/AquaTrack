'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AUDIT_TYPES, AuditType } from '@/lib/types';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';

type StaffAuditStatus = {
  staffId: string;
  name: string;
  audits: Record<AuditType, { completed: boolean; date?: string; evaluator?: string; notes?: string }>;
};

const CURRENT_SEASON = 'Summer 2026';

// staff data populated from firestore

export default function AuditsPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [activeType, setActiveType] = useState<AuditType>('vat');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffAuditStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [staffData, setStaffData] = useState<StaffAuditStatus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // History Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStaffId, setHistoryStaffId] = useState<string | null>(null);
  const [historyName, setHistoryName] = useState('');
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function fetchAudits() {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        const data = snap.docs.map(d => {
          const s = d.data();
          // Ensure all audit types exist in object
          const defaultAudits = Object.fromEntries(AUDIT_TYPES.map(t => [t.key, { completed: false }]));
          return {
            staffId: d.id,
            name: `${s.firstName} ${s.lastName}`,
            audits: s.audits ? { ...defaultAudits, ...s.audits } : defaultAudits
          } as StaffAuditStatus;
        });
        setStaffData(data.sort((a,b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAudits();
  }, []);

  if (!hasRole('admin', 'sr_guard')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted">Audit Tracker is available to Senior Guards and Admins only.</p>
        </div>
      </div>
    );
  }

  const activeMeta = AUDIT_TYPES.find(t => t.key === activeType)!;

  const filteredStaff = staffData.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const auditStatus = s.audits[activeType];
    if (filter === 'done') return matchSearch && auditStatus.completed;
    if (filter === 'pending') return matchSearch && !auditStatus.completed;
    return matchSearch;
  });

  const completedCount = staffData.filter(s => s.audits[activeType].completed).length;
  const pct = staffData.length ? Math.round((completedCount / staffData.length) * 100) : 0;

  const handleMark = (staff: StaffAuditStatus) => {
    setSelectedStaff(staff);
    setNotes('');
    setShowModal(true);
  };

  const confirmMark = async () => {
    if (!selectedStaff) return;
    const nowStr = format(new Date(), 'yyyy-MM-dd');
    const evaluatorName = user?.displayName || 'Unknown';
    const auditData = { completed: true, date: nowStr, evaluator: evaluatorName, notes };
    
    setStaffData(prev => prev.map(s =>
      s.staffId === selectedStaff.staffId
        ? { ...s, audits: { ...s.audits, [activeType]: auditData } }
        : s
    ));
    
    const completedAt = new Date().toISOString();
    const recordId = `audit_${Date.now()}`;

    await updateDoc(doc(db, 'staff', selectedStaff.staffId), {
      [`audits.${activeType}`]: auditData
    }).catch(console.error);

    await setDoc(doc(db, 'audits', recordId), {
      id: recordId,
      staffId: selectedStaff.staffId,
      staffName: selectedStaff.name,
      auditType: activeType,
      completedBy: user?.uid || 'unknown',
      completedByName: evaluatorName,
      completedAt,
      season: CURRENT_SEASON,
      notes,
      orgId: user?.orgId || 'sfac',
    }).catch(console.error);

    const histId = `hist_${Date.now()}`;
    await setDoc(doc(db, 'history', histId), {
      id: histId,
      action: 'add_audit',
      performedBy: user?.uid || 'unknown',
      performedByName: evaluatorName,
      performedAt: completedAt,
      description: `Marked ${activeMeta.label} for ${selectedStaff.name}`,
      targetId: recordId,
      targetName: selectedStaff.name,
      orgId: user?.orgId || 'sfac',
    }).catch(console.error);

    setShowModal(false);
  };

  const handleExport = () => {
    const rows = [
      ['Name', 'Audit Type', 'Completed', 'Date', 'Evaluator', 'Notes'],
      ...staffData.map(s => {
        const a = s.audits[activeType];
        return [
          s.name,
          activeMeta.label,
          a.completed ? 'Yes' : 'No',
          a.date || '',
          a.evaluator || '',
          (a.notes || '').replace(/\n/g, ' '),
        ];
      }),
    ];

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audits_${activeType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openHistory = async (staffId: string, name: string) => {
    setHistoryStaffId(staffId);
    setHistoryName(name);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const q = query(collection(db, 'audits'), where('staffId', '==', staffId));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => d.data());

      if (docs.length === 0) {
        const staff = staffData.find(s => s.staffId === staffId);
        if (staff) {
          const fallback = Object.entries(staff.audits)
            .filter(([, data]) => data.completed)
            .map(([auditType, data]) => ({
              auditType,
              notes: data.notes || '',
              season: CURRENT_SEASON,
              completedByName: data.evaluator || 'Unknown',
              completedAt: data.date ? `${data.date}T12:00:00Z` : new Date().toISOString(),
            }));
          setAuditHistory(fallback);
        } else {
          setAuditHistory([]);
        }
      } else {
        const sorted = docs.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
        setAuditHistory(sorted);
      }
    } catch (e) {
      console.error(e);
      setAuditHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const auditColors: Record<AuditType, string> = {
    vat: '#00d4ff',
    cpr: '#f87171',
    brick: '#fb923c',
    live_recognition: '#4ade80',
    swim_instructor: '#c084fc',
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Audit Tracker</h1>
          <p className="page-subtitle">
            {CURRENT_SEASON} · Live Exercise Practice — tracking skills development, not pass/fail
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>⬇ Export</button>
          {hasRole('admin', 'sr_guard') && (
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/audits/new-vat')}>
              + Interactive Tracker
            </button>
          )}
        </div>
      </div>

      {/* Audit Type Tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {AUDIT_TYPES.map(at => {
          const done = staffData.filter(s => s.audits[at.key].completed).length;
          const total = staffData.length;
          const pctDone = total ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={at.key}
              onClick={() => setActiveType(at.key)}
              className={`audit-type-tab ${activeType === at.key ? 'active' : ''}`}
              style={{ '--tab-color': auditColors[at.key] } as React.CSSProperties}
            >
              <span>{at.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div className="text-sm font-semibold">{at.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{pctDone}% done</div>
              </div>
              <div className="mini-bar">
                <div className="mini-fill" style={{ width: `${pctDone}%`, background: auditColors[at.key] }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Audit Header */}
      <div className="card mb-6" style={{ borderColor: `${auditColors[activeType]}30` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${auditColors[activeType]}15`,
              border: `1px solid ${auditColors[activeType]}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
            }}>{activeMeta.icon}</div>
            <div>
              <h2 className="section-title" style={{ color: auditColors[activeType] }}>
                {activeMeta.label}
              </h2>
              <p className="text-sm text-secondary">{activeMeta.description} · Live Exercise Practice</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-2xl font-bold" style={{ color: auditColors[activeType] }}>{completedCount}/{staffData.length}</div>
            <div className="text-sm text-muted">staff completed this season</div>
            <div className="progress-bar mt-2" style={{ width: 120, marginLeft: 'auto' }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: auditColors[activeType] }} />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon" style={{ fontSize: '0.875rem' }}>🔍</span>
          <input
            className="form-input search-input"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="audit-search"
          />
        </div>
        <div className="tabs" style={{ width: 'auto' }}>
          {(['all', 'pending', 'done'] as const).map(f => (
            <button key={f} className={`tab-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}
              style={{ flex: 'none', padding: '8px 14px' }}>
              {f === 'all' ? `All (${staffData.length})` : f === 'pending' ? `Pending (${staffData.filter(s => !s.audits[activeType].completed).length})` : `Done (${completedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filteredStaff.map(staff => {
          const audit = staff.audits[activeType];
          return (
            <div
              key={staff.staffId}
              className={`staff-audit-card ${audit.completed ? 'audit-complete' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="avatar" style={{
                  background: audit.completed
                    ? `linear-gradient(135deg, ${auditColors[activeType]}, #0a1530)`
                    : 'linear-gradient(135deg, #1e293b, #0a1530)',
                }}>
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {staff.name}
                  </div>
                  {audit.completed ? (
                    <div className="text-xs" style={{ color: 'var(--green-400)' }}>
                      ✓ {audit.date} · {audit.evaluator}
                    </div>
                  ) : (
                    <div className="text-xs text-muted">⏳ Not yet completed</div>
                  )}
                </div>
                {audit.completed ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>Done</span>
                ) : hasRole('admin', 'sr_guard') ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleMark(staff)}
                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                  >
                    Mark ✓
                  </button>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Pending</span>
                )}
              </div>
              {audit.notes && (
                <div className="text-xs text-muted mt-2" style={{ paddingLeft: 52, fontStyle: 'italic' }}>
                  {audit.notes}
                </div>
              )}
              <div style={{ paddingLeft: 52, marginTop: 8 }}>
                <button 
                  onClick={() => openHistory(staff.staffId, staff.name)}
                  className="text-xs font-semibold" 
                  style={{ background: 'none', border: 'none', color: 'var(--aqua-400)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  View Performance History →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No staff found matching your search</p>
        </div>
      )}

      {/* Mark Complete Modal */}
      {showModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ fontSize: '2rem' }}>{activeMeta.icon}</div>
              <div>
                <h3 className="section-title">Mark Live Exercise</h3>
                <p className="text-sm text-muted">{activeMeta.label} · {activeMeta.description}</p>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <div className="text-xs text-muted uppercase" style={{ letterSpacing: '0.06em', marginBottom: 4 }}>Staff Member</div>
              <div className="flex items-center gap-2">
                <div className="avatar avatar-sm">{selectedStaff.name.split(' ').map(n => n[0]).join('')}</div>
                <span className="font-semibold">{selectedStaff.name}</span>
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Practiced brick retrieval, strong technique shown..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
              <p className="text-xs text-secondary">
                ⚡ This records a <strong style={{ color: 'var(--aqua-400)' }}>Live Exercise completion</strong> — not a pass/fail. This is for ongoing skills development tracking.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmMark}>Confirm ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: 600, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title">Evaluation Records</h3>
                <p className="text-sm text-muted">{historyName} · All Seasons</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center p-12"><div className="spinner" /></div>
            ) : auditHistory.length === 0 ? (
              <div className="empty-state p-8">
                <div className="text-2xl mb-2">📄</div>
                <p>No historic records found for this employee.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                {auditHistory.map((h, i) => {
                  const type = AUDIT_TYPES.find(t => t.key === h.auditType);
                  return (
                    <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '1.2rem' }}>{type?.icon || '📋'}</span>
                          <span className="font-bold text-sm">{type?.label || h.auditType}</span>
                        </div>
                        <span className="text-xs text-muted">{format(new Date(h.completedAt), 'MMM d, yyyy · h:mm a')}</span>
                      </div>
                      <div className="text-xs text-secondary mb-2 whitespace-pre-wrap" style={{ lineHeight: 1.5 }}>
                        {h.notes || 'No specific notes recorded.'}
                      </div>
                      <div className="text-xs text-muted flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span>Season: {h.season}</span>
                        <span>Evaluator: <strong>{h.completedByName}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary btn-sm" onClick={() => setShowHistoryModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .audit-type-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 200ms;
          font-family: inherit;
          flex: 1;
          min-width: 160px;
          position: relative;
          overflow: hidden;
          color: var(--text-secondary);
        }
        .audit-type-tab:hover {
          border-color: var(--tab-color);
          background: color-mix(in srgb, var(--tab-color) 5%, var(--bg-card));
          color: var(--text-primary);
        }
        .audit-type-tab.active {
          border-color: var(--tab-color);
          background: color-mix(in srgb, var(--tab-color) 10%, var(--bg-card));
          box-shadow: 0 0 16px color-mix(in srgb, var(--tab-color) 20%, transparent);
          color: var(--text-primary);
        }
        .mini-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: var(--bg-elevated);
        }
        .mini-fill {
          height: 100%;
          border-radius: 0 2px 2px 0;
          transition: width 0.5s ease;
        }
        .staff-audit-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          transition: all 200ms;
        }
        .staff-audit-card:hover {
          border-color: var(--border-dim);
        }
      `}</style>
    </div>
  );
}
