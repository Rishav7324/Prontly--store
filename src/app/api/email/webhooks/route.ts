
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Resend Webhook Handler
 * Tracks: Delivered, Opened, Clicked, Bounced, Failed
 */
export async function POST(req: Request) {
  const payload = await req.json();
  const { db } = initializeFirebase();

  try {
    // Record the event in Firestore for analytics
    await addDoc(collection(db, 'email_events'), {
      eventId: payload.id,
      type: payload.type,
      data: payload.data,
      timestamp: serverTimestamp(),
      receivedAt: new Date().toISOString()
    });

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook processing failed:', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
