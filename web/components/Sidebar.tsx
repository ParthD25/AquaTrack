'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from './ThemeToggle';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', icon: '⊞', label: 'Dashboard', roles: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
      { href: '/audits', icon: '✓', label: 'Audit Tracker', roles: ['admin', 'sr_guard'] },
      { href: '/certs', icon: '📋', label: 'Certs & Retention', roles: ['admin', 'sr_guard'] },
      { href: '/staff', icon: '👥', label: 'Staff Directory', roles: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
    ],
  },
  {
    label: 'Resources',
    items: [
      { href: '/documents', icon: '📁', label: 'Documents', roles: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
      { href: '/seniors', icon: '🏅', label: 'Senior LG Hub', roles: ['admin', 'sr_guard'] },
      { href: '/seniors/meet', icon: '👤', label: 'Meet the Team', roles: ['admin', 'sr_guard', 'pool_tech', 'lifeguard'] },
      { href: '/training', icon: '🎓', label: 'Pool Tech Training', roles: ['admin', 'sr_guard', 'pool_tech'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/admin', icon: '⚙', label: 'Admin Settings', roles: ['admin'] },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  sr_guard: 'Senior Guard',
  pool_tech: 'Pool Technician',
  lifeguard: 'Lifeguard',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'var(--purple-400)',
  sr_guard: 'var(--aqua-400)',
  pool_tech: 'var(--amber-400)',
  lifeguard: 'var(--green-400)',
};

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            🌊
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', background: 'linear-gradient(135deg, #00d4ff, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AquaTrack
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SFAC Aquatic Center
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(user.role)
          );
          if (visibleItems.length === 0) return null;
          return (
            <React.Fragment key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 16 }}>
          <ThemeToggle />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar avatar-sm">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.displayName}
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: ROLE_COLORS[user.role] }}>
              {ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
