'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { format, differenceInDays, addMonths } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { StaffMember } from '@/lib/types';

type CertType = 'lifeguard' | 'cpr_aed' | 'o2' | 'waterpark' | 'title22' | 'swim_instructor';

const CERT_META: Record<CertType, { label: string; icon: string; renewMonths: number }> = {
  lifeguard: { label: 'Lifeguard Cert', icon: '🏊', renewMonths: 24 },
  cpr_aed: { label: 'CPR/AED', icon: '💓', renewMonths: 24 },
  o2: { label: 'Emergency O2', icon: '🫁', renewMonths: 24 },
  waterpark: { label: 'Waterpark LG', icon: '🌊', renewMonths: 24 },
  title22: { label: 'Title 22', icon: '📜', renewMonths: 12 },
  swim_instructor: { label: 'WSI / Swim Inst.', icon: '🎓', renewMonths: 36 },
};

const THIS_YEAR = new Date().getFullYear();

function getStatus(expiresAt: string | null | undefined) {
  if (!expiresAt) return 'missing';
  const days = differenceInDays(new Date(expiresAt), new Date());
  if (days < 0) return 'expired';
  if (days < 60) return 'soon';
  return 'ok';
}

const STATUS_COLORS = { ok: 'var(--green-400)', soon: 'var(--amber-400)', expired: 'var(--red-400)', missing: 'var(--slate-500)' };

export default function CertsPage() {
  const { hasRole } = useAuth();
  const [view, setView] = useState<'certs' | 'retention'>('certs');
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // For inline editing
  const [editingCell, setEditingCell] = useState<{ staffId: string, certKey: CertType } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember));
        setStaff(list.filter(s => s.active || s.status !== 'former'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = staff.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()));

  // Retention analytics
  const hsStudents = staff.filter(s => s.isHighSchool);
  const gradByYear: Record<number, string[]> = {};
  hsStudents.forEach(s => {
    const yr = s.gradYear || THIS_YEAR;
    if (!gradByYear[yr]) gradByYear[yr] = [];
    gradByYear[yr].push(`${s.firstName} ${s.lastName}`);
  });
  const totalStaff = staff.length;

  const handleUpdateCert = async (staffId: string, certKey: CertType, dateStr: string) => {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;
    
    const updatedCerts = { ...member.certExpirations, [certKey]: dateStr };
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, certExpirations: updatedCerts } : s));
    
    try {
      await updateDoc(doc(db, 'staff', staffId), {
        certExpirations: updatedCerts
      });
    } catch(err) {
      console.error('Update failed', err);
    }
    setEditingCell(null);
  };

  if (!hasRole('admin', 'sr_guard')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Certifications & Retention</h1>
          <p className="page-subtitle">Track cert expiry dates, edit inline, and monitor turnover projections</p>
        </div>
      </div>

      <div className="tabs mb-6" style={{ maxWidth: 400 }}>
        <button className={`tab-item ${view === 'certs' ? 'active' : ''}`} onClick={() => setView('certs')}>📋 Cert Tracker</button>
        <button className={`tab-item ${view === 'retention' ? 'active' : ''}`} onClick={() => setView('retention')}>📊 Retention & Turnover</button>
      </div>

      {view === 'certs' && (
        <>
          <div className="search-wrapper mb-4" style={{ maxWidth: 320 }}>
            <span className="search-icon" style={{ fontSize: '0.875rem' }}>🔍</span>
            <input className="form-input search-input" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          
          <div className="mb-3 text-xs text-muted">
            💡 Click on any date to edit it (Excel-style). Red means expired.
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 150 }}>Staff Member</th>
                    {(Object.keys(CERT_META) as CertType[]).map(key => (
                      <th key={key} style={{ minWidth: 100, textAlign: 'center' }}>
                         <span title={CERT_META[key].label}>{CERT_META[key].icon} {CERT_META[key].label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={7} style={{textAlign:'center', padding: '20px'}}>Loading staff...</td></tr>}
                  {!loading && filtered.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm overflow-hidden text-xs flex items-center justify-center">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{member.firstName} {member.lastName}</div>
                            <div className="text-xs text-muted capitalize">{member.positionId.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      {(Object.keys(CERT_META) as CertType[]).map(certKey => {
                        const dateStr = member.certExpirations?.[certKey];
                        const status = getStatus(dateStr);
                        const isEditing = editingCell?.staffId === member.id && editingCell?.certKey === certKey;

                        return (
                          <td 
                            key={certKey} 
                            style={{ textAlign: 'center', cursor: 'pointer', verticalAlign: 'middle', userSelect: 'none' }}
                            onClick={() => !isEditing && setEditingCell({ staffId: member.id, certKey })}
                          >
                            {isEditing ? (
                              <input 
                                type="date" 
                                className="form-input text-xs" 
                                style={{ padding: '2px 4px', minHeight: 'unset', width: '100%' }}
                                defaultValue={dateStr || ''}
                                autoFocus
                                onBlur={(e) => handleUpdateCert(member.id, certKey, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCert(member.id, certKey, e.currentTarget.value);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: STATUS_COLORS[status],
                                  boxShadow: status === 'expired' ? `0 0 6px ${STATUS_COLORS[status]}` : 'none',
                                }} />
                                <span className="text-xs" style={{ color: STATUS_COLORS[status], fontWeight: status === 'expired' ? 'bold' : 'normal' }}>
                                  {status === 'missing' ? '—' : dateStr ? format(new Date(dateStr), 'MMM yyyy') : '—'}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                     <tr><td colSpan={7} style={{textAlign:'center', padding: '20px'}}>No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'retention' && (
        <div className="grid-2 grid">
          <div className="card">
            <h3 className="section-title mb-4">🎓 Graduation Projections</h3>
            <p className="text-sm text-muted mb-4">High school staff estimated to graduate.</p>
            {Object.keys(gradByYear).length === 0 ? <p className="text-muted text-sm">No high school staff on file.</p> : null}
            {Object.entries(gradByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, names]) => (
              <div key={year} style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold" style={{ color: Number(year) <= THIS_YEAR ? 'var(--amber-400)' : 'var(--text-primary)' }}>
                    Class of {year}
                  </div>
                  <span className="text-muted text-sm">{names.length} staff</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {names.map(n => <span key={n} className="badge badge-neutral">{n}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
