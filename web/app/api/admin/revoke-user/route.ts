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
    const { uid } = body as { uid?: string };
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    await adminAuth.updateUser(uid, { disabled: true });

    await adminDb.collection('users').doc(uid).set({ disabled: true, active: false }, { merge: true });
    await adminDb.collection('staff').doc(uid).set({ status: 'inactive', active: false }, { merge: true });

    const histId = `hist_${Date.now()}`;
    await adminDb.collection('history').doc(histId).set({
      id: histId,
      action: 'revoke_access',
      performedBy: decoded.uid,
      performedByName: requesterSnap.data()?.displayName || 'Admin',
      performedAt: new Date().toISOString(),
      description: `Revoked access for ${uid}`,
      targetId: uid,
      targetName: uid,
      orgId: requesterSnap.data()?.orgId || 'sfac',
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Revoke user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to revoke user' }, { status: 500 });
  }
}
