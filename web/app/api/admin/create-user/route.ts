import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 12; i += 1) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifyIdToken(tokenMatch[1]);
    const requesterSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const requesterRole = requesterSnap.exists ? requesterSnap.data()?.role : null;
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      roleTier,
      positionId,
      phone,
      address,
      isHighSchool,
      gradYear,
      orgId = 'sfac',
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate roleTier (security tier) — must be one of four built-in values
    const allowedRoles = ['admin', 'sr_guard', 'pool_tech', 'lifeguard'];
    const finalRoleTier = (roleTier && allowedRoles.includes(roleTier)) ? roleTier : 'lifeguard';
    
    // positionId defaults to roleTier if not specified (can be custom or built-in)
    const finalPositionId = positionId || finalRoleTier;

    const tempPassword = generateTempPassword();
    const userRecord = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: `${firstName} ${lastName}`,
      disabled: false,
    });

    // Write both roleTier (security) and positionId (job title)
    // During transition period, also write 'role' for backward compatibility
    const userDoc = {
      uid: userRecord.uid,
      email,
      displayName: `${firstName} ${lastName}`,
      roleTier: finalRoleTier, // NEW: security tier only
      positionId: finalPositionId, // NEW: job title (can be custom)
      role: finalRoleTier, // Legacy compat: will remove after transition
      orgId,
      hasAgreedToTerms: false,
      mustResetPassword: true,
      createdAt: new Date().toISOString(),
      createdBy: decoded.uid,
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });

    await adminDb.collection('staff').doc(userRecord.uid).set({
      id: userRecord.uid,
      firstName,
      lastName,
      positionId: finalPositionId,
      email,
      phone: phone || '',
      address: address || '',
      active: true,
      visible: true,
      isHighSchool: !!isHighSchool,
      gradYear: gradYear || null,
      status: 'active',
      orgId,
      createdAt: new Date().toISOString(),
      createdBy: decoded.uid,
    }, { merge: true });

    const histId = `hist_${Date.now()}`;
    await adminDb.collection('history').doc(histId).set({
      id: histId,
      action: 'add_staff',
      performedBy: decoded.uid,
      performedByName: requesterSnap.data()?.displayName || 'Admin',
      performedAt: new Date().toISOString(),
      description: `Added staff member ${firstName} ${lastName}`,
      targetId: userRecord.uid,
      targetName: `${firstName} ${lastName}`,
      orgId,
    });

    const resetLink = await adminAuth.generatePasswordResetLink(email);

    return NextResponse.json({
      uid: userRecord.uid,
      tempPassword,
      resetLink,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
