'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

interface ShiftReport {
  id: string;
  date: string;
  staffName: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  completedTaskCount: number;
  totalTaskCount: number;
  completed: boolean;
  checklist: any[];
}

export default function ShiftReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStaff, setFilterStaff] = useState('all');
  const [staffList, setStaffList] = useState<string[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchReports() {
      try {
        const snap = await getDocs(collection(db, 'shift_checklists'));
        const allReports = snap.docs.map(doc => {
          const data = doc.data();
          const checklist = data.checklist || [];
          const completedTaskCount = checklist.filter((c: any) => c.completed).length;
          
          return {
            id: doc.id,
            date: data.date || '',
            staffName: data.staffName || 'Unknown',
            userId: data.userId || '',
            startTime: data.startTime || null,
            endTime: data.endTime || null,
            completed: data.completed || false,
            completedTaskCount,
            totalTaskCount: checklist.length,
            checklist,
          } as ShiftReport;
        });

        setReports(allReports);

        // Extract unique staff names
        const staff = [...new Set(allReports.map(r => r.staffName))];
        setStaffList(staff);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="font-semibold">Admin Only</p>
        </div>
      </div>
    );
  }

  const filtered = reports.filter(r => {
    const dateMatch = filterDate === 'all' || r.date === filterDate;
    const staffMatch = filterStaff === 'all' || r.staffName === filterStaff;
    return dateMatch && staffMatch;
  });

  const stats = {
    totalShifts: filtered.length,
    completedShifts: filtered.filter(r => r.completed).length,
    avgCompletion: filtered.length > 0
      ? Math.round(
          (filtered.reduce((sum, r) => sum + (r.totalTaskCount > 0 ? r.completedTaskCount / r.totalTaskCount : 0), 0) / filtered.length) * 100
        )
      : 0,
  };

  if (loading) return <div className="page-container flex justify-center"><div className="spinner" /></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Shift Reports & Analytics</h1>
          <p className="page-subtitle">Track staff performance and task completion</p>
        </div>
        <span className="badge badge-admin">⚙ Admin</span>
      </div>

      {/* Filters */}
      <div className="card mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Staff Member</label>
          <select
            className="form-select"
            value={filterStaff}
            onChange={e => setFilterStaff(e.target.value)}
          >
            <option value="all">All Staff</option>
            {staffList.map(staff => (
              <option key={staff} value={staff}>{staff}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div style={{ color: 'white' }}>
            <div className="text-sm opacity-90">Total Shifts</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 8 }}>{stats.totalShifts}</div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div style={{ color: 'white' }}>
            <div className="text-sm opacity-90">Completed Shifts</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 8 }}>{stats.completedShifts}</div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div style={{ color: 'white' }}>
            <div className="text-sm opacity-90">Avg Completion</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 8 }}>{stats.avgCompletion}%</div>
          </div>
        </div>
      </div>

      {/* Shift Reports Table */}
      <div className="card">
        <h3 className="section-title mb-4">📊 Shift Details</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff Member</th>
                <th>Duration</th>
                <th>Tasks Completed</th>
                <th>Completion %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No shifts found for the selected filters
                  </td>
                </tr>
              ) : (
                filtered.map(report => {
                  const completionPercent = report.totalTaskCount > 0
                    ? Math.round((report.completedTaskCount / report.totalTaskCount) * 100)
                    : 0;
                  const duration = report.endTime
                    ? `${Math.round((report.endTime.toDate().getTime() - report.startTime.toDate().getTime()) / 60000)} min`
                    : 'In Progress';

                  return (
                    <tr key={report.id}>
                      <td className="text-sm">{report.date}</td>
                      <td className="text-sm font-semibold">{report.staffName}</td>
                      <td className="text-sm">{duration}</td>
                      <td className="text-sm">
                        {report.completedTaskCount}/{report.totalTaskCount}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 40,
                              height: 6,
                              background: 'var(--bg-elevated)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${completionPercent}%`,
                                height: '100%',
                                background: completionPercent === 100 ? '#10b981' : '#f59e0b',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{completionPercent}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${report.completed ? 'badge-success' : 'badge-pending'}`}>
                          {report.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Performance */}
      {filterDate === 'all' && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 className="section-title mb-4">👥 Staff Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {staffList.map(staff => {
              const staffReports = reports.filter(r => r.staffName === staff);
              const avgCompletion = staffReports.length > 0
                ? Math.round(
                    (staffReports.reduce((sum, r) => sum + (r.totalTaskCount > 0 ? r.completedTaskCount / r.totalTaskCount : 0), 0) / staffReports.length) * 100
                  )
                : 0;

              return (
                <div key={staff} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div className="text-sm font-semibold">{staff}</div>
                    <div className="text-xs text-muted">{staffReports.length} shifts</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 150,
                        height: 8,
                        background: 'var(--bg-elevated)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${avgCompletion}%`,
                          height: '100%',
                          background: avgCompletion >= 90 ? '#10b981' : avgCompletion >= 70 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold" style={{ minWidth: 40 }}>{avgCompletion}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
