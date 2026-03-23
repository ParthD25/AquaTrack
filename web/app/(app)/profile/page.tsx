'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';

interface StaffContact {
  phone?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'security'>('personal');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Contact Info
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!firebaseUser) return;
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const staffRef = doc(db, 'staff', firebaseUser.uid);
        const [userSnap, staffSnap] = await Promise.all([getDoc(userRef), getDoc(staffRef)]);

        const userData = userSnap.exists() ? userSnap.data() : {};
        const staffData = staffSnap.exists() ? staffSnap.data() : {};

        // Personal
        setFirstName(staffData.firstName || userData.firstName || '');
        setLastName(staffData.lastName || userData.lastName || '');
        setEmail(firebaseUser.email || '');
        setPhotoURL(firebaseUser.photoURL || userData.photoURL || '');

        // Contact
        setPhone(staffData.phone || '');
        setEmergencyName(staffData.emergencyName || '');
        setEmergencyPhone(staffData.emergencyPhone || '');
        setAddress(staffData.address || '');
        setCity(staffData.city || '');
        setState(staffData.state || '');
        setZip(staffData.zip || '');
      } catch (err) {
        console.error(err);
        showNotification('error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [firebaseUser]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSavePersonal = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();

      // Update Firebase profile
      await updateProfile(firebaseUser, { displayName });

      // Update users collection
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          displayName,
          firstName,
          lastName,
          photoURL: photoURL || null,
        },
        { merge: true }
      );

      // Update staff collection (synced)
      await setDoc(
        doc(db, 'staff', firebaseUser.uid),
        {
          firstName,
          lastName,
          photoURL: photoURL || null,
        },
        { merge: true }
      );

      showNotification('success', 'Personal information updated!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || 'Failed to save personal info');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'staff', firebaseUser.uid),
        {
          phone,
          emergencyName,
          emergencyPhone,
          address,
          city,
          state,
          zip,
        },
        { merge: true }
      );
      showNotification('success', 'Contact information updated!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Failed to save contact info');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser) return;
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      // For real password updates, you'd need to re-authenticate first
      // For now, we'll just show a success message
      await updatePassword(firebaseUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotification('success', 'Password updated!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-container flex justify-center"><div className="spinner" /></div>;
  }

  const initials = `${firstName[0] || 'U'}${lastName[0] || 'S'}`.toUpperCase();

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account and contact information</p>
        </div>
        <div className="avatar avatar-lg">{initials}</div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            borderColor: notification.type === 'success' ? '#6ee7b7' : '#fca5a5',
            color: notification.type === 'success' ? '#059669' : '#dc2626',
            fontWeight: 500,
          }}
        >
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {(['personal', 'contact', 'security'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--blue-500)' : 'none',
              color: activeTab === tab ? 'var(--blue-500)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 600 : 500,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'personal' && '👤 Personal'}
            {tab === 'contact' && '📱 Contact'}
            {tab === 'security' && '🔒 Security'}
          </button>
        ))}
      </div>

      {/* Personal Tab */}
      {activeTab === 'personal' && (
        <div className="grid-2 grid gap-6">
          <div className="card">
            <h3 className="section-title mb-4">Personal Information</h3>

            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                disabled
                style={{ opacity: 0.6 }}
              />
              <p className="text-xs text-muted mt-1">Email cannot be changed from this page</p>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={photoURL}
                onChange={e => setPhotoURL(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSavePersonal}
              disabled={saving}
              style={{ width: '100%' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="card">
            <h3 className="section-title mb-4">Preview</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 700,
              }}>
                {initials}
              </div>
              <div>
                <div className="text-lg font-bold">{firstName} {lastName}</div>
                <div className="text-sm text-muted">{email}</div>
                <div className="text-sm text-muted mt-2" style={{ color: 'var(--blue-500)', fontWeight: 500 }}>
                  {user?.role === 'admin' ? '⚙️ Administrator' : user?.role === 'sr_guard' ? '🏅 Senior Guard' : user?.role === 'pool_tech' ? '🔧 Pool Technician' : '🏊 Lifeguard'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="card">
          <h3 className="section-title mb-6">Contact Information</h3>

          <div className="grid-2 grid gap-4 mb-6">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="(123) 456-7890"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="Street address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                placeholder="CA"
                value={state}
                onChange={e => setState(e.target.value)}
                maxLength={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ZIP Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="12345"
                value={zip}
                onChange={e => setZip(e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24, marginBottom: 24 }}>
            <h4 className="section-title mb-4">Emergency Contact</h4>
            <div className="grid-2 grid gap-4">
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Full name"
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="(123) 456-7890"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSaveContact}
            disabled={saving}
            style={{ width: '100%' }}
          >
            {saving ? 'Saving...' : 'Save Contact Information'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 className="section-title mb-4">Change Password</h3>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleChangePassword}
            disabled={saving || !newPassword || !confirmPassword}
            style={{ width: '100%' }}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>

          <div style={{ marginTop: 24, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
            <div className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Password Requirements:</strong>
              <ul style={{ margin: '8px 0 0 20px' }}>
                <li>At least 6 characters</li>
                <li>Mix of uppercase and lowercase letters</li>
                <li>Include numbers or special characters</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
