'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { DocumentArchive } from '@/lib/types';

interface ArchiveFile {
  name: string;
  category: string;
  dateFound: string;
  status: 'pending' | 'imported' | 'error';
  message?: string;
}

export default function DocumentArchivesPage() {
  const { user } = useAuth();
  const [archives, setArchives] = useState<DocumentArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState<DocumentArchive | null>(null);
  const [importingArchive, setImportingArchive] = useState<string | null>(null);
  const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchArchives() {
      if (!isAdmin) return;
      try {
        const snap = await getDocs(collection(db, 'document_archives'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentArchive));
        setArchives(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArchives();
  }, [isAdmin]);

  // Detect archives from filesystem
  const detectArchives = async () => {
    // This would typically call a backend API
    // For now, predefined archive mappings
    const predefinedArchives: DocumentArchive[] = [
      {
        id: 'arc_aquatic_001',
        archiveName: 'Aquatic Checklist Forms-20260321T023049Z-3-001',
        sourcePath: '/downloads/DigiTracker/Aquatic Checklist Forms-20260321T023049Z-3-001',
        totalFiles: 35,
        importedFiles: 0,
        status: 'pending',
        importDate: new Date().toISOString(),
        category: 'checklist',
        notes: 'Primary aquatic facility checklists',
      },
      {
        id: 'arc_drive_001',
        archiveName: 'drive-download-20260321T023347Z-3-001',
        sourcePath: '/downloads/DigiTracker/drive-download-20260321T023347Z-3-001',
        totalFiles: 42,
        importedFiles: 0,
        status: 'pending',
        importDate: new Date().toISOString(),
        category: 'archive',
        notes: 'Backup of aquatic facility documents',
      },
      {
        id: 'arc_drive_002',
        archiveName: 'drive-download-20260321T025803Z-3-001',
        sourcePath: '/downloads/DigiTracker/drive-download-20260321T025803Z-3-001',
        totalFiles: 89,
        importedFiles: 0,
        status: 'pending',
        importDate: new Date().toISOString(),
        category: 'archive',
        notes: 'Extended archive with senior lifeguard and training materials',
      },
      {
        id: 'arc_senior_001',
        archiveName: 'Senior Lifeguard-20260321T025547Z-3-001',
        sourcePath: '/downloads/DigiTracker/Senior Lifeguard-20260321T025547Z-3-001',
        totalFiles: 67,
        importedFiles: 0,
        status: 'pending',
        importDate: new Date().toISOString(),
        category: 'training',
        notes: 'Senior lifeguard training materials and rosters',
      },
      {
        id: 'arc_staff_001',
        archiveName: 'Staff Forms -20260321T030415Z-3-001',
        sourcePath: '/downloads/DigiTracker/Staff Forms -20260321T030415Z-3-001',
        totalFiles: 7,
        importedFiles: 0,
        status: 'pending',
        importDate: new Date().toISOString(),
        category: 'hr_form',
        notes: 'HR forms (address, direct deposit, emergency contact, etc.)',
      },
    ];

    setArchives(predefinedArchives);
  };

  const handleStartImport = async (archive: DocumentArchive) => {
    setImportingArchive(archive.id);
    setSelectedArchive(archive);

    // Simulate file detection
    const mockFiles: ArchiveFile[] = [
      { name: 'README.pdf', category: 'documentation', dateFound: new Date().toISOString(), status: 'pending' },
      { name: 'AED_Checklist_Daily.docx', category: 'checklist', dateFound: new Date().toISOString(), status: 'pending' },
      { name: 'Safety_Incident_Report.pdf', category: 'incident', dateFound: new Date().toISOString(), status: 'pending' },
    ];

    setArchiveFiles(mockFiles);

    // Simulate import progress
    setTimeout(() => {
      const updated = mockFiles.map(f => ({
        ...f,
        status: 'imported' as const,
      }));
      setArchiveFiles(updated);

      // Update archive in Firestore
      updateDoc(doc(db, 'document_archives', archive.id), {
        status: 'complete',
        importedFiles: mockFiles.length,
      });

      setArchives(prev =>
        prev.map(a =>
          a.id === archive.id
            ? { ...a, status: 'complete', importedFiles: mockFiles.length }
            : a
        )
      );

      setImportingArchive(null);
    }, 2000);
  };

  const handleRetryImport = async (archive: DocumentArchive) => {
    await handleStartImport(archive);
  };

  const handleDeleteArchive = async (archiveId: string) => {
    if (!confirm('Delete this archive record? Files will not be deleted.')) return;
    try {
      await deleteDoc(doc(db, 'document_archives', archiveId));
      setArchives(prev => prev.filter(a => a.id !== archiveId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete archive');
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

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Document Archives</h1>
          <p className="page-subtitle">Import and manage archived documents</p>
        </div>
        <button className="btn btn-primary" onClick={detectArchives}>
          🔍 Detect Archives
        </button>
      </div>

      {archives.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="text-lg font-semibold">No archives found</p>
            <p className="text-sm text-muted mt-2">Click "Detect Archives" to scan for document folders</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {archives.map(archive => (
            <div key={archive.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div className="text-sm font-semibold">{archive.archiveName}</div>
                  <div className="text-xs text-muted mt-1">
                    {archive.category.toUpperCase()} • {archive.totalFiles} files
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteArchive(archive.id)}
                  className="btn btn-ghost"
                  style={{ color: '#ef4444', padding: '4px 8px' }}
                >
                  🗑
                </button>
              </div>

              <div style={{ marginBottom: 12, padding: '8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                <div className="text-xs text-muted mb-2">Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: 'var(--border-subtle)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: archive.status === 'complete' ? '#10b981' : archive.status === 'in_progress' ? '#3b82f6' : '#ef4444',
                        width: archive.status === 'complete' ? '100%' : archive.status === 'in_progress' ? '50%' : '0%',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold">
                    {archive.importedFiles}/{archive.totalFiles}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted mb-4">
                <div>📁 {archive.notes}</div>
                {archive.importDate && (
                  <div>🗓️ {new Date(archive.importDate).toLocaleDateString()}</div>
                )}
              </div>

              {archive.status === 'pending' && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleStartImport(archive)}
                  disabled={importingArchive === archive.id}
                >
                  {importingArchive === archive.id ? 'Importing...' : '⬆️ Start Import'}
                </button>
              )}
              {archive.status === 'in_progress' && (
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  disabled
                >
                  ⏳ Importing...
                </button>
              )}
              {archive.status === 'complete' && (
                <button
                  className="btn"
                  style={{
                    width: '100%',
                    background: '#f0fdf4',
                    color: '#059669',
                    border: '1px solid #ecfdf5',
                  }}
                  disabled
                >
                  ✅ Import Complete
                </button>
              )}
              {archive.status === 'error' && (
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => handleRetryImport(archive)}
                >
                  🔄 Retry Import
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedArchive && archiveFiles.length > 0 && (
        <div className="card" style={{ marginTop: 32 }}>
          <h3 className="section-title mb-4">
            Files in {selectedArchive.archiveName}
          </h3>
          <div
            style={{
              maxHeight: 400,
              overflowY: 'auto',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                    File Name
                  </th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                    Category
                  </th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {archiveFiles.map((file, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                    }}
                  >
                    <td style={{ padding: 12, fontSize: '0.875rem' }}>{file.name}</td>
                    <td style={{ padding: 12, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {file.category}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background:
                            file.status === 'imported'
                              ? '#ecfdf5'
                              : file.status === 'error'
                                ? '#fef2f2'
                                : '#f3f4f6',
                          color:
                            file.status === 'imported'
                              ? '#059669'
                              : file.status === 'error'
                                ? '#dc2626'
                                : '#6b7280',
                        }}
                      >
                        {file.status === 'imported' && '✅'}
                        {file.status === 'error' && '⚠️'}
                        {file.status === 'pending' && '⏳'}
                        {' '}
                        {file.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
