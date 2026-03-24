'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole, DocumentLibraryItem } from '@/lib/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileIcon, Download, Eye } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type DocCategory = 'all' | 'checklist' | 'incident' | 'hr_form' | 'training' | 'maintenance' | 'operational' | 'archive' | string;

interface DocItem {
  id: string;
  name: string;
  description?: string;
  category: DocCategory;
  type: string;
  fileUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  accessRoles: UserRole[];
}

const CATEGORIES: { key: DocCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Documents', icon: '📚' },
  { key: 'checklist', label: 'Checklists', icon: '☑' },
  { key: 'incident', label: 'Incident Reports', icon: '⚠' },
  { key: 'hr_form', label: 'HR Forms', icon: '📝' },
  { key: 'training', label: 'Training', icon: '🎓' },
  { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { key: 'operational', label: 'Operational', icon: '⚙' },
  { key: 'archive', label: 'Archive', icon: '📦' },
];

const CATEGORY_LABELS = new Map(CATEGORIES.map(c => [c.key, `${c.icon} ${c.label}`]));

const FILE_COLORS: Record<string, string> = { 
  pdf: '#f87171', docx: '#4285f4', doc: '#4285f4', xlsx: '#22c55e', xls: '#22c55e', 
  image: '#06b6d4', link: '#94a3b8', video: '#a855f7', 
  gsheet: '#22c55e', mp4: '#a855f7', mov: '#a855f7', 
  gform: '#c084fc', gfolder: '#94a3b8', gfile: '#4285f4', gslides: '#f59e0b', gdoc: '#4285f4'
};

const getFileTypeLabel = (fileType: string): string => {
  const typeLabels: Record<string, string> = {
    pdf: 'PDF',
    docx: 'DOCX',
    doc: 'DOC',
    xlsx: 'XLSX',
    xls: 'XLS',
    image: 'Image',
    link: 'Link',
    video: 'Video',
  };
  return typeLabels[fileType?.toLowerCase()] || fileType?.toUpperCase() || 'FILE';
};

const toDrivePreviewUrl = (url: string) => {
  if (!url) return url;
  // If it's already a Drive link, convert to preview
  if (url.includes('drive.google.com')) {
    const fileMatch = url.match(/\/d\/([^/]+)/);
    if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  return url;
};

const toViewerUrl = (url: string) => {
  if (!url) return url;
  // For Drive links, use preview
  if (url.includes('drive.google.com')) {
    return toDrivePreviewUrl(url);
  }
  // For other files, use Google Docs viewer
  if (url.endsWith('.pdf') || url.endsWith('.docx') || url.endsWith('.xlsx')) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function DocumentsPage() {
  const { user, hasRole } = useAuth();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocItem | null>(null);

  useEffect(() => {
    if (isViewerOpen) {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [isViewerOpen, viewDoc]);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveCategory(categoryParam as DocCategory);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        // Fetch from new documents collection (if available, fall back to documents_library)
        let snap;
        try {
          snap = await getDocs(collection(db, 'documents'));
        } catch {
          // Fallback to old collection during transition
          snap = await getDocs(collection(db, 'documents_library'));
        }

        const docsData: DocItem[] = snap.docs
          .map(d => {
            const data = d.data() as any;
            
            return {
              id: d.id,
              name: data.title,
              description: data.description,
              category: data.category,
              type: data.type,
              fileUrl: data.fileUrl,
              uploadedAt: typeof data.uploadedAt === 'string' 
                ? data.uploadedAt 
                : data.uploadedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              uploadedBy: data.uploadedBy,
              tags: data.tags || [],
              accessRoles: data.accessRoles as UserRole[],
            };
          })
          // Only show active documents
          .filter(d => true) // All are active by default from migration
          // Sort by uploadedAt (newest first), then name
          .sort((a, b) => {
            const aTime = new Date(a.uploadedAt).getTime();
            const bTime = new Date(b.uploadedAt).getTime();
            if (aTime !== bTime) return bTime - aTime;
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

  const accessible = documents.filter(d => user && d.accessRoles.includes(user.role));

  const filtered = accessible.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory;
    const matchSearch = search === '' || d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const visibleCategories = CATEGORIES.filter(cat => {
    if (cat.key === 'all') return true;
    return accessible.some(d => d.category === cat.key);
  });

  const groupedCategories = visibleCategories
    .filter(c => c.key !== 'all')
    .map(c => c.key)
    .filter(key => accessible.some(d => d.category === key));

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

      {activeCategory === 'all' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groupedCategories.map(categoryKey => {
            const categoryLabel = CATEGORY_LABELS.get(categoryKey) || `📁 ${categoryKey}`;
            const sectionDocs = filtered.filter(d => d.category === categoryKey);
            if (sectionDocs.length === 0) return null;
            return (
              <div key={categoryKey} className="card" style={{ padding: 16 }}>
                <div className="text-sm font-semibold mb-3">{categoryLabel}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                  {sectionDocs.map(doc => (
                    <div key={doc.id} className="doc-card card" style={{ margin: 0 }}>
                      <div className="flex items-start gap-3">
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                          background: `${FILE_COLORS[doc.type] || '#888'}15`,
                          border: `1px solid ${FILE_COLORS[doc.type] || '#888'}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: FILE_COLORS[doc.type] || '#888'
                        }}>
                          <FileIcon size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="text-sm font-semibold" style={{ wordBreak: 'break-word' }}>
                            {doc.name}
                          </div>
                          {doc.description && <div className="text-xs text-muted mt-1">{doc.description}</div>}
                          <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                            <span className="tag tag-blue" style={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>{getFileTypeLabel(doc.type)}</span>
                            {doc.tags && doc.tags.length > 0 && doc.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="tag" style={{ fontSize: '0.6rem' }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {doc.fileUrl && (
                        <div className="flex gap-2 mt-3" style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                          <button 
                            onClick={() => { setViewDoc(doc); setIsViewerOpen(true); }} 
                            className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                          >
                            <Eye size={14} /> View
                          </button>
                          
                          <a href={doc.fileUrl} download className="btn btn-secondary btn-sm" style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                            <Download size={14} /> Download
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(doc => (
            <div key={doc.id} className="doc-card card">
              <div className="flex items-start gap-3">
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: `${FILE_COLORS[doc.type] || '#888'}15`,
                  border: `1px solid ${FILE_COLORS[doc.type] || '#888'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: FILE_COLORS[doc.type] || '#888'
                }}>
                  <FileIcon size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-semibold" style={{ wordBreak: 'break-word' }}>
                    {doc.name}
                  </div>
                  {doc.description && <div className="text-xs text-muted mt-1">{doc.description}</div>}
                  <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                    <span className="tag tag-blue" style={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>{getFileTypeLabel(doc.type)}</span>
                    {doc.tags && doc.tags.length > 0 && doc.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="tag" style={{ fontSize: '0.6rem' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {doc.fileUrl && (
                <div className="flex gap-2 mt-3" style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <button 
                    onClick={() => { setViewDoc(doc); setIsViewerOpen(true); }} 
                    className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                  >
                    <Eye size={14} /> View
                  </button>
                  
                  <a href={doc.fileUrl} download className="btn btn-secondary btn-sm" style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                    <Download size={14} /> Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="text-muted">No documents found</div>
        </div>
      )}

      {/* Embedded Document Viewer Modal */}
      {isViewerOpen && viewDoc && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 24 }} onClick={() => setIsViewerOpen(false)}>
          <div className="modal" style={{ width: '90vw', maxWidth: 1200, height: '85vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 24, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{viewDoc.name}</h2>
              <button onClick={() => setIsViewerOpen(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>
            
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
              {['pdf', 'docx', 'xlsx', 'doc'].includes(viewDoc.type) && viewDoc.fileUrl && (
                <iframe src={toViewerUrl(viewDoc.fileUrl)} style={{ width: '100%', height: '100%', border: 'none' }} title={viewDoc.name} />
              )}
              {viewDoc.type === 'link' && viewDoc.fileUrl && (
                <iframe src={viewDoc.fileUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={viewDoc.name} />
              )}
              {viewDoc.type === 'video' && viewDoc.fileUrl && (
                <video src={viewDoc.fileUrl} controls style={{ width: '100%', height: '100%', outline: 'none', background: '#000' }} />
              )}
              {viewDoc.type === 'image' && viewDoc.fileUrl && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <img src={viewDoc.fileUrl} alt={viewDoc.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
              {!['pdf', 'docx', 'xlsx', 'doc', 'link', 'video', 'image'].includes(viewDoc.type) && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                  <FileIcon size={48} color="#888" className="mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Download Required</h3>
                  <p className="text-sm text-muted mb-4">This file cannot be previewed in the browser</p>
                  {viewDoc.fileUrl && (
                    <a href={viewDoc.fileUrl} download className="btn btn-primary mt-4">
                      <Download size={16} /> Download File
                    </a>
                  )}
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
