'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileIcon, Download, Eye } from 'lucide-react';

type DocCategory = 'all' | 'staff_forms' | 'checklists' | 'senior_lg' | 'pool_tech' | 'training' | 'audits' | 'General' | string;

interface DocItem {
  id: string;
  name: string;
  description: string;
  folder: string;
  category: DocCategory;
  fileType: string;
  accessPositions: UserRole[];
  url: string;
  year?: number;
}

const CATEGORIES: { key: DocCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Documents', icon: '📚' },
  { key: 'staff_forms', label: 'Staff Forms', icon: '📝' },
  { key: 'checklists', label: 'Checklists', icon: '☑' },
  { key: 'senior_lg', label: 'Senior LG', icon: '🏅' },
  { key: 'pool_tech', label: 'Pool Tech', icon: '🔧' },
  { key: 'training', label: 'Training', icon: '🎓' },
  { key: 'audits', label: 'Audits', icon: '✓' },
];

const getFileType = (filename: string, url: string) => {
  if (url && (url.includes('docs.google.com') || url.includes('drive.google.com'))) return 'gsheet';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'doc';
};

const FILE_COLORS: Record<string, string> = { pdf: '#f87171', docx: '#4285f4', xlsx: '#22c55e', pptx: '#f97316', pd: '#f87171', doc: '#4285f4', gsheet: '#22c55e', mp4: '#a855f7' };

export default function DocumentsPage() {
  const { user, hasRole } = useAuth();
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocItem | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const snap = await getDocs(collection(db, 'documents'));
        const docsData: DocItem[] = snap.docs.map(d => {
          const data = d.data();
          const categoryRaw = data.category || 'General';
          
          // Determine access array based on the `accessLevel` string saved in DB
          const minAccess = data.accessLevel || 'lifeguard';
          let accessPos: UserRole[] = ['admin', 'sr_guard', 'pool_tech', 'lifeguard'];
          if (minAccess === 'sr_guard') accessPos = ['admin', 'sr_guard'];
          else if (minAccess === 'pool_tech') accessPos = ['admin', 'sr_guard', 'pool_tech'];
          
          return {
            id: d.id,
            name: data.title || d.id,
            description: categoryRaw,
            folder: categoryRaw,
            category: categoryRaw as DocCategory,
            fileType: getFileType(data.title, data.url),
            url: data.url || '#',
            accessPositions: accessPos,
            year: data.year || 0
          };
        });
        
        // Sort by year (asc), then name
        docsData.sort((a, b) => {
          if (a.year !== b.year) return (a.year || 0) - (b.year || 0);
          return a.name.localeCompare(b.name);
        });
        
        setDocuments(docsData);
      } catch (err) {
        console.error('Error fetching docs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const accessible = documents.filter(d => user && d.accessPositions.includes(user.role));

  const filtered = accessible.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory;
    const matchSearch = search === '' || d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const visibleCategories = CATEGORIES.filter(cat => {
    if (cat.key === 'all') return true;
    return accessible.some(d => d.category === cat.key);
  });

  if (loading) {
    return <div className="page-container flex justify-center items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Document Library</h1>
          <p className="page-subtitle">{accessible.length} files dynamically synced to server</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {visibleCategories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`btn btn-sm ${activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: 6 }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="search-wrapper mb-6" style={{ maxWidth: 360 }}>
        <input className="form-input search-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(doc => (
          <div key={doc.id} className="doc-card card">
            <div className="flex items-start gap-3">
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${FILE_COLORS[doc.fileType] || '#888'}15`,
                border: `1px solid ${FILE_COLORS[doc.fileType] || '#888'}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: FILE_COLORS[doc.fileType] || '#888'
              }}>
                <FileIcon size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm font-semibold" style={{ wordBreak: 'break-word' }}>
                  {doc.name}
                </div>
                <div className="text-xs text-muted mt-1">{doc.folder}</div>
                <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                  <span className="tag tag-blue" style={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>{doc.fileType}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3" style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={() => { setViewDoc(doc); setIsViewerOpen(true); }} 
                className="btn btn-secondary btn-sm" style={{ flex: 1 }}
              >
                <Eye size={14} /> View
              </button>
              
              {doc.fileType === 'gsheet' ? (
                <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  Open Google Sheet
                </a>
              ) : (
                <a href={doc.url} download className="btn btn-secondary btn-sm" style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  <Download size={14} /> Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="text-muted">No documents found</div>
        </div>
      )}

      {/* Embedded Document Viewer Modal */}
      {isViewerOpen && viewDoc && (
        <div className="modal-overlay" onClick={() => setIsViewerOpen(false)}>
          <div className="modal" style={{ maxWidth: '90vw', height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{viewDoc.name}</h2>
              <button onClick={() => setIsViewerOpen(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>
            
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
              {viewDoc.fileType === 'pdf' && (
                <iframe src={viewDoc.url} style={{ width: '100%', height: '100%', border: 'none' }} title={viewDoc.name} />
              )}
              {viewDoc.fileType === 'mp4' && (
                <video src={viewDoc.url} controls style={{ width: '100%', height: '100%', outline: 'none' }} />
              )}
              {viewDoc.fileType === 'gsheet' && (
                <iframe src={viewDoc.url} style={{ width: '100%', height: '100%', border: 'none' }} title={viewDoc.name} />
              )}
              {(viewDoc.fileType === 'docx' || viewDoc.fileType === 'xlsx' || viewDoc.fileType === 'pptx' || viewDoc.fileType === 'doc') && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                  <FileIcon size={48} color={FILE_COLORS[viewDoc.fileType]} className="mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Office Document Preview</h3>
                  <p className="text-slate-600 mb-6 max-w-md">
                    Microsoft Office files (.docx, .xlsx, .pptx) downloaded to your local environment cannot be previewed directly inside the local browser without a public URL. 
                  </p>
                  <a href={viewDoc.url} download className="btn btn-primary">
                    <Download size={16} /> Download to View / Edit
                  </a>
                  <p className="text-xs text-slate-500 mt-6 max-w-sm">
                    Admin Tip: To enable live collaborative viewing, upload your Roster/Doc to Google Workspace, then click "Convert to Web Link" on the document card to swap this file with its live Google Docs link.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .doc-card { transition: all 200ms; }
        .doc-card:hover { transform: translateY(-2px); box-shadow: var(--glow-aqua); }
      `}</style>
    </div>
  );
}
