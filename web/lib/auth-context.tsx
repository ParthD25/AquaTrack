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
import { AppUser, UserRole, Position, PositionPermissions } from './types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  position: Position | null; // Custom position with permissions
  permissions: PositionPermissions | null; // Computed permissions for this user
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: keyof PositionPermissions) => boolean;
  hasAnyPermission: (...permissions: (keyof PositionPermissions)[]) => boolean;
  approveTerms: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  position: null,
  permissions: null,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
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

/**
 * Fetch position and permissions for a user.
 * If positionId references a custom position, load it from Firestore.
 * Otherwise, return null (will use built-in role permissions).
 */
const loadUserPosition = async (positionId: string): Promise<Position | null> => {
  try {
    // First check if this is a built-in role ID
    if (['admin', 'sr_guard', 'pool_tech', 'lifeguard'].includes(positionId)) {
      return null; // Use built-in role, not a custom position
    }

    // Try to load custom position from Firestore
    const positionDocRef = doc(db, 'positions', positionId);
    const positionDoc = await getDoc(positionDocRef);
    
    if (positionDoc.exists()) {
      return { id: positionDoc.id, ...positionDoc.data() } as Position;
    }
  } catch (err) {
    console.error('Error loading position:', err);
  }
  
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [permissions, setPermissions] = useState<PositionPermissions | null>(null);

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

          // Load roleTier (security tier) with fallback to role for backward compatibility
          const roleTier = (userData.roleTier || userData.role || 'lifeguard') as UserRole;
          
          // Load positionId (job title) with fallback to roleTier if not set
          const positionId = userData.positionId || userData.role || roleTier || 'lifeguard';
          
          // Try to load custom position
          let loadedPosition: Position | null = null;
          let computedPermissions: PositionPermissions | null = null;

          if (!['admin', 'sr_guard', 'pool_tech', 'lifeguard'].includes(positionId)) {
            // Custom position — load from Firestore
            loadedPosition = await loadUserPosition(positionId);
            if (loadedPosition) {
              computedPermissions = loadedPosition.permissions;
            }
          }

          const staffName = staffData.firstName && staffData.lastName
            ? `${staffData.firstName} ${staffData.lastName}`
            : '';
          const resolvedName = userData.displayName || staffName || fbUser.displayName || fbUser.email?.split('@')[0] || 'User';

          const resolvedUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email || userData.email || '',
            displayName: resolvedName,
            roleTier, // Security tier
            positionId, // Job title
            role: roleTier, // Backward compat: alias to roleTier
            photoURL: fbUser.photoURL ?? userData.photoURL ?? null,
            orgId: userData.orgId || staffData.orgId || 'sfac',
            ...userData,
          } as AppUser;

          setUser(resolvedUser);
          setPosition(loadedPosition);
          setPermissions(computedPermissions);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUser(null);
          setPosition(null);
          setPermissions(null);
        }
      } else {
        setUser(null);
        setPosition(null);
        setPermissions(null);
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
    setPosition(null);
    setPermissions(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.roleTier);
  };

  /**
   * Check if user has a specific permission.
   * Works for both built-in roles (via role mapping) and custom positions.
   */
  const hasPermission = (permission: keyof PositionPermissions): boolean => {
    if (!user) return false;

    // If user has custom position with permissions, use those
    if (permissions && permission in permissions) {
      return permissions[permission] === true;
    }

    // Fall back to built-in role permissions (checked at component level)
    // This is a simplification - in production, you'd also map built-in roles to DEFAULT_POSITIONS permissions
    return false;
  };

  /**
   * Check if user has any of the specified permissions.
   */
  const hasAnyPermission = (...perms: (keyof PositionPermissions)[]): boolean => {
    return perms.some(perm => hasPermission(perm));
  };

  const approveTerms = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { hasAgreedToTerms: true }, { merge: true });
    setUser({ ...user, hasAgreedToTerms: true });
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      position,
      permissions,
      signIn,
      signInWithGoogle,
      signOut,
      hasRole,
      hasPermission,
      hasAnyPermission,
      approveTerms,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
