import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Per authenticated user: 10 downloads per hour
export const userDownloadLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:download:user',
}) : null;

// Per IP address: 20 download attempts per hour
export const ipDownloadLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'rl:download:ip',
}) : null;

// Per product per user: prevent hammering one product
export const productDownloadLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix: 'rl:download:product',
}) : null;

/**
 * ─── Check All Rate Limits ────────────────────────────────────────────────────
 */
export async function checkDownloadRateLimits(params: {
  userId: string;
  ip: string;
  productId: string;
}): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
  if (!redis || !userDownloadLimiter || !ipDownloadLimiter || !productDownloadLimiter) {
    return { allowed: true }; // Fallback if Redis not configured
  }

  const [userResult, ipResult, productResult] = await Promise.all([
    userDownloadLimiter.limit(params.userId),
    ipDownloadLimiter.limit(params.ip),
    productDownloadLimiter.limit(`${params.userId}:${params.productId}`),
  ]);

  if (!userResult.success) {
    return {
      allowed: false,
      retryAfter: Math.ceil((userResult.reset - Date.now()) / 1000),
      reason: 'User download limit exceeded (10/hour)',
    };
  }
  if (!ipResult.success) {
    return {
      allowed: false,
      retryAfter: Math.ceil((ipResult.reset - Date.now()) / 1000),
      reason: 'IP download limit exceeded',
    };
  }
  if (!productResult.success) {
    return {
      allowed: false,
      retryAfter: Math.ceil((productResult.reset - Date.now()) / 1000),
      reason: 'Too many attempts on this product — wait 10 minutes',
    };
  }

  return { allowed: true };
}