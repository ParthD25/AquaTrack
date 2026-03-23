'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { STAFF_ROSTER, DEFAULT_POSITIONS, StaffMember } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';

type EmployeeStatus = 'active' | 'inactive' | 'former';

interface StatusEntry {
  status: EmployeeStatus;
  date: string;
  changedBy: string;
}

interface ExtendedStaff extends StaffMember {
  status: EmployeeStatus;
  statusHistory: StatusEntry[];
}

// staff populated directly from firestore

function getPosition(positionId: string) {
  return DEFAULT_POSITIONS.find(p => p.id === positionId) || DEFAULT_POSITIONS[3];
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

const STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: '● Active' },
  inactive: { bg: 'rgba(249,115,22,0.12)', text: '#f97316', label: '○ Inactive' },
  former: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: '✕ Former' },
};

type ViewFilter = 'all' | 'active' | 'inactive' | 'former';
type ViewScope = 'all' | 'single';

// Month labels for status history chart
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getStatusAtMonth(history: StatusEntry[] | undefined, year: number, month: number): EmployeeStatus {
  if (!history || history.length === 0) return 'active';
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  let result: EmployeeStatus = 'active';
  for (const entry of history) {
    if (entry.date <= dateStr + '-31') result = entry.status;
  }
  return result;
}

export default function StaffDirectoryPage() {
  const { user, firebaseUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<ViewFilter>('all');
  const [historyMonths, setHistoryMonths] = useState(3);
  const [staff, setStaff] = useState<ExtendedStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    async function fetchStaff() {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        const staffList = snap.docs.map(d => {
          const data = d.data() as ExtendedStaff;
          return {
            id: d.id,
            ...data,
            status: data.status || 'active',
            statusHistory: data.statusHistory || [],
          } as ExtendedStaff;
        });
        setStaff(staffList);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoadingStaff(false);
      }
    }
    fetchStaff();
  }, []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHiddenSection, setShowHiddenSection] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<ExtendedStaff | null>(null);
  const [viewScope] = useState<ViewScope>('all');
  const [showHistoryChart, setShowHistoryChart] = useState(false);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createResult, setCreateResult] = useState<{ tempPassword: string; resetLink: string; email: string } | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    positionId: DEFAULT_POSITIONS[3]?.id || 'lifeguard',
    phone: '',
    email: '',
    address: '',
    isHighSchool: false,
    gradYear: new Date().getFullYear() + 2,
  });

  const isAdmin = user?.role === 'admin';
  const isSrGuard = user?.role === 'admin' || user?.role === 'sr_guard';
  const canSeeEmail = isSrGuard;
  const canSeeAddress = isAdmin;

  // Active = visible to sr_guard + admin. Inactive = visible to sr_guard + admin. Former = admin ONLY.
  const viewableStaff = staff.filter(s => {
    if (s.status === 'former') return isAdmin;
    if (!s.visible) return isAdmin;
    return true;
  });

  // Graduation alert — employees graduating within 3 months
  const graduatingEmployees = staff.filter(s => {
    if (!s.isHighSchool || !s.gradYear) return false;
    const now = new Date();
    const gradDate = new Date(s.gradYear, 5, 1); // June of grad year
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return gradDate <= threeMonthsFromNow && gradDate >= now && s.status === 'active';
  });

  const applyFilters = (list: ExtendedStaff[]) =>
    list
      .filter(s => {
        const matchSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
        const matchPos = filterPosition === 'all' || s.positionId === filterPosition;
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchSearch && matchPos && matchStatus;
      })
      .sort((a, b) => {
        // Active first, then inactive, then former
        const order: Record<EmployeeStatus, number> = { active: 0, inactive: 1, former: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
      });

  const filtered = applyFilters(viewableStaff.filter(s => s.visible));
  const hiddenStaff = staff.filter(s => !s.visible && s.status !== 'former');
  const filteredHidden = applyFilters(hiddenStaff);

  // Counts
  const activeCount = staff.filter(s => s.status === 'active').length;
  const inactiveCount = staff.filter(s => s.status === 'inactive').length;
  const formerCount = staff.filter(s => s.status === 'former').length;

  const toggleVisibility = async (id: string) => {
    const mem = staff.find(s => s.id === id);
    if (!mem) return;
    setStaff(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
    await updateDoc(doc(db, 'staff', id), { visible: !mem.visible }).catch(console.error);
  };

  const changeStatus = async (id: string, newStatus: EmployeeStatus) => {
    const entry = { status: newStatus, date: new Date().toISOString().slice(0, 10), changedBy: user?.displayName || 'Admin' };
    setStaff(prev => prev.map(s => s.id === id ? {
      ...s,
      status: newStatus,
      statusHistory: [...(s.statusHistory || []), entry],
    } : s));
    await updateDoc(doc(db, 'staff', id), {
      status: newStatus,
      statusHistory: arrayUnion(entry)
    }).catch(console.error);
  };

  const changePosition = async (id: string, positionId: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, positionId } : s));
    await updateDoc(doc(db, 'staff', id), { positionId }).catch(console.error);
  };

  const updateGradYear = async (id: string, gradYear: number | undefined) => {
    const isHS = gradYear ? true : false;
    setStaff(prev => prev.map(s => s.id === id ? {
      ...s,
      gradYear,
      isHighSchool: isHS,
    } : s));
    await updateDoc(doc(db, 'staff', id), { gradYear: gradYear || null, isHighSchool: isHS }).catch(console.error);
  };

  const handleCreateEmployee = async () => {
    if (!firebaseUser) return;
    setCreateError('');
    setCreatingEmployee(true);
    try {
      if (!newEmployee.firstName.trim() || !newEmployee.lastName.trim() || !newEmployee.email.trim()) {
        setCreateError('First name, last name, and email are required.');
        setCreatingEmployee(false);
        return;
      }
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newEmployee,
          orgId: user?.orgId || 'sfac',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create employee');
      }

      const created: ExtendedStaff = {
        id: data.uid,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        positionId: newEmployee.positionId,
        phone: newEmployee.phone,
        email: newEmployee.email,
        address: newEmployee.address,
        isHighSchool: newEmployee.isHighSchool,
        gradYear: newEmployee.isHighSchool ? newEmployee.gradYear : undefined,
        active: true,
        visible: true,
        status: 'active',
        statusHistory: [],
        orgId: user?.orgId || 'sfac',
      };

      setStaff(prev => [...prev, created]);
      setCreateResult({ tempPassword: data.tempPassword, resetLink: data.resetLink, email: newEmployee.email });
      setShowAddModal(false);
      setNewEmployee({
        firstName: '',
        lastName: '',
        positionId: DEFAULT_POSITIONS[3]?.id || 'lifeguard',
        phone: '',
        email: '',
        address: '',
        isHighSchool: false,
        gradYear: new Date().getFullYear() + 2,
      });
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create employee');
    } finally {
      setCreatingEmployee(false);
    }
  };

  // Status history for a given time range
  const historyChartData = useMemo(() => {
    const now = new Date();
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = historyMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return months;
  }, [historyMonths]);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-subtitle">
            <span style={{ color: '#22c55e' }}>{activeCount} active</span>
            {' · '}
            <span style={{ color: '#f97316' }}>{inactiveCount} inactive</span>
            {isAdmin && <>{' · '}<span style={{ color: '#ef4444' }}>{formerCount} former</span></>}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setCreateError(''); setCreateResult(null); setShowAddModal(true); }}>
            + Add Employee
          </button>
        )}
      </div>

      {/* Graduation Alert — admin + sr_guard */}
      {isSrGuard && graduatingEmployees.length > 0 && (
        <div className="card mb-4" style={{ background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.25)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#f97316' }}>
                {graduatingEmployees.length} employee{graduatingEmployees.length > 1 ? 's' : ''} possibly graduating soon
              </div>
              <div className="text-xs text-muted mt-1">
                Follow up to confirm summer availability
                {isAdmin && (
                  <>
                    {' — '}
                    {graduatingEmployees.map(e => `${e.firstName} ${e.lastName} (${e.gradYear})`).join(', ')}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon" style={{ fontSize: '0.875rem' }}>🔍</span>
          <input className="form-input search-input" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
          <option value="all">All Positions</option>
          {DEFAULT_POSITIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as ViewFilter)}>
          <option value="all">All Statuses</option>
          <option value="active">🟢 Active Only ({activeCount})</option>
          <option value="inactive">🟠 Inactive Only ({inactiveCount})</option>
          {isAdmin && <option value="former">🔴 Former Only ({formerCount})</option>}
        </select>
        {isSrGuard && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowHistoryChart(!showHistoryChart)}>
            📊 {showHistoryChart ? 'Hide' : 'Show'} Status History
          </button>
        )}
      </div>

      {/* STATUS HISTORY CHART — admin + sr_guard */}
      {showHistoryChart && isSrGuard && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">📊 Employee Status History</h3>
            <select className="form-select" style={{ width: 'auto' }} value={historyMonths} onChange={e => setHistoryMonths(+e.target.value)}>
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <div className="text-xs text-muted mb-3">🟢 Active &nbsp; 🟠 Inactive &nbsp; 🔴 Former</div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${historyChartData.length}, 1fr)`, gap: 2, minWidth: 500 }}>
              {/* Header */}
              <div className="text-xs font-semibold" style={{ padding: 6 }}>Employee</div>
              {historyChartData.map(m => (
                <div key={m.label} className="text-xs text-muted" style={{ textAlign: 'center', padding: 6 }}>{m.label}</div>
              ))}
              {/* Rows */}
              {staff.filter(s => isAdmin || s.status !== 'former').map(emp => (
                <div key={emp.id} style={{ display: 'contents' }}>
                  <div className="text-xs" style={{ padding: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.firstName} {emp.lastName}
                  </div>
                  {historyChartData.map(m => {
                    const st = getStatusAtMonth(emp.statusHistory, m.year, m.month);
                    const color = STATUS_COLORS[st];
                    return (
                      <div
                        key={m.label}
                        style={{
                          background: color.bg,
                          borderRadius: 4,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.6rem', color: color.text, fontWeight: 600 }}>{st[0].toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Senior Contacts — visible to sr_guard+ */}
      {canSeeEmail && (
        <div className="card mb-6" style={{ background: 'rgba(0,212,255,0.04)', borderColor: 'rgba(0,212,255,0.2)' }}>
          <h3 className="section-title mb-3">📞 Senior Guard Contacts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {staff.filter(s => s.positionId === 'sr_guard' && s.status === 'active').map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #00d4ff, #0a1530)' }}>{getInitials(s.firstName, s.lastName)}</div>
                <div>
                  <div className="text-sm font-semibold">{s.firstName} {s.lastName}</div>
                  {s.phone && <div className="text-xs text-muted">📱 {s.phone}</div>}
                  {canSeeEmail && s.email && <div className="text-xs text-muted">✉ {s.email}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Grid — grouped: ACTIVE section, then INACTIVE section (sr_guard+) */}
      {(['active', 'inactive'] as EmployeeStatus[]).map(section => {
        const sectionStaff = filtered.filter(s => s.status === section);
        if (sectionStaff.length === 0) return null;
        const sc = STATUS_COLORS[section];
        return (
          <div key={section} style={{ marginBottom: 24 }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: sc.text, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {sc.label} — {sectionStaff.length} staff
              </span>
              <div style={{ flex: 1, height: 1, background: `${sc.text}20` }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {sectionStaff.map(s => {
                const pos = getPosition(s.positionId);
                const graying = s.status !== 'active';
                return (
                  <div key={s.id} className="card staff-card" onClick={() => isSrGuard && setSelectedStaff(s)} style={{ cursor: isSrGuard ? 'pointer' : 'default', opacity: graying ? 0.7 : 1, borderColor: graying ? `${sc.text}25` : 'var(--border-subtle)' }}>
                    <div className="flex items-start gap-3">
                      <div className="avatar" style={{ background: graying ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${pos.color}60, #0a1530)`, filter: graying ? 'grayscale(0.6)' : 'none' }}>
                        {getInitials(s.firstName, s.lastName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-semibold">{s.firstName} {s.lastName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <span className="badge" style={{ background: `${pos.color}18`, color: pos.color, border: `1px solid ${pos.color}35`, padding: '2px 8px', fontSize: '0.7rem' }}>{pos.name}</span>
                          {s.status !== 'active' && (
                            <span className="badge" style={{ background: sc.bg, color: sc.text, fontSize: '0.65rem', padding: '2px 7px' }}>{sc.label}</span>
                          )}
                          {s.isHighSchool && s.gradYear && (
                            <span className="badge" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', fontSize: '0.65rem', padding: '2px 7px' }}>🎓 {s.gradYear}</span>
                          )}
                        </div>
                        {s.phone && <div className="text-xs text-muted mt-2">📱 {s.phone}</div>}
                        {canSeeEmail && s.email && <div className="text-xs text-muted mt-1">✉ {s.email}</div>}
                        {canSeeAddress && s.address && <div className="text-xs text-muted mt-1">📍 {s.address}</div>}
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }} onClick={e => e.stopPropagation()}>
                          <select
                            className="form-select"
                            style={{ padding: '2px 22px 2px 6px', fontSize: '0.65rem', width: 'auto', color: STATUS_COLORS[s.status].text }}
                            value={s.status}
                            onChange={e => changeStatus(s.id, e.target.value as EmployeeStatus)}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="former">Former</option>
                          </select>
                          <button className="btn btn-ghost btn-sm btn-icon" title={s.visible ? 'Hide' : 'Show'} onClick={() => toggleVisibility(s.id)} style={{ fontSize: '0.75rem' }}>
                            {s.visible ? '👁' : '🚫'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Former Employees — Admin only */}
      {isAdmin && (() => {
        const formerStaff = filtered.filter(s => s.status === 'former');
        if (formerStaff.length === 0) return null;
        return (
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✕ Former — {formerStaff.length} staff (admin only)
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.2)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, opacity: 0.6 }}>
              {formerStaff.map(s => {
                const pos = getPosition(s.positionId);
                return (
                  <div key={s.id} className="card" style={{ borderStyle: 'dashed', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => setSelectedStaff(s)}>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ background: 'var(--bg-elevated)', filter: 'grayscale(1)' }}>{getInitials(s.firstName, s.lastName)}</div>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold text-muted">{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-muted">{pos.name} · Former · Left {s.statusHistory[s.statusHistory.length - 1]?.date}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); changeStatus(s.id, 'active'); }}>↩ Reactivate</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {filtered.length === 0 && (
        <div className="empty-state"><div className="empty-state-icon">👥</div><p>No staff match your filters</p></div>
      )}

      {/* Hidden Staff — admin only */}
      {isAdmin && hiddenStaff.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowHiddenSection(!showHiddenSection)} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{showHiddenSection ? '▲' : '▼'}</span>
            🚫 Hidden Staff ({hiddenStaff.length})
          </button>
          {showHiddenSection && filteredHidden.map(s => (
            <div key={s.id} className="card mb-2" style={{ padding: '10px 16px', borderStyle: 'dashed', opacity: 0.6 }}>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-sm" style={{ filter: 'grayscale(1)' }}>{getInitials(s.firstName, s.lastName)}</div>
                <span className="text-sm text-muted">{s.firstName} {s.lastName} — Hidden</span>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleVisibility(s.id)}>↩</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStaff && isSrGuard && (
        <div className="modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar avatar-lg">{getInitials(selectedStaff.firstName, selectedStaff.lastName)}</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedStaff.firstName} {selectedStaff.lastName}</h3>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span className="badge" style={{ background: `${getPosition(selectedStaff.positionId).color}18`, color: getPosition(selectedStaff.positionId).color, border: `1px solid ${getPosition(selectedStaff.positionId).color}35` }}>
                    {getPosition(selectedStaff.positionId).name}
                  </span>
                  <span className="badge" style={{ background: STATUS_COLORS[selectedStaff.status].bg, color: STATUS_COLORS[selectedStaff.status].text }}>
                    {STATUS_COLORS[selectedStaff.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedStaff.phone && (
                <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span>📱</span>
                  <div><div className="text-xs text-muted">Phone</div><div className="font-medium">{selectedStaff.phone}</div></div>
                </div>
              )}
              {canSeeEmail && selectedStaff.email && (
                <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span>✉</span>
                  <div><div className="text-xs text-muted">Email</div><div className="font-medium">{selectedStaff.email}</div></div>
                </div>
              )}
              {canSeeAddress && selectedStaff.address && (
                <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span>📍</span>
                  <div><div className="text-xs text-muted">Address</div><div className="font-medium">{selectedStaff.address}</div></div>
                </div>
              )}

              {/* High School / Graduation Year — editable by sr_guard + admin */}
              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div className="text-xs text-muted mb-2">🎓 High School Status</div>
                {isSrGuard ? (
                  <div className="flex items-center gap-3">
                    <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={!!selectedStaff.isHighSchool} onChange={e => {
                        if (!e.target.checked) updateGradYear(selectedStaff.id, undefined);
                        else updateGradYear(selectedStaff.id, new Date().getFullYear() + 2);
                        setSelectedStaff({ ...selectedStaff, isHighSchool: e.target.checked, gradYear: e.target.checked ? (selectedStaff.gradYear || new Date().getFullYear() + 2) : undefined });
                      }} style={{ accentColor: 'var(--aqua-500)', width: 16, height: 16 }} />
                      Currently in high school
                    </label>
                    {selectedStaff.isHighSchool && (
                      <select className="form-select" style={{ width: 'auto', padding: '4px 28px 4px 8px', fontSize: '0.8rem' }}
                        value={selectedStaff.gradYear || ''}
                        onChange={e => { const yr = +e.target.value; updateGradYear(selectedStaff.id, yr); setSelectedStaff({ ...selectedStaff, gradYear: yr }); }}
                      >
                        {[2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>Class of {y}</option>)}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">{selectedStaff.isHighSchool ? `Class of ${selectedStaff.gradYear}` : 'Not in high school'}</div>
                )}
              </div>

              {/* Status History Timeline */}
              {selectedStaff.statusHistory.length > 1 && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div className="text-xs text-muted mb-2">📊 Status History</div>
                  {selectedStaff.statusHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[entry.status].text }} />
                      <span className="text-xs" style={{ color: STATUS_COLORS[entry.status].text }}>{entry.status}</span>
                      <span className="text-xs text-muted">— {entry.date} by {entry.changedBy}</span>
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div style={{ marginTop: 8 }}>
                  <div className="form-label mb-2">Change Position</div>
                  <select className="form-select" value={selectedStaff.positionId} onChange={e => { changePosition(selectedStaff.id, e.target.value); setSelectedStaff({ ...selectedStaff, positionId: e.target.value }); }}>
                    {DEFAULT_POSITIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedStaff(null)}>Close</button>
              {isAdmin && (
                <select className="form-select" style={{ width: 'auto', color: STATUS_COLORS[selectedStaff.status].text }}
                  value={selectedStaff.status}
                  onChange={e => { changeStatus(selectedStaff.id, e.target.value as EmployeeStatus); setSelectedStaff({ ...selectedStaff, status: e.target.value as EmployeeStatus }); }}
                >
                  <option value="active">Set Active</option>
                  <option value="inactive">Set Inactive</option>
                  <option value="former">Set Former</option>
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="section-title mb-2">Add Employee</h3>
            <p className="text-sm text-muted mb-6">After adding, send them a login invite from Admin Settings.</p>
            {createError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.875rem',
                color: 'var(--red-400)',
                marginBottom: 16,
              }}>
                <span>⚠️</span> {createError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-input"
                    placeholder="First"
                    value={newEmployee.firstName}
                    onChange={e => setNewEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-input"
                    placeholder="Last"
                    value={newEmployee.lastName}
                    onChange={e => setNewEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Position</label>
                <select
                  className="form-select"
                  value={newEmployee.positionId}
                  onChange={e => setNewEmployee(prev => ({ ...prev, positionId: e.target.value }))}
                >
                  {DEFAULT_POSITIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  placeholder="555-0000"
                  value={newEmployee.phone}
                  onChange={e => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="name@email.com"
                  value={newEmployee.email}
                  onChange={e => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  placeholder="123 Main St"
                  value={newEmployee.address}
                  onChange={e => setNewEmployee(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newEmployee.isHighSchool}
                  onChange={e => setNewEmployee(prev => ({ ...prev, isHighSchool: e.target.checked }))}
                  style={{ accentColor: 'var(--aqua-500)', width: 16, height: 16 }}
                />
                <span className="text-sm">High school student</span>
              </label>
              {newEmployee.isHighSchool && (
                <div className="form-group">
                  <label className="form-label">Graduation Year</label>
                  <select
                    className="form-select"
                    value={newEmployee.gradYear}
                    onChange={e => setNewEmployee(prev => ({ ...prev, gradYear: +e.target.value }))}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>Class of {y}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateEmployee} disabled={creatingEmployee}>
                {creatingEmployee ? 'Creating...' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createResult && (
        <div className="modal-overlay" onClick={() => setCreateResult(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="section-title mb-2">Employee Created</h3>
            <p className="text-sm text-muted mb-4">Share the temporary password or reset link with the new employee.</p>
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div className="text-xs text-muted">Email</div>
              <div className="font-semibold">{createResult.email}</div>
            </div>
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div className="text-xs text-muted">Temporary Password</div>
              <div className="font-semibold">{createResult.tempPassword}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="text-xs text-muted">Password Reset Link</div>
              <a href={createResult.resetLink} target="_blank" rel="noreferrer" style={{ color: 'var(--aqua-400)' }}>
                Open reset link
              </a>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setCreateResult(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .staff-card { transition: all 200ms; }
        .staff-card:hover { border-color: var(--border-dim); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
