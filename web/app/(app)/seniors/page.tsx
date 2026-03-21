'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const SENIORS = [
  { id: '1', name: 'Branden Uyeda', specialty: 'Team Culture & Morale', bio: 'Senior Lifeguard and team culture coordinator. Leads orientation, mentee programs, and staff recognition initiatives.', certifications: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'WSI'], emoji: '⭐' },
  { id: '2', name: 'Sophia Smith', specialty: 'In-Service Training', bio: 'Coordinates skill-based in-service modules and tracks team development. Strong background in audit coordination.', certifications: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'Title 22'], emoji: '🏊' },
  { id: '3', name: 'Hector Macias', specialty: 'Pool Tech & Operations', bio: 'Pool technician lead overseeing chemical safety, equipment maintenance, and pool tech team training.', certifications: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'Pool Tech'], emoji: '🔧' },
  { id: '4', name: 'Rachel Tom', specialty: 'Swim Lessons', bio: 'Senior swim instructor responsible for lesson program coordination, instructor development, and Red Cross record keeping.', certifications: ['Lifeguard', 'CPR/AED', 'WSI', 'O2'], emoji: '🎓' },
  { id: '5', name: 'Bryan Jung', specialty: 'Emergency Response', bio: 'Specializes in emergency action plan review, Title 22 recertification coordination, and skills verification standards.', certifications: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'Title 22', 'WSI'], emoji: '🚨' },
];

const SR_RESOURCES = [
  { icon: '📋', title: 'In-Service Modules', desc: 'Curated skills and activities for LG and swim instructor in-service trainings', tag: 'Training' },
  { icon: '🏅', title: 'Senior LG Specialties', desc: 'Pilot program: each senior owns a dedicated program area—coordinate, train, and track', tag: 'Program' },
  { icon: '📊', title: 'Audit Tracker', desc: 'VAT, CPR, Brick Test, Live Recognition, and Swim Instructor audits', tag: 'Audits', href: '/audits' },
  { icon: '📜', title: 'Title 22 Scheduling', desc: 'Plan and track Title 22 trainings, recerts, and lifeguard class cohorts', tag: 'Compliance' },
  { icon: '👥', title: 'Mentor/Mentee Teams', desc: 'Dual captain team structure — coordinate summer/year-round mentee groups', tag: 'Culture' },
  { icon: '🚨', title: 'Emergency Action Plan', desc: 'Review and update the facility EAP — annual check-in required', tag: 'Safety' },
];

export default function SeniorsPage() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'hub' | 'meet' | 'orientation' | 'specialties'>('hub');

  if (!hasRole('admin', 'sr_guard')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted">Senior Lifeguard Hub is for Senior Guards and Admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Senior Lifeguard Hub</h1>
          <p className="page-subtitle">Orientation, specialties, team directory & resources</p>
        </div>
      </div>

      <div className="tabs mb-8" style={{ maxWidth: 600 }}>
        {[
          { key: 'hub', label: '🏠 Hub' },
          { key: 'meet', label: '👥 Meet the Seniors' },
          { key: 'orientation', label: '🎓 Orientation' },
          { key: 'specialties', label: '⭐ Specialties' },
        ].map(t => (
          <button key={t.key} className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key as typeof activeTab)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'hub' && (
        <div>
          <p className="text-secondary mb-6">
            Your central resource center for senior lifeguard operations, training coordination, and team management.
          </p>
          <div className="grid-3 grid">
            {SR_RESOURCES.map(r => (
              <a
                key={r.title}
                href={r.href || '#'}
                className="card resource-card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{r.icon}</div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{r.title}</h3>
                  <span className="tag tag-blue">{r.tag}</span>
                </div>
                <p className="text-xs text-muted">{r.desc}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'meet' && (
        <div>
          <p className="text-secondary mb-6">
            Meet the SFAC Senior Lifeguard team. Each senior leads a dedicated program specialty.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {SENIORS.map(s => (
              <div key={s.id} className="card senior-card">
                <div className="flex items-center gap-4 mb-4">
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(45,212,191,0.2))',
                    border: '2px solid rgba(0,212,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.75rem', flexShrink: 0,
                  }}>
                    {s.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ fontSize: '1rem' }}>{s.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--aqua-400)', fontWeight: 600 }}>{s.specialty}</p>
                    <span className="badge badge-sr_guard mt-1">SR. Guard</span>
                  </div>
                </div>
                <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>{s.bio}</p>
                <div className="divider" />
                <div>
                  <p className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Certifications</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {s.certifications.map(c => (
                      <span key={c} className="badge badge-success" style={{ padding: '2px 7px', fontSize: '0.65rem' }}>{c}</span>
                    ))}
                  </div>
                </div>
                {hasRole('admin') && (
                  <button className="btn btn-ghost btn-sm mt-3" style={{ width: '100%' }}>✏️ Edit Profile</button>
                )}
              </div>
            ))}
            {hasRole('admin') && (
              <div className="card" style={{ border: '2px dashed var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, cursor: 'pointer', minHeight: 200, color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2rem' }}>+</span>
                <span className="text-sm">Add Senior Lifeguard</span>
                <span className="text-xs text-muted">Upload photo + bio</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orientation' && (
        <div>
          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(45,212,191,0.05))', borderColor: 'rgba(0,212,255,0.2)' }}>
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '3rem' }}>🎓</span>
              <div>
                <h2 className="section-title">Senior Lifeguard Orientation</h2>
                <p className="text-sm text-secondary mt-1">
                  Revamped orientation slideshow incorporating the new manual and 2024–25 training outline.
                  Updated for the current season.
                </p>
              </div>
            </div>
          </div>

          <div className="grid-2 grid">
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📑</div>
              <h3 className="font-semibold mb-1">Orientation Slideshow</h3>
              <p className="text-sm text-muted mb-4">Senior Lifeguard Orientation_.pptx · 27.7 MB</p>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm">▶ Open Slideshow</button>
                <button className="btn btn-secondary btn-sm">⬇ Download</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📖</div>
              <h3 className="font-semibold mb-1">2024–25 Training Outline</h3>
              <p className="text-sm text-muted mb-4">Covers: onboarding tracks, AI/LG skill tracks, in-service structure, specialty roles</p>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm">👁 View</button>
                <button className="btn btn-secondary btn-sm">⬇ Download</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
              <h3 className="font-semibold mb-1">Onboarding Checklists</h3>
              <p className="text-sm text-muted mb-4">Position-specific checklists: AI, LG, PT, SR — all items to cover before first shift</p>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm">👁 View</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🧪</div>
              <h3 className="font-semibold mb-1">Welcome Test / Quiz</h3>
              <p className="text-sm text-muted mb-4">Orientation knowledge quiz — assign to new staff after completing orientation</p>
              <button className="btn btn-secondary btn-sm">Open Quiz</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'specialties' && (
        <div>
          <div className="card mb-6" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }}>
            <div className="flex gap-4 items-start">
              <span style={{ fontSize: '2rem', flexShrink: 0 }}>⭐</span>
              <div>
                <h2 className="section-title">Senior Lifeguard Specialties</h2>
                <p className="text-sm text-secondary mt-1">
                  Pilot program: each senior owns a dedicated area of the facility program. They are responsible for coordinating, training, and tracking their specialty. This creates accountability and depth of ownership across the team.
                </p>
                <span className="badge badge-neutral mt-3">🚀 Pilot Program</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {SENIORS.map(s => (
              <div key={s.id} className="card specialty-card">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--purple-400)', fontWeight: 600 }}>{s.specialty}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }} href="#">📁 Resources & Materials</a>
                  <a className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }} href="#">📊 Training Tracker</a>
                  <a className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }} href="#">📋 Coordination Notes</a>
                </div>
              </div>
            ))}
            {hasRole('admin') && (
              <div className="card" style={{ border: '2px dashed var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, cursor: 'pointer', color: 'var(--text-muted)', minHeight: 160 }}>
                <span style={{ fontSize: '1.5rem' }}>+</span>
                <span className="text-sm">Add Specialty</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .resource-card { cursor: pointer; }
        .resource-card:hover { transform: translateY(-2px); }
        .senior-card { transition: all 200ms; }
        .senior-card:hover { box-shadow: var(--glow-aqua); transform: translateY(-2px); }
        .specialty-card { transition: all 200ms; }
        .specialty-card:hover { border-color: rgba(168,85,247,0.3); }
      `}</style>
    </div>
  );
}
