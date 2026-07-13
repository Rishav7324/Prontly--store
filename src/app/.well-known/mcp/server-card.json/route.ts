
import { NextResponse } from 'next/server';

/**
 * @fileOverview MCP Server Card (Model Context Protocol)
 * Enables agents to discover site tools and context.
 */
export async function GET() {
  return NextResponse.json({
    serverInfo: {
      name: "Prontly Store Connector",
      version: "1.0.0"
    },
    transport: {
      type: "https",
      endpoint: "/api/mcp"
    },
    capabilities: {
      tools: true,
      resources: true
    }
  });
}
