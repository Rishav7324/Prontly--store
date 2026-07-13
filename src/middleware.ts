
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview AI Agent Interoperability Middleware
 * Handles:
 * 1. Markdown Negotiation (Accept: text/markdown)
 * 2. Link Headers for Agent Discovery (RFC 8288)
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = new URL(request.url);

  // 1. Link Headers for Discovery
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  const links = [
    `</.well-known/api-catalog>; rel="api-catalog"`,
    `</.well-known/openid-configuration>; rel="service-desc"`,
    `</about>; rel="service-doc"`,
    `</.well-known/mcp/server-card.json>; rel="mcp-server-card"`
  ];
  response.headers.set('Link', links.join(', '));

  // 2. Markdown Negotiation for Agents
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/markdown') && url.pathname === '/') {
    const markdownContent = `
# Prontly Store Agent Summary
Professional Digital Asset Marketplace.

## Capabilities
- Search high-performance AI prompts and UI kits.
- View itemized technical specifications and licenses.
- Manage digital library via authenticated dashboard.

## Discovery
- API Catalog: ${siteUrl}/.well-known/api-catalog
- Auth Docs: ${siteUrl}/auth.md
- MCP Card: ${siteUrl}/.well-known/mcp/server-card.json
    `.trim();

    return new NextResponse(markdownContent, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Markdown-Tokens': 'true'
      }
    });
  }

  return response;
}

export const config = {
  matcher: ['/', '/api/:path*', '/products/:path*'],
};
