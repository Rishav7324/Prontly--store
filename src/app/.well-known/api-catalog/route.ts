
import { NextResponse } from 'next/server';

/**
 * @fileOverview RFC 9727 API Catalog
 * Enables autonomous agents to discover technical endpoints.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  const catalog = {
    linkset: [
      {
        anchor: `${siteUrl}/api/products`,
        "service-doc": [{ href: `${siteUrl}/about` }],
        "status": [{ href: `${siteUrl}/api/health` }],
        "title": "Product Catalog API"
      },
      {
        anchor: `${siteUrl}/api/user/downloads`,
        "service-doc": [{ href: `${siteUrl}/dashboard/downloads` }],
        "title": "Secure Asset Vault API"
      }
    ]
  };

  return NextResponse.json(catalog, {
    headers: {
      'Content-Type': 'application/linkset+json'
    }
  });
}
