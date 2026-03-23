'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { StaffMember, AUDIT_TYPES, AuditType } from '@/lib/types';
import { format } from 'date-fns';

export default function NewVatPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [auditType, setAuditType] = useState<AuditType>('vat');
  const [notes, setNotes] = useState('');
  
  // Stopwatch state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); // in deciseconds (0.1s)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Blueprint click state
  const [markerPos, setMarkerPos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    async function loadStaff() {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember));
        // Only active/inactive lifeguards and sr_guards typically get VATs
        setStaff(list.filter(s => s.status !== 'former'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [timerRunning]);

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };
  
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeElapsed(0);
    setMarkerPos(null);
  };

  const handleBlueprintClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarkerPos({ x, y });
    
    // Auto-start timer if not running
    if (!timerRunning && timeElapsed === 0) {
      setTimerRunning(true);
    }
  };

  const currentTypeMeta = AUDIT_TYPES.find(t => t.key === auditType);

  const formatTime = (deciseconds: number) => {
    const totalSeconds = Math.floor(deciseconds / 10);
    const ms = deciseconds % 10;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleSubmit = async () => {
    if (!selectedStaffId) return alert('Please select an employee.');
    if (!user) return;
    
    const employee = staff.find(s => s.id === selectedStaffId);
    if (!employee) return;
    
    const recordId = `audit_${Date.now()}`;
    
    // Build the notes with time + blueprint marker
    let finalNotes = notes;
    if (timeElapsed > 0) {
      finalNotes = `Time taken: ${formatTime(timeElapsed)}\n${finalNotes}`;
    }
    if (markerPos) {
      finalNotes = `Location markers attached (X:${markerPos.x.toFixed(1)}%, Y:${markerPos.y.toFixed(1)}%)\n${finalNotes}`;
    }

    try {
      // 1. Create Audit Record
      await setDoc(doc(db, 'audits', recordId), {
        id: recordId,
        staffId: employee.id,
        staffName: `${employee.firstName} ${employee.lastName}`,
        auditType,
        completedBy: user.uid,
        completedByName: user.displayName || 'Admin',
        completedAt: new Date().toISOString(),
        season: 'Summer ' + new Date().getFullYear(),
        notes: finalNotes,
        orgId: employee.orgId || 'defaultOrg'
      });
      
      // 2. Add to Activity History
      const histId = `hist_${Date.now()}`;
      await setDoc(doc(db, 'history', histId), {
        id: histId,
        action: 'add_audit',
        performedBy: user.uid,
        performedByName: user.displayName || 'Admin',
        performedAt: new Date().toISOString(),
        description: `Conducted ${currentTypeMeta?.label} for ${employee.firstName} ${employee.lastName}`,
        targetId: recordId,
        targetName: `${employee.firstName} ${employee.lastName}`,
        orgId: employee.orgId || 'defaultOrg'
      });

      alert('Audit saved successfully!');
      router.push('/audits');

    } catch(err) {
      console.error(err);
      alert('Failed to save audit.');
    }
  };

  if (!hasRole('admin', 'sr_guard')) {
    return <div className="page-container">Access Restricted</div>;
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button className="btn btn-ghost btn-sm mb-2" onClick={() => router.push('/audits')}>← Back to Audits</button>
          <h1 className="page-title">Conduct New VAT/Audit</h1>
          <p className="page-subtitle">Record training tests with timing and drop-zone markers.</p>
        </div>
      </div>

      <div className="grid-2 grid">
        {/* LEFT COLUMN: Controls */}
        <div className="card">
          <h3 className="section-title mb-4">📝 Test Details</h3>
          
          <div className="form-group">
            <label className="form-label">Employee</label>
            <select 
              className="form-select" 
              value={selectedStaffId} 
              onChange={e => setSelectedStaffId(e.target.value)}
            >
              <option value="" disabled>Select Staff Member...</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.positionId.replace('_',' ')})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Test Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {AUDIT_TYPES.map(type => (
                <button
                  key={type.key}
                  className={`btn ${auditType === type.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                  onClick={() => setAuditType(type.key as AuditType)}
                >
                  <span style={{ fontSize: '1.2rem', marginRight: 8 }}>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <textarea 
              className="form-input" 
              rows={4} 
              placeholder="e.g. Guard responded immediately, clear communication, entered water efficiently..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-sm text-muted">Ready to submit?</span>
            <button 
              className="btn btn-primary" 
              style={{ padding: '10px 24px', fontSize: '1.1rem' }}
              onClick={handleSubmit}
            >
              Save Result
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Timer & Blueprint */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="section-title mb-4">⏱️ Tracker</h3>
          
          <div style={{ 
            background: 'var(--bg-elevated)', 
            padding: '20px', 
            borderRadius: 12, 
            textAlign: 'center',
            marginBottom: 20,
            border: timerRunning ? '1px solid var(--aqua-500)' : '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'monospace', color: timerRunning ? 'var(--aqua-400)' : 'var(--text-primary)' }}>
              {formatTime(timeElapsed)}
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button 
                className={`btn ${timerRunning ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: 120 }}
                onClick={toggleTimer}
              >
                {timerRunning ? 'Stop' : timeElapsed === 0 ? 'Start' : 'Resume'}
              </button>
              <button 
                className="btn btn-ghost"
                onClick={resetTimer}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="form-label mb-2">Facility Blueprint (Click to mark)</div>
          <div 
            className="pool-blueprint"
            onClick={handleBlueprintClick}
            style={{ 
              flex: 1, 
              minHeight: 240, 
              border: '2px dashed var(--border-subtle)', 
              borderRadius: 12,
              position: 'relative',
              cursor: 'crosshair',
              background: 'linear-gradient(to bottom right, #0e2a47 0%, #1e4572 100%)', // Placeholder blue pool background
              overflow: 'hidden'
            }}
          >
            {/* Fake SVG pool lines */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }}>
               <rect x="10%" y="10%" width="80%" height="80%" fill="none" stroke="white" strokeWidth="4" rx="15" />
               <line x1="10%" y1="30%" x2="90%" y2="30%" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
               <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
               <line x1="10%" y1="70%" x2="90%" y2="70%" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
               <text x="50%" y="8%" fill="white" textAnchor="middle" fontSize="12" fontWeight="bold">DEEP END</text>
               <text x="50%" y="96%" fill="white" textAnchor="middle" fontSize="12" fontWeight="bold">SHALLOW END</text>
            </svg>

            {!markerPos && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.6)', textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '2rem' }}>🎯</span>
                <p className="font-semibold text-sm">Click to mark victim location</p>
              </div>
            )}

            {markerPos && (
              <div style={{ 
                position: 'absolute', 
                left: `${markerPos.x}%`, 
                top: `${markerPos.y}%`, 
                transform: 'translate(-50%, -50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--red-500)',
                border: '3px solid white',
                boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.4)',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </div>
          <div className="text-xs text-muted mt-2 text-center">
             Clicking the map will automatically start the timer.
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
