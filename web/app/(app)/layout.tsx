'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import AIChatWidget from '@/components/AIChatWidget';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, approveTerms } = useAuth();
  const router = useRouter();
  const [agreeLoading, setAgreeLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(45,212,191,0.2))',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 8,
        }}>🌊</div>
        <div className="spinner" />
        <p className="text-sm text-muted">Loading AquaTrack...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleAgree = async () => {
    setAgreeLoading(true);
    try {
      await approveTerms();
    } catch (e) {
      console.error(e);
      setAgreeLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {user.mustResetPassword && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <h2 className="text-xl font-bold text-center mb-3">Password Reset Required</h2>
            <p className="text-sm text-secondary" style={{ lineHeight: 1.6, textAlign: 'center' }}>
              For security, you must set a new password before continuing.
            </p>
            <div className="flex gap-4 mt-6">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={signOut}>Sign Out</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push('/reset-password')}>
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}
      {user.hasAgreedToTerms !== true && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', marginBottom: 20, margin: '0 auto 20px auto'
            }}>🚨</div>
            <h2 className="text-xl font-bold text-center mb-4">CONFIDENTIALITY & DUTY TO ACT NOTICE</h2>
            <div className="text-sm text-secondary mb-8" style={{ lineHeight: 1.7, textAlign: 'justify', letterSpacing: '0.01em', maxHeight: '45vh', overflowY: 'auto', paddingRight: 8 }}>
              <p className="mb-4">
                <strong style={{ color: 'var(--text-primary)' }}>AMERICAN RED CROSS STANDARD OF CARE:</strong> By accessing the AquaTrack management system, you acknowledge and agree to uphold the American Red Cross standard of care for professional lifeguards. You recognize your legal <em>Duty to Act</em> while on active duty at the <a href="https://www.newark.org/departments/recreation-and-community-services/silliman-activity-and-family-aquatic-center" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aqua-400)', textDecoration: 'underline' }}>Silliman Activity and Family Aquatic Center (City of Newark)</a> or your respective employing agency.
              </p>
              <p>
                <strong style={{ color: 'var(--text-primary)' }}>STRICT CONFIDENTIALITY:</strong> This application, including all medical Incident Reports, Rescue documentation, Employee certifications, and internal facility security protocols contained within, contains highly confidential information that is legally privileged. If you are not an active, authorized employee, you are hereby legally notified that any unauthorized disclosure, photography, copying, distribution, or use of any information contained within this system is strictly prohibited by law.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={signOut} 
                className="btn btn-secondary" style={{ flex: 1 }}
                disabled={agreeLoading}
              >
                I Disagree (Sign Out)
              </button>
              <button 
                onClick={handleAgree} 
                className="btn btn-primary" style={{ flex: 1, background: 'var(--red-500)', borderColor: 'var(--red-600)' }}
                disabled={agreeLoading}
              >
                {agreeLoading ? 'Processing...' : 'I Agree & Understand'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <AIChatWidget />
    </div>
  );
}
