import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * @fileOverview Brevo Webhook Integration
 * Handles: delivered, opened (unique_opened), clicked (unique_click),
 * hard_bounce, soft_bounce, spam, blocked, unsubscribed, invalid_email.
 *
 * Configure in Brevo Dashboard → Senders & IP → Webhooks:
 *   URL: https://store.prontly.in/api/email/webhooks
 *   Events: all transactional events
 *
 * Security: verify 'X-Mailin-Signature' HMAC-SHA256 of raw body with BREVO_WEBHOOK_SECRET
 * (signature = hex hmac; some Brevo configs send base64 — both accepted).
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.BREVO_WEBHOOK_SECRET;

  // Signature verification (only enforced when secret is configured)
  if (secret) {
    const signature = req.headers.get('x-mailin-signature') || '';
    const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedB64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    if (signature && signature !== expectedHex && signature !== expectedB64) {
      console.error('[BREVO_WEBHOOK]: Invalid signature rejected');
      return NextResponse.json({ processed: false, error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ processed: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // Brevo webhook payload: { event: 'delivered'|'opened'|..., email, ts, ... }
  const event: string = payload.event || '';
  const email: string = payload.email || '';

  // Map Brevo events to internal analytics counters
  const EVENT_MAP: Record<string, string> = {
    delivered: 'deliveredCount',
    opened: 'openCount',
    unique_opened: 'openCount',
    clicked: 'clickCount',
    unique_clicked: 'clickCount',
    hard_bounce: 'bounceCount',
    soft_bounce: 'bounceCount',
    spam: 'bounceCount',
    blocked: 'bounceCount',
    invalid_email: 'bounceCount',
    unsubscribed: 'unsubscribedCount',
  };

  const db = getAdminDb();

  try {
    // 1. Log the Raw Event
    await db.collection('email_events').add({
      eventId: payload['message-id'] || `${event}-${payload.ts || Date.now()}`,
      type: event,
      data: payload,
      email,
      timestamp: new Date(),
      receivedAt: new Date().toISOString(),
    });

    // 2. Update Aggregated Analytics
    const statsRef = db.collection('email_analytics').doc('global');
    const counter = EVENT_MAP[event];

    const updateData: Record<string, any> = {
      lastUpdatedAt: new Date(),
      totalEvents: incrementField(1),
    };
    if (counter) updateData[counter] = incrementField(1);

    await updateFirestoreStats(statsRef.path, updateData);

    return NextResponse.json({ processed: true });
  } catch (e) {
    console.error('[BREVO_WEBHOOK] processing failed:', e);
    // Return 200 so Brevo doesn't infinitely retry on logic errors
    return NextResponse.json({ processed: false, error: 'Internal logic error' });
  }
}

/* Admin SDK FieldValue helpers (kept local to avoid extra imports at top) */
function incrementField(n: number) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { FieldValue } = require('firebase-admin/firestore');
  return FieldValue.increment(n);
}

async function updateFirestoreStats(path: string, updateData: Record<string, any>) {
  const db = getAdminDb();
  const ref = db.doc(path);
  try {
    await ref.update(updateData);
  } catch {
    // Doc missing — create with seed defaults then re-apply
    await ref.set(
      {
        totalEvents: 0,
        deliveredCount: 0,
        openCount: 0,
        clickCount: 0,
        bounceCount: 0,
        unsubscribedCount: 0,
        ...updateData,
      },
      { merge: true }
    );
  }
}
