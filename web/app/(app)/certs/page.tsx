'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { format, differenceInDays, addMonths } from 'date-fns';

// Cert expiry tracker — complements DigiAquatics, tracks certs DigiAquatics doesn't surface well
type CertType = 'lifeguard' | 'cpr_aed' | 'o2' | 'waterpark' | 'title22' | 'swim_instructor';

interface StaffCert {
  id: string;
  name: string;
  role: string;
  certs: Record<CertType, { expiresAt: string | null; isHighSchool: boolean; gradYear?: number }>;
}

const CERT_META: Record<CertType, { label: string; icon: string; renewMonths: number }> = {
  lifeguard: { label: 'Lifeguard Cert', icon: '🏊', renewMonths: 24 },
  cpr_aed: { label: 'CPR/AED', icon: '💓', renewMonths: 24 },
  o2: { label: 'Emergency O2', icon: '🫁', renewMonths: 24 },
  waterpark: { label: 'Waterpark LG', icon: '🌊', renewMonths: 24 },
  title22: { label: 'Title 22', icon: '📜', renewMonths: 12 },
  swim_instructor: { label: 'WSI / Swim Instructor', icon: '🎓', renewMonths: 36 },
};

const THIS_YEAR = 2026;

const DEMO_CERTS: StaffCert[] = [
  { id: '1', name: 'Branden Uyeda', role: 'sr_guard', certs: { lifeguard: { expiresAt: '2027-06-01', isHighSchool: false }, cpr_aed: { expiresAt: '2027-06-01', isHighSchool: false }, o2: { expiresAt: '2027-06-01', isHighSchool: false }, waterpark: { expiresAt: '2027-06-01', isHighSchool: false }, title22: { expiresAt: '2026-09-15', isHighSchool: false }, swim_instructor: { expiresAt: '2028-01-01', isHighSchool: false } } },
  { id: '2', name: 'Hector Macias', role: 'pool_tech', certs: { lifeguard: { expiresAt: '2026-08-01', isHighSchool: false }, cpr_aed: { expiresAt: '2026-08-01', isHighSchool: false }, o2: { expiresAt: '2026-08-01', isHighSchool: false }, waterpark: { expiresAt: '2026-08-01', isHighSchool: false }, title22: { expiresAt: '2025-12-01', isHighSchool: false }, swim_instructor: { expiresAt: null, isHighSchool: false } } },
  { id: '3', name: 'Sophia Smith', role: 'sr_guard', certs: { lifeguard: { expiresAt: '2027-05-01', isHighSchool: false }, cpr_aed: { expiresAt: '2027-05-01', isHighSchool: false }, o2: { expiresAt: '2027-05-01', isHighSchool: false }, waterpark: { expiresAt: '2027-05-01', isHighSchool: false }, title22: { expiresAt: '2026-05-01', isHighSchool: false }, swim_instructor: { expiresAt: '2028-05-01', isHighSchool: false } } },
  { id: '4', name: 'Emma Knab', role: 'lifeguard', certs: { lifeguard: { expiresAt: '2026-04-15', isHighSchool: true, gradYear: 2026 }, cpr_aed: { expiresAt: '2026-04-15', isHighSchool: true, gradYear: 2026 }, o2: { expiresAt: '2026-04-15', isHighSchool: true, gradYear: 2026 }, waterpark: { expiresAt: '2026-04-15', isHighSchool: true, gradYear: 2026 }, title22: { expiresAt: null, isHighSchool: true, gradYear: 2026 }, swim_instructor: { expiresAt: null, isHighSchool: true, gradYear: 2026 } } },
  { id: '5', name: 'Noah Elam', role: 'lifeguard', certs: { lifeguard: { expiresAt: '2026-06-01', isHighSchool: true, gradYear: 2026 }, cpr_aed: { expiresAt: '2026-06-01', isHighSchool: true, gradYear: 2026 }, o2: { expiresAt: '2027-01-01', isHighSchool: true, gradYear: 2026 }, waterpark: { expiresAt: '2026-06-01', isHighSchool: true, gradYear: 2026 }, title22: { expiresAt: null, isHighSchool: true, gradYear: 2026 }, swim_instructor: { expiresAt: null, isHighSchool: true, gradYear: 2026 } } },
  { id: '6', name: 'Bryan Jung', role: 'lifeguard', certs: { lifeguard: { expiresAt: '2027-07-01', isHighSchool: false }, cpr_aed: { expiresAt: '2027-07-01', isHighSchool: false }, o2: { expiresAt: '2027-07-01', isHighSchool: false }, waterpark: { expiresAt: '2027-07-01', isHighSchool: false }, title22: { expiresAt: '2026-07-01', isHighSchool: false }, swim_instructor: { expiresAt: '2027-07-01', isHighSchool: false } } },
  { id: '7', name: 'Patrick Ama', role: 'lifeguard', certs: { lifeguard: { expiresAt: '2026-05-01', isHighSchool: true, gradYear: 2027 }, cpr_aed: { expiresAt: '2026-05-01', isHighSchool: true, gradYear: 2027 }, o2: { expiresAt: '2026-05-01', isHighSchool: true, gradYear: 2027 }, waterpark: { expiresAt: '2026-05-01', isHighSchool: true, gradYear: 2027 }, title22: { expiresAt: null, isHighSchool: true, gradYear: 2027 }, swim_instructor: { expiresAt: null, isHighSchool: true, gradYear: 2027 } } },
  { id: '8', name: 'Hafsa Zafar', role: 'lifeguard', certs: { lifeguard: { expiresAt: '2027-09-01', isHighSchool: true, gradYear: 2027 }, cpr_aed: { expiresAt: '2027-09-01', isHighSchool: true, gradYear: 2027 }, o2: { expiresAt: '2027-09-01', isHighSchool: true, gradYear: 2027 }, waterpark: { expiresAt: '2027-09-01', isHighSchool: true, gradYear: 2027 }, title22: { expiresAt: null, isHighSchool: true, gradYear: 2027 }, swim_instructor: { expiresAt: null, isHighSchool: true, gradYear: 2027 } } },
];

function getStatus(expiresAt: string | null) {
  if (!expiresAt) return 'missing';
  const days = differenceInDays(new Date(expiresAt), new Date());
  if (days < 0) return 'expired';
  if (days < 60) return 'soon';
  return 'ok';
}

const STATUS_COLORS = { ok: 'var(--green-400)', soon: 'var(--amber-400)', expired: 'var(--red-400)', missing: 'var(--slate-500)' };
const STATUS_LABELS = { ok: 'Valid', soon: 'Expiring Soon', expired: 'Expired', missing: 'Not on File' };

export default function CertsPage() {
  const { hasRole } = useAuth();
  const [view, setView] = useState<'certs' | 'retention'>('certs');
  const [search, setSearch] = useState('');

  const filtered = DEMO_CERTS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  // Retention analytics
  const hsStudents = DEMO_CERTS.filter(s => s.certs.lifeguard.isHighSchool);
  const gradByYear: Record<number, string[]> = {};
  hsStudents.forEach(s => {
    const yr = s.certs.lifeguard.gradYear || THIS_YEAR;
    if (!gradByYear[yr]) gradByYear[yr] = [];
    gradByYear[yr].push(s.name);
  });
  const totalStaff = DEMO_CERTS.length;
  const expiringSoon = DEMO_CERTS.filter(s =>
    Object.values(s.certs).some(c => getStatus(c.expiresAt) === 'soon' || getStatus(c.expiresAt) === 'expired')
  ).length;

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
          <p className="page-subtitle">Track cert expiry dates and staff turnover projections</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="tabs mb-6" style={{ maxWidth: 400 }}>
        <button className={`tab-item ${view === 'certs' ? 'active' : ''}`} onClick={() => setView('certs')}>📋 Cert Tracker</button>
        <button className={`tab-item ${view === 'retention' ? 'active' : ''}`} onClick={() => setView('retention')}>📊 Retention & Turnover</button>
      </div>

      {view === 'certs' && (
        <>
          {/* Summary stat cards */}
          <div className="grid-4 grid mb-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🚨</div>
              <div className="stat-value" style={{ color: 'var(--red-400)' }}>
                {DEMO_CERTS.reduce((acc, s) => acc + Object.values(s.certs).filter(c => getStatus(c.expiresAt) === 'expired').length, 0)}
              </div>
              <div className="stat-label">Expired Certs</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>⚠️</div>
              <div className="stat-value" style={{ color: 'var(--amber-400)' }}>
                {DEMO_CERTS.reduce((acc, s) => acc + Object.values(s.certs).filter(c => getStatus(c.expiresAt) === 'soon').length, 0)}
              </div>
              <div className="stat-label">Expiring in 60 Days</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.1)' }}>✅</div>
              <div className="stat-value" style={{ color: 'var(--green-400)' }}>
                {DEMO_CERTS.reduce((acc, s) => acc + Object.values(s.certs).filter(c => getStatus(c.expiresAt) === 'ok').length, 0)}
              </div>
              <div className="stat-label">Valid Certs</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(100,116,139,0.1)' }}>📭</div>
              <div className="stat-value" style={{ color: 'var(--slate-400)' }}>
                {DEMO_CERTS.reduce((acc, s) => acc + Object.values(s.certs).filter(c => !c.expiresAt).length, 0)}
              </div>
              <div className="stat-label">Missing on File</div>
            </div>
          </div>

          <div className="search-wrapper mb-4" style={{ maxWidth: 320 }}>
            <span className="search-icon" style={{ fontSize: '0.875rem' }}>🔍</span>
            <input className="form-input search-input" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Cert Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 180 }}>Staff Member</th>
                    {Object.entries(CERT_META).map(([key, meta]) => (
                      <th key={key} style={{ minWidth: 120, textAlign: 'center' }}>
                        {meta.icon} {meta.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(staff => (
                    <tr key={staff.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm">{staff.name.split(' ').map(n=>n[0]).join('')}</div>
                          <div>
                            <div className="text-sm font-semibold">{staff.name}</div>
                            <div className="text-xs text-muted capitalize">{staff.role.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      {(Object.keys(CERT_META) as CertType[]).map(certKey => {
                        const cert = staff.certs[certKey];
                        const status = getStatus(cert.expiresAt);
                        const days = cert.expiresAt ? differenceInDays(new Date(cert.expiresAt), new Date()) : null;
                        return (
                          <td key={certKey} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{
                                display: 'inline-block',
                                width: 10, height: 10, borderRadius: '50%',
                                background: STATUS_COLORS[status],
                                boxShadow: status === 'expired' ? `0 0 6px ${STATUS_COLORS[status]}` : 'none',
                              }} />
                              <span className="text-xs" style={{ color: STATUS_COLORS[status] }}>
                                {status === 'missing' ? '—' : cert.expiresAt ? format(new Date(cert.expiresAt), 'MMM yyyy') : '—'}
                              </span>
                              {days !== null && days < 60 && days >= 0 && (
                                <span className="text-xs text-muted">{days}d</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'retention' && (
        <div>
          <div className="grid-3 grid mb-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(0,212,255,0.1)' }}>👥</div>
              <div className="stat-value gradient-text">{totalStaff}</div>
              <div className="stat-label">Total Tracked Staff</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>🎓</div>
              <div className="stat-value" style={{ color: 'var(--amber-400)' }}>{hsStudents.length}</div>
              <div className="stat-label">High School Staff</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>📉</div>
              <div className="stat-value" style={{ color: 'var(--red-400)' }}>{gradByYear[THIS_YEAR]?.length || 0}</div>
              <div className="stat-label">Likely Leaving {THIS_YEAR}</div>
            </div>
          </div>

          <div className="grid-2 grid">
            {/* Graduation Projections */}
            <div className="card">
              <h3 className="section-title mb-4">🎓 Graduation Projections</h3>
              <p className="text-sm text-muted mb-4">
                High school staff who are estimated to graduate and possibly leave. Use this to plan hiring needs.
              </p>
              {Object.entries(gradByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, names]) => (
                <div key={year} style={{ marginBottom: 16 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold" style={{ color: Number(year) <= THIS_YEAR ? 'var(--amber-400)' : 'var(--text-primary)' }}>
                      Class of {year}
                      {Number(year) <= THIS_YEAR && <span className="badge badge-warning ml-2">This Year</span>}
                    </div>
                    <span className="text-muted text-sm">{names.length} staff</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {names.map(n => (
                      <span key={n} className="badge badge-neutral">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hiring Recommendation */}
            <div className="card">
              <h3 className="section-title mb-4">📋 Hiring Outlook</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(gradByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, names]) => (
                  <div key={year} style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: Number(year) <= THIS_YEAR ? 'rgba(251,191,36,0.06)' : 'var(--bg-elevated)',
                    border: `1px solid ${Number(year) <= THIS_YEAR ? 'rgba(251,191,36,0.2)' : 'var(--border-subtle)'}`,
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">After {year} Season</div>
                        <div className="text-xs text-muted mt-1">Estimated departures: {names.length}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-lg font-bold" style={{ color: 'var(--aqua-400)' }}>+{names.length}</div>
                        <div className="text-xs text-muted">to hire</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 8, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                  <p className="text-xs text-secondary">
                    💡 <strong>Tip:</strong> Mark staff as &quot;High School&quot; and enter their estimated graduation year when adding them to keep retention projections accurate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
