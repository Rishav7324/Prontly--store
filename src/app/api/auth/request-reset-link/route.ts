import { NextResponse } from 'next/server';
import { generateResetToken } from '@/lib/otp-utils';
import { sendEmail } from '@/services/email/service';
import { resetLinkTemplate } from '@/services/email/templates';
import { getDb } from '@/lib/db';
import { passwordResetSessions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check user exists in Neon (avoid enumeration - still return success if not found)
    const existing = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length === 0) {
      console.log('Reset link attempt for non-existent user:', email);
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const displayName = existing[0].displayName || 'Creator';
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await getDb().insert(passwordResetSessions).values({
      email: normalizedEmail,
      token: resetToken,
      expiresAt,
      used: false,
    });

    const resetLink = `${SITE}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      type: 'security',
      to: email,
      subject: '🔐 Reset your Prontly password',
      html: resetLinkTemplate(resetLink, displayName),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('RESET_LINK_REQUEST_FAILURE:', error.message);
    return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 500 });
  }
}
