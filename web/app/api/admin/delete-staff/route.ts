import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifyIdToken(token);
    const requesterSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const requesterRole = requesterSnap.exists ? requesterSnap.data()?.role : null;
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing staff UID' }, { status: 400 });
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete staff doc
    await adminDb.collection('staff').doc(uid).delete();

    // Delete users doc
    await adminDb.collection('users').doc(uid).delete();

    // Delete related audits
    const auditSnap = await adminDb.collection('audits').where('staffId', '==', uid).get();
    const batch = adminDb.batch();
    auditSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Log action
    const histId = `hist_${Date.now()}`;
    await adminDb.collection('history').doc(histId).set({
      id: histId,
      action: 'remove_staff',
      performedBy: decoded.uid,
      performedByName: requesterSnap.data()?.displayName || 'Admin',
      performedAt: new Date().toISOString(),
      description: `Deleted staff member (UID: ${uid})`,
      targetId: uid,
      orgId: 'sfac'
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Failed to delete staff' }, { status: 500 });
  }
}
