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

    const { staffId, certType, expiryDate } = await req.json();
    if (!staffId || !certType) {
      return NextResponse.json({ error: 'Missing staffId or certType' }, { status: 400 });
    }

    // Update staff certs
    const certData: Record<string, any> = {
      [`certs.${certType}`]: {
        name: certType,
        expiryDate: expiryDate || null,
        addedDate: new Date().toISOString().slice(0, 10),
        addedBy: requesterSnap.data()?.displayName || 'Admin'
      }
    };

    await adminDb.collection('staff').doc(staffId).set(certData, { merge: true });

    // Log action
    const histId = `hist_${Date.now()}`;
    await adminDb.collection('history').doc(histId).set({
      id: histId,
      action: 'update_cert',
      performedBy: decoded.uid,
      performedByName: requesterSnap.data()?.displayName || 'Admin',
      performedAt: new Date().toISOString(),
      description: `Updated ${certType} cert for staff member ${staffId}, expires: ${expiryDate || 'N/A'}`,
      targetId: staffId,
      orgId: 'sfac'
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Failed to update certs' }, { status: 500 });
  }
}
