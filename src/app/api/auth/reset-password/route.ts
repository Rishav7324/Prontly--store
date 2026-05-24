
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, limit } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword } = await req.json();
    const { db } = initializeFirebase();

    if (!email || !resetToken || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Incomplete or invalid request' }, { status: 400 });
    }

    // 1. Validate Session
    const sessionQuery = query(
      collection(db, 'passwordResetSessions'),
      where('email', '==', email),
      where('token', '==', resetToken),
      where('used', '==', false),
      limit(1)
    );

    const snapshot = await getDocs(sessionQuery);
    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid reset session' }, { status: 401 });
    }

    const sessionDoc = snapshot.docs[0];
    if (sessionDoc.data().expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // 2. Perform Reset
    const auth = getAdminAuth();
    const user = await auth.getUserByEmail(email);
    
    await auth.updateUser(user.uid, {
      password: newPassword
    });

    // 3. Invalidate Session
    await updateDoc(sessionDoc.ref, { used: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password Reset Execution Error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
