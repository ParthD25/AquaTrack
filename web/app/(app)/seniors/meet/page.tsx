'use client';
import { useAuth } from '@/lib/auth-context';

// This page is accessible to ALL roles
export default function MeetTheSeniorsPage() {
  const { hasRole } = useAuth();
  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Meet the Senior Lifeguard Team</h1>
        <p className="page-subtitle">Your senior guards — each leads a dedicated area of our program</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {[
          { name: 'Branden Uyeda', specialty: 'Team Culture & Morale', bio: 'Leads orientation, mentee programs, and staff recognition initiatives. The culture heartbeat of the team.', emoji: '⭐', certs: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'WSI'] },
          { name: 'Sophia Smith', specialty: 'In-Service Training', bio: 'Coordinates skill-based in-service modules and staff development. Strong background in audit coordination.', emoji: '🏊', certs: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'Title 22'] },
          { name: 'Hector Macias', specialty: 'Pool Tech & Operations', bio: 'Pool tech lead overseeing chemical safety, equipment maintenance, and pool tech team training.', emoji: '🔧', certs: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'Pool Tech'] },
          { name: 'Rachel Tom', specialty: 'Swim Lessons', bio: 'Senior swim instructor responsible for lesson coordination, instructor development, and Red Cross records.', emoji: '🎓', certs: ['Lifeguard', 'CPR/AED', 'WSI', 'O2'] },
          { name: 'Bryan Jung', specialty: 'Emergency Response', bio: 'Specializes in EAP review, Title 22 recertification, skills verification standards, and emergency readiness.', emoji: '🚨', certs: ['Lifeguard', 'CPR/AED', 'O2', 'Waterpark', 'Title 22', 'WSI'] },
        ].map(s => (
          <div key={s.name} className="card" style={{ transition: 'all 200ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(45,212,191,0.2))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                {s.emoji}
              </div>
              <div>
                <h3 className="font-bold" style={{ fontSize: '1rem' }}>{s.name}</h3>
                <p className="text-xs" style={{ color: 'var(--aqua-400)', fontWeight: 600, marginTop: 2 }}>{s.specialty}</p>
                <span className="badge badge-sr_guard mt-1">SR. Guard</span>
              </div>
            </div>
            <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>{s.bio}</p>
            <div className="divider" />
            <div>
              <p className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Certifications</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {s.certs.map(c => <span key={c} className="badge badge-success" style={{ padding: '2px 7px', fontSize: '0.65rem' }}>{c}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
