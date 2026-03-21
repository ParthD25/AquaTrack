'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const POOL_TECH_MODULES = [
  {
    id: '1', icon: '🧪', title: 'Chemical Safety Procedures',
    desc: 'Handling, storage, dosing, and emergency procedures for pool chemicals.',
    topics: ['Chlorine handling', 'pH adjustment', 'Acid safety', 'Spill response'],
    status: 'available', type: 'video',
  },
  {
    id: '2', icon: '🔧', title: 'Equipment Inspection Checklists',
    desc: 'Systematic inspection procedures for all pool deck and mechanical room equipment.',
    topics: ['Pump systems', 'Filter systems', 'Heater check', 'Pressure gauges'],
    status: 'available', type: 'pdf',
  },
  {
    id: '3', icon: '📊', title: 'Cleaning Probes & Calibration',
    desc: 'How to clean, maintain, and calibrate chemical probes for accurate readings.',
    topics: ['pH probe cleaning', 'ORP calibration', 'Turbidity sensors', 'Log entries'],
    status: 'available', type: 'video',
  },
  {
    id: '4', icon: '🛡️', title: 'PPE Review & Proper Usage',
    desc: 'Required personal protective equipment for all pool tech tasks.',
    topics: ['Glove selection', 'Eye protection', 'Chemical aprons', 'Respirators'],
    status: 'available', type: 'pdf',
  },
  {
    id: '5', icon: '🚨', title: 'Emergency Equipment Checks',
    desc: 'Daily verification procedures for AED, oxygen, first aid, and rescue equipment.',
    topics: ['AED battery', 'O2 pressure', 'First aid inventory', 'Rescue tubes'],
    status: 'available', type: 'checklist',
  },
  {
    id: '6', icon: '🌊', title: 'Waterslide Operation & Inspection',
    desc: 'Safe operation, pre-open inspection, and post-close procedures for waterslides.',
    topics: ['Pre-open checklist', 'Flow rate settings', 'Safety rules', 'Shut-down'],
    status: 'filming', type: 'video',
  },
  {
    id: '7', icon: '🔩', title: 'Basic Troubleshooting Guide',
    desc: 'Common pool equipment issues and step-by-step troubleshooting for pool techs.',
    topics: ['Low pressure', 'Cloudy water', 'Heater faults', 'Valve issues'],
    status: 'available', type: 'pdf',
  },
  {
    id: '8', icon: '📅', title: 'Daily Task List & Maintenance Log',
    desc: 'New daily task structure for cleaning and maintenance across shifts.',
    topics: ['Opening tasks', 'Throughout-shift', 'Monthly checks', 'Documentation'],
    status: 'available', type: 'checklist',
  },
];

const TYPE_ICON: Record<string, string> = { video: '🎬', pdf: '📄', checklist: '☑' };
const TYPE_COLOR: Record<string, string> = { video: 'var(--purple-400)', pdf: 'var(--red-400)', checklist: 'var(--green-400)' };

export default function TrainingPage() {
  const { hasRole } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'pdf' | 'checklist'>('all');

  if (!hasRole('admin', 'sr_guard', 'pool_tech')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted">Pool Tech Training is for Pool Technicians, Senior Guards, and Admins.</p>
        </div>
      </div>
    );
  }

  const filtered = POOL_TECH_MODULES.filter(m => activeFilter === 'all' || m.type === activeFilter);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Pool Tech Training</h1>
          <p className="page-subtitle">
            Video guides, checklists, and reference materials for pool operations
          </p>
        </div>
        {hasRole('admin') && (
          <button className="btn btn-primary btn-sm">+ Add Module</button>
        )}
      </div>

      {/* Note about filming */}
      <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span>📸</span>
        <p className="text-sm text-secondary">
          <strong style={{ color: 'var(--amber-400)' }}>Note:</strong> Video modules marked &quot;Filming&quot; need to be recorded before or after pool closure when the deck is clear. Coordinate with your SR guard schedule.
        </p>
      </div>

      {/* Filter */}
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
          <div key={mod.id} className="card training-card" style={{ position: 'relative' }}>
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
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{mod.icon}</div>
              <div>
                <div className="font-semibold text-sm">{mod.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: TYPE_COLOR[mod.type] }}>
                    {TYPE_ICON[mod.type]} {mod.type.charAt(0).toUpperCase() + mod.type.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-secondary mb-3" style={{ lineHeight: 1.6 }}>{mod.desc}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
              {mod.topics.map(t => (
                <span key={t} className="badge badge-neutral" style={{ padding: '1px 7px', fontSize: '0.65rem' }}>{t}</span>
              ))}
            </div>

            <button
              className={`btn btn-sm ${mod.status === 'filming' ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
              disabled={mod.status === 'filming'}
            >
              {mod.status === 'filming' ? '⏳ Coming Soon' : mod.type === 'video' ? '▶ Watch Video' : mod.type === 'checklist' ? '☑ Open Checklist' : '📄 View Document'}
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .training-card { transition: all 200ms; }
        .training-card:hover { transform: translateY(-2px); box-shadow: var(--glow-aqua); }
      `}</style>
    </div>
  );
}
