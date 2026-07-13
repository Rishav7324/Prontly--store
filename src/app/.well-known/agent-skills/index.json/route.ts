
import { NextResponse } from 'next/server';

/**
 * @fileOverview Agent Skills Discovery Index
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  
  return NextResponse.json({
    $schema: "https://agentskills.io/schema/v0.2.0/index.json",
    skills: [
      {
        name: "product-discovery",
        type: "api",
        description: "Enables agents to search and filter the digital asset catalog.",
        url: `${siteUrl}/api/products`
      },
      {
        name: "license-verification",
        type: "api",
        description: "Enables agents to verify ownership of digital assets.",
        url: `${siteUrl}/api/user/downloads`
      }
    ]
  });
}
