'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';

interface ShiftTask {
  id: string;
  title: string;
  category: 'chemical' | 'safety' | 'cleaning' | 'opening' | 'closing' | 'maintenance' | 'custom';
  priority: 'high' | 'medium' | 'low';
}

interface ChecklistItem {
  taskId: string;
  completed: boolean;
  completedAt?: Timestamp;
  completedBy?: string;
  notes?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  chemical: '🧪',
  safety: '🛡️',
  cleaning: '🧹',
  opening: '🔑',
  closing: '🔒',
  maintenance: '🔧',
  custom: '📋',
};

export default function ShiftChecklistPage() {
  const { user, firebaseUser } = useAuth();
  const [tasks, setTasks] = useState<ShiftTask[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftStarted, setShiftStarted] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<string>('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get all tasks
        const taskSnap = await getDocs(collection(db, 'shift_tasks'));
        const taskList = taskSnap.docs.map(d => ({ id: d.id, ...d.data() } as ShiftTask));
        setTasks(taskList);

        // Get today's shift
        if (firebaseUser) {
          const today = new Date().toISOString().split('T')[0];
          const shiftId = `shift_${firebaseUser.uid}_${today}`;
          const shiftDoc = await getDoc(doc(db, 'shift_checklists', shiftId));
          
          if (shiftDoc.exists()) {
            const data = shiftDoc.data();
            setActiveShiftId(shiftId);
            setChecklist(data.checklist || []);
            setShiftStarted(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [firebaseUser]);

  const handleStartShift = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const shiftId = `shift_${firebaseUser.uid}_${today}`;
      
      const newChecklist = tasks.map(task => ({
        taskId: task.id,
        completed: false,
      }));

      await setDoc(doc(db, 'shift_checklists', shiftId), {
        userId: firebaseUser.uid,
        staffName: user?.displayName || firebaseUser.email,
        date: today,
        startTime: Timestamp.now(),
        checklist: newChecklist,
      });

      setActiveShiftId(shiftId);
      setChecklist(newChecklist);
      setShiftStarted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to start shift');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = checklist.map(item =>
      item.taskId === taskId
        ? {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? Timestamp.now() : undefined,
            completedBy: !item.completed ? firebaseUser?.uid : undefined,
          }
        : item
    );
    setChecklist(updated);

    if (activeShiftId) {
      try {
        await setDoc(doc(db, 'shift_checklists', activeShiftId), {
          checklist: updated,
        }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddNote = async (taskId: string, note: string) => {
    setNotes(prev => ({ ...prev, [taskId]: note }));

    if (activeShiftId) {
      try {
        const updated = checklist.map(item =>
          item.taskId === taskId ? { ...item, notes: note } : item
        );
        await setDoc(doc(db, 'shift_checklists', activeShiftId), {
          checklist: updated,
        }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEndShift = async () => {
    if (!confirm('End your shift? This will save your checklist.')) return;
    if (!activeShiftId) return;

    try {
      await setDoc(
        doc(db, 'shift_checklists', activeShiftId),
        {
          endTime: Timestamp.now(),
          completed: true,
        },
        { merge: true }
      );
      setShiftStarted(false);
      alert('Shift ended and saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to end shift');
    }
  };

  if (loading) return <div className="page-container flex justify-center"><div className="spinner" /></div>;

  if (!shiftStarted) {
    return (
      <div className="page-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>👋</div>
          <h2 className="page-title">Welcome to Your Shift</h2>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>
            Click below to start your shift and begin the checklist
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleStartShift}
            disabled={saving}
          >
            {saving ? 'Starting...' : 'Start Shift'}
          </button>
        </div>
      </div>
    );
  }

  const completed = checklist.filter(c => c.completed).length;
  const total = checklist.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const tasksByCategory = tasks.reduce((acc, task) => {
    const cat = task.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, ShiftTask[]>);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Today's Shift Checklist</h1>
          <p className="page-subtitle">{user?.displayName || 'Staff Member'}</p>
        </div>
        <button
          className="btn btn-ghost"
          style={{ color: '#dc2626' }}
          onClick={handleEndShift}
        >
          End Shift
        </button>
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="text-sm font-semibold">Progress</div>
          <div className="text-sm font-semibold">{completed}/{total} tasks</div>
        </div>
        <div style={{
          width: '100%',
          height: 8,
          background: 'var(--bg-elevated)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Checklist by Category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
          const categoryCompleted = checklist.filter(
            c => c.completed && categoryTasks.some(t => t.id === c.taskId)
          ).length;

          return (
            <div key={category}>
              <div style={{ marginBottom: 12 }}>
                <h3 className="section-title">
                  {CATEGORY_ICONS[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="text-xs text-muted">
                  {categoryCompleted}/{categoryTasks.length} completed
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categoryTasks.map(task => {
                  const item = checklist.find(c => c.taskId === task.id);
                  const isCompleted = item?.completed || false;
                  const taskNote = notes[task.id] || item?.notes || '';

                  return (
                    <div key={task.id} className="card">
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggleTask(task.id)}
                          className="checkbox"
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            className="text-sm font-semibold"
                            style={{
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                              transition: 'all 0.2s',
                            }}
                          >
                            {task.title}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={taskNote}
                              onChange={e => handleAddNote(task.id, e.target.value)}
                              className="form-input"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {completed === total && total > 0 && (
        <div className="card" style={{ marginTop: 24, background: '#ecfdf5', borderColor: '#6ee7b7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#059669', fontWeight: 600 }}>
            ✅ All tasks completed! You can end your shift whenever ready.
          </div>
        </div>
      )}
    </div>
  );
}
