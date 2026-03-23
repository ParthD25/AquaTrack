'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ChangeHistoryEntry } from '@/lib/types';
import { format } from 'date-fns';

const ACTION_ICONS: Record<string, string> = {
  add_audit: '✓',
  edit_audit: '✏️',
  add_staff: '👤',
  remove_staff: '🚫',
  toggle_visibility: '👁',
  change_role: '⭐',
  upload_doc: '📁',
  toggle_doc_access: '🔒',
  default: '📝'
};

const ACTION_COLORS: Record<string, string> = {
  add_audit: 'var(--green-400)',
  edit_audit: 'var(--amber-400)',
  add_staff: 'var(--blue-400)',
  remove_staff: 'var(--red-400)',
  toggle_visibility: 'var(--slate-400)',
  change_role: 'var(--purple-400)',
  upload_doc: 'var(--cyan-400)',
  toggle_doc_access: 'var(--orange-400)',
  default: 'var(--text-primary)'
};

export default function AdminHistoryPage() {
  const { hasRole } = useAuth();
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const q = query(collection(db, 'history'), orderBy('performedAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangeHistoryEntry)));
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (!hasRole('admin')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted mt-2">Only Administrators can view system activity history.</p>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.targetName && item.targetName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Activity History</h1>
          <p className="page-subtitle">Track admin actions, record updates, and system changes over time.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => window.print()}
          title="Print this log"
        >
          🖨️ Print Log
        </button>
      </div>

      <div className="search-wrapper mb-6" style={{ maxWidth: 400 }}>
        <span className="search-icon">🔍</span>
        <input 
          className="form-input search-input" 
          placeholder="Search by name, action, or description..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="card print-friendly" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history logs...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No matching history records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Date & Time</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Target</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(entry => {
                  const icon = ACTION_ICONS[entry.action] || ACTION_ICONS.default;
                  const color = ACTION_COLORS[entry.action] || ACTION_COLORS.default;
                  const date = new Date(entry.performedAt);
                  const isValidDate = !isNaN(date.getTime());

                  return (
                    <tr key={entry.id}>
                      <td className="text-sm text-muted whitespace-nowrap">
                        {isValidDate ? format(date, 'MMM d, yyyy h:mm a') : entry.performedAt}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span style={{ 
                            background: `${color}15`, 
                            color: color, 
                            padding: '4px', 
                            borderRadius: '6px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px'
                          }}>{icon}</span>
                          <span className="text-sm capitalize font-medium" style={{ color: color }}>
                            {entry.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm font-medium">{entry.performedByName}</td>
                      <td className="text-sm">{entry.targetName || '—'}</td>
                      <td className="text-sm text-muted">{entry.description}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-friendly, .print-friendly * {
            visibility: visible;
          }
          .print-friendly {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-title, .page-subtitle {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
