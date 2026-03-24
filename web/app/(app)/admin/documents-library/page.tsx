'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, getMetadata } from 'firebase/storage';
import { DocumentLibraryItem, DocumentCategory, DocumentArchive } from '@/lib/types';

const CATEGORIES: { value: DocumentCategory; label: string; icon: string }[] = [
  { value: 'checklist', label: 'Checklists', icon: '☑️' },
  { value: 'incident', label: 'Incident Reports', icon: '🚨' },
  { value: 'hr_form', label: 'HR Forms', icon: '📋' },
  { value: 'training', label: 'Training Materials', icon: '🎓' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'operational', label: 'Operational', icon: '⚙️' },
  { value: 'archive', label: 'Archive', icon: '📦' },
];

const DOCUMENT_TYPES = ['pdf', 'docx', 'xlsx', 'image', 'link', 'video'];

export default function DocumentLibraryPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentLibraryItem[]>([]);
  const [archives, setArchives] = useState<DocumentArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'library' | 'archives' | 'upload'>('library');
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('operational');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadAccess, setUploadAccess] = useState<string[]>(['admin', 'sr_guard', 'pool_tech', 'lifeguard']);

  const isAdmin = user?.roleTier === 'admin';

  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;
      try {
        const [docsSnap, archivesSnap] = await Promise.all([
          getDocs(collection(db, 'documents_library')),
          getDocs(collection(db, 'document_archives')),
        ]);

        const docsList = docsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentLibraryItem));
        const archivesList = archivesSnap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentArchive));

        setDocuments(docsList);
        setArchives(archivesList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Check if bucket is configured
      if (!storage) {
        alert('Cloud Storage is not configured. Please set up Firebase Cloud Storage bucket.');
        console.error('Storage not initialized. See BUCKET_SETUP.md');
        return;
      }

      // Upload to Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${uploadFile.name}`;
      const storageRef = ref(storage, `documents/${fileName}`);
      
      try {
        await uploadBytes(storageRef, uploadFile, {
          contentType: uploadFile.type,
        });
      } catch (storageErr: any) {
        if (storageErr.code === 'storage/bucket-not-found') {
          alert('Cloud Storage bucket not found. Please create the bucket at: https://console.firebase.google.com/project/aquatrack-5469f/storage');
          return;
        }
        throw storageErr;
      }

      const fileUrl = await getDownloadURL(storageRef);

      // Create Firestore document ID
      const docId = `doc_${timestamp}`;
      const uploadedAt = new Date().toISOString();
      const uploadedBy = user?.displayName || 'Admin';
      const tags = uploadTags.split(',').map(t => t.trim()).filter(t => t);
      
      // Infer document type from file
      let docType: 'pdf' | 'docx' | 'xlsx' | 'image' | 'link' | 'video' = 'docx';
      if (uploadFile.type.includes('pdf')) docType = 'pdf';
      else if (uploadFile.type.includes('spreadsheet') || uploadFile.type.includes('excel')) docType = 'xlsx';
      else if (uploadFile.type.includes('image')) docType = 'image';
      else if (uploadFile.type.includes('video') || uploadCategory === 'training') docType = 'video';

      // Infer MIME type
      let mimeType = uploadFile.type || 'application/octet-stream';
      const mimeTypeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'image': 'image/jpeg',
        'video': 'video/mp4',
      };
      mimeType = mimeTypeMap[docType] || uploadFile.type || 'application/octet-stream';

      // Determine visibility
      const isAllStaff = uploadAccess.length === 4 &&
        uploadAccess.includes('admin') &&
        uploadAccess.includes('sr_guard') &&
        uploadAccess.includes('pool_tech') &&
        uploadAccess.includes('lifeguard');
      const visibility = isAllStaff ? 'all_staff' : 'restricted';

      // Old format for documents_library (backward compat)
      const oldDoc: DocumentLibraryItem = {
        id: docId,
        title: uploadTitle,
        category: uploadCategory,
        type: docType,
        fileUrl,
        fileSize: uploadFile.size,
        uploadedAt,
        uploadedBy,
        tags,
        accessRoles: uploadAccess as any,
        version: 1,
        isActive: true,
      };

      // New format for documents collection
      const newDoc = {
        id: docId,
        title: uploadTitle,
        description: '',
        category: uploadCategory,
        subCategory: undefined,
        type: docType,
        mimeType,
        fileUrl,
        storagePath: `documents/${uploadFile.name}`,
        accessRoles: uploadAccess,
        visibility,
        isActive: true,
        version: 1,
        tags,
        uploadedAt,
        uploadedBy,
        sortOrder: 0,
      };

      // Dual-write: Write to both collections (transition period)
      await Promise.all([
        setDoc(doc(db, 'documents_library', docId), oldDoc),
        setDoc(doc(db, 'documents', docId), newDoc),
      ]);

      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadTags('');
      setUploadAccess(['admin', 'sr_guard', 'pool_tech', 'lifeguard']);

      // Add to local state (use old format for display)
      setDocuments(prev => [...prev, oldDoc]);

      alert('✅ Document uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      
      if (err.code === 'storage/unauthorized') {
        alert('Permission denied. Check Firestore security rules.');
      } else if (err.code === 'storage/bucket-not-found') {
        alert('Cloud Storage bucket not found. Please create it: https://console.firebase.google.com/project/aquatrack-5469f/storage');
      } else {
        alert(`Failed to upload document: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Delete this document? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'documents_library', docId));
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
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

  const filteredDocs = documents.filter(d => {
    const matchCategory = filterCategory === 'all' || d.category === filterCategory;
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       d.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Document Library Management</h1>
          <p className="page-subtitle">Manage checklists, forms, and training materials</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-admin">📚 {documents.length} docs</span>
          <span className="badge badge-admin">📦 {archives.length} archives</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {(['library', 'archives', 'upload'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--blue-500)' : 'none',
              color: activeTab === tab ? 'var(--blue-500)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 600 : 500,
              textAlign: 'center',
            }}
          >
            {tab === 'library' && '📚 Document Library'}
            {tab === 'archives' && '📦 Archives'}
            {tab === 'upload' && '⬆️ Upload'}
          </button>
        ))}
      </div>

      {/* LIBRARY TAB */}
      {activeTab === 'library' && (
        <div>
          {/* Search & Filter */}
          <div className="card" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div className="search-wrapper">
              <input
                className="form-input search-input"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as any)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Documents Grid */}
          {filteredDocs.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>No documents found</p>
                <button className="btn btn-primary mt-4" onClick={() => setActiveTab('upload')}>
                  Upload First Document
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredDocs.map(doc => (
                <div key={doc.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div className="text-sm font-semibold">{doc.title}</div>
                      <div className="text-xs text-muted mt-1">
                        {CATEGORIES.find(c => c.value === doc.category)?.icon} {doc.category}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="btn btn-ghost"
                      style={{ color: '#ef4444', padding: '4px 8px' }}
                    >
                      🗑
                    </button>
                  </div>

                  <div style={{ marginBottom: 12, padding: '8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                    <div className="text-xs text-muted mb-2">Tags:</div>
                    {doc.tags?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {doc.tags.map(tag => (
                          <span
                            key={tag}
                            className="badge"
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--blue-500)',
                              fontSize: '0.65rem',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">No tags</span>
                    )}
                  </div>

                  <div className="text-xs text-muted mb-3">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                      📥 Download
                    </a>
                    <button className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ARCHIVES TAB */}
      {activeTab === 'archives' && (
        <div>
          {archives.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>No archives imported yet</p>
                <p className="text-sm text-muted mt-2">Import document archives to organize them here</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {archives.map(archive => (
                <div key={archive.id} className="card">
                  <div className="text-sm font-semibold mb-2">{archive.archiveName}</div>
                  <div className="text-xs text-muted mb-3">
                    <div>📁 {archive.totalFiles} files</div>
                    <div>📅 {new Date(archive.importDate).toLocaleDateString()}</div>
                    <div className="mt-2">
                      Status:{' '}
                      <span
                        style={{
                          background: archive.status === 'complete' ? '#ecfdf5' : '#fef2f2',
                          color: archive.status === 'complete' ? '#059669' : '#dc2626',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                        }}
                      >
                        {archive.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h3 className="section-title mb-6">Upload Document</h3>

          <form onSubmit={handleFileUpload}>
            <div className="form-group">
              <label className="form-label">Document Title *</label>
              <input
                className="form-input"
                placeholder="e.g., AED Daily Checklist"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value as DocumentCategory)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">File Upload *</label>
              <div
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 8,
                  padding: 24,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-elevated)',
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  setUploadFile(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  hidden
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile ? (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
                    <div className="font-semibold text-sm">{uploadFile.name}</div>
                    <div className="text-xs text-muted">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm mt-3"
                      onClick={e => {
                        e.stopPropagation();
                        setUploadFile(null);
                      }}
                    >
                      Change File
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📤</div>
                    <div className="font-semibold text-sm">Drag files here or click to select</div>
                    <div className="text-xs text-muted mt-1">PDF, DOCX, XLSX, images supported</div>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                className="form-input"
                placeholder="e.g., daily, safety, check"
                value={uploadTags}
                onChange={e => setUploadTags(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Who can access?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['admin', 'sr_guard', 'pool_tech', 'lifeguard'].map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={uploadAccess.includes(role)}
                      onChange={e => {
                        setUploadAccess(prev =>
                          e.target.checked ? [...prev, role] : prev.filter(r => r !== role)
                        );
                      }}
                    />
                    <span className="text-sm">{role.replace('_', ' ').toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!uploadFile || !uploadTitle.trim() || uploadingFile}
              style={{ width: '100%' }}
            >
              {uploadingFile ? `Uploading... ${uploadProgress}%` : 'Upload Document'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
