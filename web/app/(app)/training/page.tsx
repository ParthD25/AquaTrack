'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileIcon, Play, CheckSquare, Eye } from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  desc: string;
  type: 'video' | 'pdf' | 'checklist' | 'docx' | 'xlsx' | 'doc';
  url: string;
  status: 'available' | 'filming';
}

const TYPE_ICON: Record<string, string> = { video: '🎬', pdf: '📄', checklist: '☑', mp4: '🎬', docx: '📝', xlsx: '📊', doc: '📝' };
const TYPE_COLOR: Record<string, string> = { video: 'var(--purple-400)', mp4: 'var(--purple-400)', pdf: 'var(--red-400)', checklist: 'var(--green-400)', docx: 'var(--aqua-400)', xlsx: 'var(--green-500)', doc: 'var(--aqua-400)' };

const getFileType = (filename: string) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'doc';
};

const toDrivePreviewUrl = (url: string) => {
  if (!url) return url;
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  return url;
};

const toViewerUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
    return toDrivePreviewUrl(url);
  }
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
};

export default function TrainingPage() {
  const { hasRole } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'pdf' | 'checklist'>('all');
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewModule, setViewModule] = useState<TrainingModule | null>(null);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const snap = await getDocs(collection(db, 'documents'));
        const trainingDocs: TrainingModule[] = [];
        
        snap.forEach(d => {
          const data = d.data();
          if (data.category === 'pool_tech' || data.category === 'training') {
            const ftype = getFileType(data.title);
            let unifiedType: 'video' | 'pdf' | 'checklist' | 'docx' | 'xlsx' | 'doc' = 'doc';
            
            if (ftype === 'mp4' || ftype === 'mov') unifiedType = 'video';
            else if (ftype === 'pdf') unifiedType = 'pdf';
            else if (ftype === 'docx') unifiedType = 'docx';
            else if (ftype === 'xlsx') unifiedType = 'xlsx';
            
            if (data.title.toLowerCase().includes('checklist')) unifiedType = 'checklist';

            trainingDocs.push({
              id: d.id,
              title: data.title,
              desc: `Category: ${data.category === 'pool_tech' ? 'Pool Technician' : 'General Training'}`,
              type: unifiedType,
              url: data.url,
              status: 'available'
            });
          }
        });

        // Add 2 placeholder "filming" videos for visual fidelity of the system
        trainingDocs.push({
          id: 'placeholder-1',
          title: 'Waterslide Operation & Inspection',
          desc: 'Safe operation, pre-open inspection, and post-close procedures.',
          type: 'video',
          url: '#',
          status: 'filming'
        });

        setModules(trainingDocs);
      } catch (err) {
        console.error('Failed to load training modules', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, []);

  if (!hasRole('admin', 'sr_guard', 'pool_tech', 'lifeguard')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted">Please log in to view training modules.</p>
        </div>
      </div>
    );
  }

  const filtered = modules.filter(m => activeFilter === 'all' || m.type === activeFilter || (activeFilter === 'video' && m.type === 'video') || (activeFilter === 'pdf' && m.type === 'pdf') || (activeFilter === 'checklist' && m.type === 'checklist'));

  if (loading) {
     return <div className="page-container flex justify-center items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Training Modules</h1>
          <p className="page-subtitle">
            Video guides, checklists, and references for daily operations
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span>📸</span>
        <p className="text-sm text-secondary">
          <strong style={{ color: 'var(--amber-400)' }}>Note:</strong> Video modules marked &quot;Filming&quot; need to be recorded before or after pool closure when the deck is clear. Coordinate with your SR guard schedule.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: '📚 All Modules' },
          { key: 'video', label: '🎬 Videos' },
          { key: 'pdf', label: '📄 Documents' },
          { key: 'checklist', label: '☑ Checklists' },
        ].map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${activeFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter(f.key as typeof activeFilter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(mod => (
          <div key={mod.id} className="card training-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {mod.status === 'filming' && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 6, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                color: 'var(--amber-400)', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                📸 Filming
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{TYPE_ICON[mod.type] || '📄'}</div>
              <div>
                <div className="font-semibold text-sm" style={{ paddingRight: mod.status === 'filming' ? 60 : 0 }}>{mod.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: TYPE_COLOR[mod.type] || 'var(--aqua-400)', fontWeight: 600, textTransform: 'uppercase' }}>
                     {mod.type} Module
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-secondary mb-4" style={{ lineHeight: 1.6, flex: 1 }}>{mod.desc}</p>

            <button
              onClick={() => {
                if (mod.status === 'filming') return;
                setViewModule(mod);
                setIsViewerOpen(true);
              }}
              className={`btn btn-sm ${mod.status === 'filming' ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
              disabled={mod.status === 'filming'}
            >
              {mod.status === 'filming' ? '⏳ Coming Soon' : mod.type === 'video' ? '▶ Watch Video' : mod.type === 'checklist' ? '☑ Open Checklist' : '📄 View Document'}
            </button>
          </div>
        ))}
      </div>

      {isViewerOpen && viewModule && (
        <div className="modal-overlay" onClick={() => setIsViewerOpen(false)}>
          <div className="modal" style={{ width: '90vw', maxWidth: 1100, height: '80vh', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{viewModule.title}</h2>
              <button onClick={() => setIsViewerOpen(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>
            <div style={{ flex: 1, background: '#0b1220', borderRadius: 8, overflow: 'hidden', minHeight: 0 }}>
              {viewModule.type === 'video' || viewModule.url.toLowerCase().endsWith('.mp4') ? (
                <video src={viewModule.url} controls style={{ width: '100%', height: '100%', background: '#000' }} />
              ) : (
                <iframe
                  src={toViewerUrl(viewModule.url)}
                  title={viewModule.title}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .training-card { transition: all 200ms; height: 100%; }
        .training-card:hover { transform: translateY(-2px); box-shadow: var(--glow-aqua); }
      `}</style>
    </div>
  );
}
