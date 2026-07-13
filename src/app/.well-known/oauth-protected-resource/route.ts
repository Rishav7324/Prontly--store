
import { NextResponse } from 'next/server';

/**
 * @fileOverview RFC 9728 OAuth Protected Resource Metadata
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  
  return NextResponse.json({
    resource: `${siteUrl}/api`,
    authorization_servers: [`${siteUrl}/.well-known/openid-configuration`],
    scopes_supported: ["read:products", "read:downloads", "profile", "email"]
  });
}
