'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';

export default function ResetPasswordPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const handleReset = async () => {
    if (!firebaseUser || !user) return;
    if (password.length < 8) {
      setStatus('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setStatus('Passwords do not match.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      await updatePassword(firebaseUser, password);
      await updateDoc(doc(db, 'users', user.uid), { mustResetPassword: false });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setStatus('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 520, marginTop: 40 }}>
      <div className="card">
        <h1 className="page-title">Set a New Password</h1>
        <p className="page-subtitle">For security, you must update your temporary password.</p>

        <div className="form-group mt-6">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="form-group mt-4">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-input"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter password"
          />
        </div>

        {status && <div className="text-sm text-muted mt-3">{status}</div>}

        <button
          className="btn btn-primary mt-6"
          style={{ width: '100%' }}
          onClick={handleReset}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
