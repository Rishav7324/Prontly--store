import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { emailEvents } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Brevo Webhook → logs events to Neon email_events + aggregates in analytics-style counters.
 * Configure webhook URL: https://store.prontly.in/api/email/webhooks
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get('x-mailin-signature') || '';
    const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedB64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    if (signature && signature !== expectedHex && signature !== expectedB64) {
      return NextResponse.json({ processed: false, error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch {
    return NextResponse.json({ processed: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const event: string = payload.event || '';
  try {
    const db = getDb();
    await db.insert(emailEvents).values({
      email: payload.email || null,
      event,
      payload,
    });
    return NextResponse.json({ processed: true });
  } catch (e: any) {
    console.error('[BREVO_WEBHOOK] processing failed:', e.message);
    return NextResponse.json({ processed: false });
  }
}
