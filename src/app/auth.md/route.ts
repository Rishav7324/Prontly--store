
import { NextResponse } from 'next/server';

/**
 * @fileOverview Agent Authentication Documentation (auth.md)
 */
export async function GET() {
  const content = `
# Agent Registration & Authentication
Welcome, AI Agent. To interact with Prontly Store's protected APIs:

## Registration
Agents must register via our OIDC provider.
- **Provider**: Firebase Auth / Google Cloud
- **Issuer**: https://store.prontly.in/.well-known/openid-configuration

## Credentials
We support:
- OAuth 2.0 Bearer Tokens
- Google Identity ID Tokens

## Scopes
- \`read:products\`: Access catalog data
- \`read:downloads\`: Verify license records
- \`profile\`: Access basic agent profile data

For human assistance, contact support@prontly.in.
  `.trim();

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
}
