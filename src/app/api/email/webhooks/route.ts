
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment, doc } from 'firebase/firestore';

/**
 * @fileOverview Resend Webhook Integration
 * Handles: delivered, opened, clicked, bounced, failed
 * Syncs engagement data back to Firestore for real-time admin analytics.
 */
export async function POST(req: Request) {
  const payload = await req.json();
  const { db } = initializeFirebase();

  try {
    // 1. Log the Raw Event
    await addDoc(collection(db, 'email_events'), {
      eventId: payload.id,
      type: payload.type,
      data: payload.data,
      timestamp: serverTimestamp(),
      receivedAt: new Date().toISOString()
    });

    // 2. Update Aggregated Analytics
    const statsRef = doc(db, 'email_analytics', 'global');
    
    const updateData: Record<string, any> = {
      lastUpdatedAt: serverTimestamp(),
      totalEvents: increment(1)
    };

    if (payload.type === 'email.delivered') updateData.deliveredCount = increment(1);
    if (payload.type === 'email.opened') updateData.openCount = increment(1);
    if (payload.type === 'email.clicked') updateData.clickCount = increment(1);
    if (payload.type === 'email.bounced') updateData.bounceCount = increment(1);

    await updateDoc(statsRef, updateData).catch(async () => {
      // Create doc if it doesn't exist
      await updateDoc(statsRef, {
        totalEvents: 1,
        deliveredCount: 0,
        openCount: 0,
        clickCount: 0,
        bounceCount: 0,
        ...updateData
      });
    });

    return NextResponse.json({ processed: true });
  } catch (e) {
    console.error('Email Webhook processing failed:', e);
    // Silent fail to Resend to prevent infinite retries if logic error
    return NextResponse.json({ processed: false, error: 'Internal logic error' });
  }
}
