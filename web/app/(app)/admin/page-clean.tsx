'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
}

const ADMIN_CARDS: AdminCard[] = [
  {
    id: 'staff',
    title: 'Staff Directory',
    description: 'Manage lifeguards, roles, positions, and certifications',
    icon: '👥',
    href: '/staff',
  },
  {
    id: 'documents',
    title: 'Documents Library',
    description: 'Upload and manage checklists, forms, and training materials',
    icon: '📁',
    href: '/admin/documents-library',
  },
  {
    id: 'positions',
    title: 'Positions & Roles',
    description: 'Configure custom positions and manage role permissions',
    icon: '🏷️',
    href: '/admin/positions',
  },
  {
    id: 'shifts',
    title: 'Shift Templates',
    description: 'Define shift schedules and daily task templates',
    icon: '🕐',
    href: '/admin/shifts',
  },
  {
    id: 'audits',
    title: 'Audit Configuration',
    description: 'Set up and manage audit types and renewal requirements',
    icon: '✓',
    href: '/admin/audits',
  },
  {
    id: 'access',
    title: 'Access & Permissions',
    description: 'Manage user access levels and document visibility',
    icon: '🔐',
    href: '/admin/access',
  },
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.roleTier === 'admin';

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Admin Only</p>
          <p className="text-sm text-muted">This area is for administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Admin Control Panel</h1>
        <p className="page-subtitle">Manage staff, documents, positions, and system configuration</p>
      </div>

      {/* Admin Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {ADMIN_CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => router.push(card.href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              textAlign: 'left',
              textDecoration: 'none',
              color: 'inherit',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--aqua-400)';
              el.style.boxShadow = '0 4px 12px rgba(0, 184, 224, 0.1)';
              el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--border-color)';
              el.style.boxShadow = 'none';
              el.style.transform = 'translateY(0)';
            }}
          >
            {/* Icon and Title Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{card.icon}</span>
              {card.badge && <span className="badge badge-admin" style={{ marginLeft: 'auto' }}>{card.badge}</span>}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', margin: 0 }}>{card.title}</h3>

            {/* Description */}
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                margin: 0,
                marginBottom: '12px',
                flex: 1,
              }}
            >
              {card.description}
            </p>

            {/* Arrow */}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aqua-400)' }}>
              <span style={{ fontSize: '12px' }}>Manage</span>
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(74, 222, 128, 0.05)',
          border: '1px solid rgba(74, 222, 128, 0.2)',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
        }}
      >
        <p style={{ margin: 0, marginBottom: '8px' }}>
          <strong>💡 Tip:</strong> Changes made in these sections affect all users and operations immediately.
        </p>
        <p style={{ margin: 0 }}>
          For staff management, permissions, and certifications, see the <strong>Staff Directory</strong> page.
        </p>
      </div>
    </div>
  );
}
