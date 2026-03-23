'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_SHIFTS, AUDIT_TYPES } from '@/lib/types';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_TASKS = [
  { id: '1', title: 'Chemical Check - Main Pool', category: 'chemical', done: false, priority: 'high' },
  { id: '2', title: 'AED Equipment Inspection', category: 'safety', done: false, priority: 'high' },
  { id: '3', title: 'Oxygen Unit Check', category: 'safety', done: true, priority: 'high' },
  { id: '4', title: 'Deck Walk & Zone Check', category: 'opening', done: false, priority: 'medium' },
  { id: '5', title: 'Lap Lane Rope Setup', category: 'opening', done: true, priority: 'medium' },
  { id: '6', title: 'Locker Room Inspection', category: 'cleaning', done: false, priority: 'low' },
  { id: '7', title: 'Chemical Log Entry', category: 'chemical', done: false, priority: 'medium' },
];

const DEMO_AUDITS_NEEDED = [
  { name: 'Patrick Ama', missing: ['VAT', 'Brick Test'] },
  { name: 'Emma Knab', missing: ['CPR', 'Live Recognition'] },
  { name: 'Bryan Jung', missing: ['Swim Instructor'] },
  { name: 'Hafsa Zafar', missing: ['VAT', 'CPR', 'Brick Test'] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  sr_guard: 'Senior Guard',
  pool_tech: 'Pool Technician',
  lifeguard: 'Lifeguard',
};

function getCurrentShift() {
  const now = new Date();
  const day = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  for (const shift of DEFAULT_SHIFTS) {
    if (shift.days.includes(day) && timeStr >= shift.startTime && timeStr <= shift.endTime) {
      return shift;
    }
  }
  return null;
}

function getNextShift() {
  const now = new Date();
  const day = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  for (const shift of DEFAULT_SHIFTS) {
    if (shift.days.includes(day) && timeStr < shift.startTime) {
      return shift;
    }
  }
  return DEFAULT_SHIFTS[0];
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [completions, setCompletions] = useState<Record<string, any>>({});
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [totalStaff, setTotalStaff] = useState(38);
  const [auditsNeeded, setAuditsNeeded] = useState<{name: string, missing: string[]}[]>(DEMO_AUDITS_NEEDED);
  const [showAuditsNeeded, setShowAuditsNeeded] = useState(false);

  useEffect(() => {
    // 1. Fetch Staff Stats
    async function fetchStats() {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        setTotalStaff(snap.docs.length);
        const needed: {name: string, missing: string[]}[] = [];
        snap.docs.forEach(d => {
          const s = d.data();
          if (s.status === 'former' || s.status === 'inactive') return;
          const missing: string[] = [];
          AUDIT_TYPES.forEach(t => {
            if (!s.audits || !s.audits[t.key]?.completed) {
              missing.push(t.label || t.key);
            }
          });
          if (missing.length > 0) {
            needed.push({ name: `${s.firstName} ${s.lastName}`, missing });
          }
        });
        setAuditsNeeded(needed.sort((a,b) => b.missing.length - a.missing.length));
      } catch (e) { console.error('Dashboard fetch error', e); }
    }
    fetchStats();

    // 2. Real-Time Task Listener
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const qTask = query(collection(db, 'task_completions'), where('dateStr', '==', todayStr));
    const unsubTasks = onSnapshot(qTask, (snap) => {
      const comps: Record<string, any> = {};
      snap.forEach(d => {
        comps[d.data().taskId] = d.data();
      });
      setCompletions(comps);
    });

    return () => unsubTasks();
  }, []);

  const now = new Date();
  const currentShift = getCurrentShift();
  const nextShift = getNextShift();
  
  const augmentedTasks = tasks.map(t => ({
    ...t,
    done: !!completions[t.id],
    completedBy: completions[t.id]?.completedBy,
    timestamp: completions[t.id]?.timestamp
  }));
  
  const completedTasks = augmentedTasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;

  const toggleTask = async (id: string, currentlyDone: boolean) => {
    if (!user) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const docId = `${id}_${todayStr}`;
    if (currentlyDone) {
      // Uncheck
      await deleteDoc(doc(db, 'task_completions', docId));
    } else {
      // Check
      await setDoc(doc(db, 'task_completions', docId), {
        taskId: id,
        dateStr: todayStr,
        timestamp: new Date().toISOString(),
        completedBy: user.displayName,
        userId: user.uid,
      });
    }
  };

  const PRIORITY_COLOR: Record<string, string> = { high: 'var(--red-400)', medium: 'var(--amber-400)', low: 'var(--teal-400)' };
  const CATEGORY_ICON: Record<string, string> = { chemical: '🧪', safety: '🛡️', cleaning: '🧹', opening: '🔑', closing: '🔒', maintenance: '🔧', custom: '📋' };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">
            Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="gradient-text">{user?.displayName.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">
            {format(now, 'EEEE, MMMM d, yyyy')} · {ROLE_LABELS[user?.role || 'lifeguard']}
          </p>
        </div>
        <div className="shift-badge">
          {currentShift ? (
            <>
              <span className="status-dot green" />
              <div>
                <div className="text-xs font-semibold text-success">Active Shift</div>
                <div className="text-sm font-bold">{currentShift.name}</div>
                <div className="text-xs text-muted">{currentShift.startTime} – {currentShift.endTime}</div>
              </div>
            </>
          ) : (
            <>
              <span className="status-dot amber" />
              <div>
                <div className="text-xs font-semibold text-warning">Next Shift</div>
                <div className="text-sm font-bold">{nextShift?.name}</div>
                <div className="text-xs text-muted">{nextShift?.startTime} – {nextShift?.endTime}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4 grid mb-6">
        <button className="stat-card" onClick={() => document.getElementById('shift-checklist')?.scrollIntoView({ behavior: 'smooth' })} style={{ textAlign: 'left', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(0,212,255,0.1)' }}>
            <span style={{ fontSize: '1.25rem' }}>☑</span>
          </div>
          <div className="stat-value gradient-text">{completedTasks}/{totalTasks}</div>
          <div className="stat-label">Tasks Today</div>
        </button>
        <button className="stat-card" onClick={() => router.push('/audits')} style={{ textAlign: 'left', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.1)' }}>
            <span style={{ fontSize: '1.25rem' }}>✓</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--green-400)' }}>
            {AUDIT_TYPES.length}
          </div>
          <div className="stat-label">Audit Types Active</div>
        </button>
        <button className="stat-card" onClick={() => setShowAuditsNeeded(true)} style={{ textAlign: 'left', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--amber-400)' }}>{auditsNeeded.length}</div>
          <div className="stat-label">Staff Need Audits</div>
        </button>
        <button className="stat-card" onClick={() => router.push('/staff')} style={{ textAlign: 'left', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.1)' }}>
            <span style={{ fontSize: '1.25rem' }}>👥</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--purple-400)' }}>{totalStaff}</div>
          <div className="stat-label">Total Staff</div>
        </button>
      </div>

      {/* Main 2-col layout */}
      <div className="dash-two-col">
        {/* Task List */}
        <div>
          <div className="flex items-center justify-between mb-4" id="shift-checklist">
            <h2 className="section-title">⚡ Shift Checklist</h2>
            <div className="flex gap-2">
              <div className="progress-bar" style={{ width: 100, alignSelf: 'center' }}>
                <div className="progress-fill" style={{ width: `${(completedTasks / totalTasks) * 100}%` }} />
              </div>
              <span className="text-sm text-muted">{Math.round((completedTasks / totalTasks) * 100)}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {augmentedTasks.map((task) => (
              <div
                key={task.id}
                className={`checklist-item ${task.done ? 'done' : ''}`}
                onClick={() => toggleTask(task.id, task.done)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleTask(task.id, task.done)}
              >
                <div className={`checkbox ${task.done ? 'checked' : ''}`}>
                  {task.done && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '1.1rem' }}>{CATEGORY_ICON[task.category]}</span>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-medium" style={{ textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }}>
                    {task.title}
                  </div>
                  {task.done && (
                    <div className="text-xs text-muted mt-1" style={{ opacity: 0.8 }}>
                      Completed by <strong style={{ color: 'var(--text-accent)' }}>{task.completedBy}</strong> at {format(new Date(task.timestamp), 'h:mm a')}
                    </div>
                  )}
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {hasRole('admin', 'sr_guard') && (
            <button className="btn btn-secondary btn-sm mt-4" style={{ width: '100%' }}>
              + Add Task for This Shift
            </button>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live Activity Feed - Admin & Sr. Guard */}
          {hasRole('admin', 'sr_guard') && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title flex items-center gap-2">
                  <div className="status-dot green animate-pulse"></div> Live Task Feed
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                {Object.values(completions).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(c => {
                   const taskDef = tasks.find(t => t.id === c.taskId);
                   return (
                     <div key={c.taskId} style={{ fontSize: '0.875rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                       <span style={{ color: 'var(--text-accent)', fontWeight: 'bold' }}>{c.completedBy}</span> completed <strong>{taskDef?.title || 'a task'}</strong>
                       <div className="text-xs text-muted mt-1">{format(new Date(c.timestamp), 'h:mm a')}</div>
                     </div>
                   );
                })}
                {Object.keys(completions).length === 0 && <div className="text-sm text-muted">No shift task activity yet today.</div>}
              </div>
            </div>
          )}

          {/* Audit Alerts - only for admin/sr_guard */}
          {hasRole('admin', 'sr_guard') && auditsNeeded.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">⚠️ Audits Needed</h2>
                <span className="badge badge-warning">{auditsNeeded.length} staff</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {auditsNeeded.slice(0, 5).map((s) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm">{s.name.split(' ').map(n => n[0]).join('')}</div>
                    <div style={{ flex: 1 }}>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                        {s.missing.map((m) => (
                          <span key={m} className="badge badge-warning" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/audits" className="btn btn-secondary btn-sm mt-4" style={{ display: 'flex', justifyContent: 'center' }}>
                Open Audit Tracker →
              </a>
            </div>
          )}

          {/* Upcoming Shifts */}
          <div className="card">
            <h2 className="section-title mb-4">🕐 Today&apos;s Shifts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEFAULT_SHIFTS.filter(s => {
                const day = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
                return s.days.includes(day);
              }).map(shift => {
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                const isActive = timeStr >= shift.startTime && timeStr <= shift.endTime;
                const isPast = timeStr > shift.endTime;
                return (
                  <div key={shift.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isActive ? 'rgba(0,212,255,0.07)' : 'transparent',
                    border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid var(--border-subtle)',
                    opacity: isPast ? 0.5 : 1,
                  }}>
                    <span className="status-dot" style={{
                      background: isActive ? 'var(--green-400)' : isPast ? 'var(--slate-600)' : 'var(--amber-400)',
                      boxShadow: isActive ? '0 0 6px var(--green-400)' : 'none',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div className="text-sm font-medium">{shift.name}</div>
                      <div className="text-xs text-muted">{shift.startTime} – {shift.endTime}</div>
                    </div>
                    {isActive && <span className="tag tag-green">LIVE</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .shift-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          border-radius: 12px;
        }
        .dash-two-col {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
        }
        @media (max-width: 1100px) {
          .dash-two-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .shift-badge { display: none; }
        }
      `}</style>

      {showAuditsNeeded && (
        <div className="modal-overlay" onClick={() => setShowAuditsNeeded(false)}>
          <div className="modal" style={{ maxWidth: 700, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Staff Missing Audits</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAuditsNeeded(false)}>Close</button>
            </div>
            {auditsNeeded.length === 0 ? (
              <div className="empty-state">
                <div className="text-muted">All staff are current on audits.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                {auditsNeeded.map((item) => (
                  <div key={item.name} className="card" style={{ padding: 14 }}>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-muted mt-1">
                      Missing: {item.missing.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
