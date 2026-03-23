'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser, UserRole } from './types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  approveTerms: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  hasRole: () => false,
  approveTerms: async () => {},
});

const googleProvider = new GoogleAuthProvider();

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'admin',
  administrator: 'admin',
  'sr_guard': 'sr_guard',
  'senior guard': 'sr_guard',
  'senior_guard': 'sr_guard',
  'pool_tech': 'pool_tech',
  'pool tech': 'pool_tech',
  lifeguard: 'lifeguard',
};

const normalizeRole = (rawRole?: string): UserRole | null => {
  if (!rawRole) return null;
  const key = rawRole.toLowerCase().replace(/\s+/g, ' ').trim();
  return ROLE_ALIASES[key] || null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const staffDocRef = doc(db, 'staff', fbUser.uid);
          const [userDoc, staffDoc] = await Promise.all([getDoc(userDocRef), getDoc(staffDocRef)]);
          const userData = userDoc.exists() ? userDoc.data() : {};
          const staffData = staffDoc.exists() ? staffDoc.data() : {};

          const rawRole = userData.role || userData.positionId || staffData.role || staffData.positionId;
          const normalizedRole = normalizeRole(rawRole) || 'lifeguard';

          const staffName = staffData.firstName && staffData.lastName
            ? `${staffData.firstName} ${staffData.lastName}`
            : '';
          const resolvedName = userData.displayName || staffName || fbUser.displayName || fbUser.email?.split('@')[0] || 'User';

          const resolvedUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email || userData.email || '',
            displayName: resolvedName,
            role: normalizedRole,
            photoURL: fbUser.photoURL ?? userData.photoURL ?? null,
            orgId: userData.orgId || staffData.orgId || 'sfac',
            ...userData,
          } as AppUser;

          const shouldSyncRole = !userDoc.exists() || !normalizeRole(userData.role || userData.positionId) || normalizeRole(userData.role || userData.positionId) !== normalizedRole;
          if (shouldSyncRole) {
            await setDoc(userDocRef, {
              role: normalizedRole,
              positionId: normalizedRole,
              displayName: resolvedName,
              email: fbUser.email || userData.email || '',
              orgId: userData.orgId || staffData.orgId || 'sfac',
            }, { merge: true });
          }

          setUser(resolvedUser);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const approveTerms = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { hasAgreedToTerms: true }, { merge: true });
    setUser({ ...user, hasAgreedToTerms: true });
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signInWithGoogle, signOut, hasRole, approveTerms }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
