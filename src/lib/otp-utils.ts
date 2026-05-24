
import { createHash, randomInt } from 'crypto';

/**
 * Generates a secure 6-digit numeric OTP.
 */
export function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Hashes an OTP for secure storage in Firestore.
 */
export function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

/**
 * Generates a long secure random token for the reset session.
 */
export function generateResetToken(): string {
  return Array.from({ length: 48 }, () => Math.random().toString(36)[2]).join('');
}
