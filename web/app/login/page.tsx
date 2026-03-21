'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password. Contact your administrator for access.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      setError('Google sign-in failed. Try again or contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />
      </div>

      <div className="login-content">
        {/* Logo */}
        <div className="login-logo animate-fade-in">
          <div className="login-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 20 C8 14, 12 10, 16 12 C20 14, 24 8, 28 12" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M4 24 C8 18, 12 14, 16 16 C20 18, 24 12, 28 16" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
              <circle cx="16" cy="10" r="4" fill="#00d4ff" fillOpacity="0.2" stroke="#00d4ff" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <h1 className="login-brand">AquaTrack</h1>
            <p className="login-tagline">Aquatics Management Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="card login-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle text-secondary text-sm">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="alert-error mt-4">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="google-btn mt-6"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider-text mt-4 mb-4">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group mt-4">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg mt-6"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-muted mt-6" style={{ textAlign: 'center' }}>
            Need access? Contact your administrator.
          </p>
        </div>

        {/* Global Confidentiality Disclaimer */}
        <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, textAlign: 'center' }}>
          <p className="text-xs text-muted" style={{ lineHeight: 1.5, marginBottom: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>CONFIDENTIALITY NOTICE:</strong> This website, and any documents, files or previous messages attached to it, may contain confidential information that is legally privileged. If you are not the intended recipient, or person responsible for delivering it to the intended recipient, you are hereby notified that any disclosure, copying, distribution or use of any of the information contained in or attached to this website is strictly prohibited. If you have reached this website in error, please advise the sender by e-mail, and leave this website immediately.
          </p>
        </div>

      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 40px 20px;
        }
        .login-bg { position: absolute; inset: 0; pointer-events: none; }
        .login-bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.12; }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #00d4ff, transparent); top: -200px; left: -100px; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #2dd4bf, transparent); bottom: -100px; right: -50px; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #a855f7, transparent); bottom: 100px; left: 200px; opacity: 0.07; }
        .login-content { position: relative; width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 24px; }
        .login-logo { display: flex; align-items: center; gap: 14px; }
        .login-logo-icon {
          width: 56px; height: 56px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.25);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-brand {
          font-size: 1.75rem; font-weight: 800;
          background: linear-gradient(135deg, #00d4ff, #2dd4bf);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; letter-spacing: -0.03em;
        }
        .login-tagline { font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px; }
        .login-card { padding: 32px; }
        .login-title { font-size: 1.5rem; font-weight: 700; }
        .login-form { display: flex; flex-direction: column; }
        .alert-error {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-md); padding: 10px 14px;
          font-size: 0.875rem; color: var(--red-400);
          display: flex; align-items: center; gap: 8px;
        }
        .google-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9375rem; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: all 200ms;
        }
        .google-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--border-subtle); }
        .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .divider-text {
          display: flex; align-items: center; gap: 12px;
          color: var(--text-muted); font-size: 0.75rem;
        }
        .divider-text::before, .divider-text::after {
          content: ''; flex: 1; height: 1px;
          background: var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
