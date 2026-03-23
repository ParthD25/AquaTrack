'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface ShiftTask {
  id: string;
  title: string;
  category: 'chemical' | 'safety' | 'cleaning' | 'opening' | 'closing' | 'maintenance' | 'custom';
  priority: 'high' | 'medium' | 'low';
}

const CATEGORIES = ['chemical', 'safety', 'cleaning', 'opening', 'closing', 'maintenance', 'custom'];
const PRIORITIES = ['high', 'medium', 'low'];
const CATEGORY_ICONS: Record<string, string> = {
  chemical: '🧪',
  safety: '🛡️',
  cleaning: '🧹',
  opening: '🔑',
  closing: '🔒',
  maintenance: '🔧',
  custom: '📋',
};

export default function ShiftTasksPage() {
  const { user, firebaseUser } = useAuth();
  const [tasks, setTasks] = useState<ShiftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ShiftTask['category']>('custom');
  const [newPriority, setNewPriority] = useState<ShiftTask['priority']>('medium');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchTasks() {
      try {
        const snap = await getDocs(collection(db, 'shift_tasks'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShiftTask));
        setTasks(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTitle.trim() || !firebaseUser) return;
    setSaving(true);
    try {
      const taskId = `task_${Date.now()}`;
      const task: ShiftTask = {
        id: taskId,
        title: newTitle,
        category: newCategory,
        priority: newPriority,
      };
      
      await setDoc(doc(db, 'shift_tasks', taskId), task);
      setTasks(prev => [...prev, task]);
      setNewTitle('');
      setNewCategory('custom');
      setNewPriority('medium');
    } catch (err) {
      console.error(err);
      alert('Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'shift_tasks', id));
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete task');
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="font-semibold">Admin Only</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-container flex justify-center"><div className="spinner" /></div>;

  const tasksByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = tasks.filter(t => t.category === cat);
    return acc;
  }, {} as Record<string, ShiftTask[]>);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Shift Checklist Management</h1>
          <p className="page-subtitle">Customize daily shift tasks for all staff</p>
        </div>
        <span className="badge badge-admin">⚙ Admin</span>
      </div>

      <div className="grid-2 grid gap-6">
        {/* Add Task Form */}
        <div className="card">
          <h3 className="section-title mb-4">➕ Add New Task</h3>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              className="form-input"
              placeholder="e.g., Check chemical pH"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value as ShiftTask['category'])}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={newPriority} onChange={e => setNewPriority(e.target.value as ShiftTask['priority'])}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleAddTask}
            disabled={!newTitle.trim() || saving}
          >
            {saving ? 'Adding...' : 'Add Task'}
          </button>
        </div>

        {/* Task List */}
        <div>
          <h3 className="section-title mb-4">📋 Current Tasks ({tasks.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(tasksByCategory).map(([cat, catTasks]) => {
              if (catTasks.length === 0) return null;
              return (
                <div key={cat}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {catTasks.map(task => {
                      const priorityColor = {
                        high: '#f87171',
                        medium: '#fbbf24',
                        low: '#4ade80',
                      }[task.priority];
                      return (
                        <div
                          key={task.id}
                          className="card"
                          style={{
                            padding: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-elevated)',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div className="text-sm font-semibold">{task.title}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: priorityColor,
                                }}
                              />
                              <span className="text-xs text-muted">{task.priority}</span>
                            </div>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            🗑
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
