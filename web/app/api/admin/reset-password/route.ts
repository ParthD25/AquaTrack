import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

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
    const { uid, email } = body as { uid?: string; email?: string };

    if (!uid && !email) {
      return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
    }

    let resolvedEmail = email || '';
    if (!resolvedEmail && uid) {
      const userRecord = await adminAuth.getUser(uid);
      resolvedEmail = userRecord.email || '';
    }

    if (!resolvedEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 400 });
    }

    const resetLink = await adminAuth.generatePasswordResetLink(resolvedEmail);

    if (uid) {
      await adminDb.collection('users').doc(uid).set({ mustResetPassword: true }, { merge: true });
    }

    const histId = `hist_${Date.now()}`;
    await adminDb.collection('history').doc(histId).set({
      id: histId,
      action: 'reset_password',
      performedBy: decoded.uid,
      performedByName: requesterSnap.data()?.displayName || 'Admin',
      performedAt: new Date().toISOString(),
      description: `Generated password reset for ${resolvedEmail}`,
      targetId: uid || '',
      targetName: resolvedEmail,
      orgId: requesterSnap.data()?.orgId || 'sfac',
    });

    return NextResponse.json({ resetLink });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
