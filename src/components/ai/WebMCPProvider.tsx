'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview WebMCP Tool Provider
 * Exposes site actions to AI agents via the browser's model context.
 * Implements emerging navigator.modelContext.provideContext() API.
 */
export function WebMCPProvider() {
  const router = useRouter();

  useEffect(() => {
    // Only proceed if the emerging WebMCP API is available
    if (typeof window !== 'undefined' && 'modelContext' in (navigator as any)) {
      try {
        const modelContext = (navigator as any).modelContext;

        modelContext.provideContext({
          tools: [
            {
              name: "search_products",
              description: "Search the Prontly Store for specific digital assets, AI prompts, or technical guides.",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "The term or product name to search for." },
                  category: { type: "string", description: "Optional category slug to narrow the search." }
                },
                required: ["query"]
              },
              execute: async ({ query, category }: any) => {
                const path = `/products?q=${encodeURIComponent(query)}${category ? `&category=${category}` : ''}`;
                router.push(path);
                return { 
                  success: true, 
                  message: `Navigated to search results for: ${query}`,
                  url: path 
                };
              }
            },
            {
              name: "view_full_catalog",
              description: "View the entire collection of professional digital assets.",
              execute: async () => {
                router.push('/products');
                return { success: true, message: "Displaying the full product catalog." };
              }
            }
          ]
        });
        console.log('[WebMCP]: Tools successfully provisioned to browser context.');
      } catch (error) {
        console.warn('[WebMCP]: Initialization deferred:', error);
      }
    }
  }, [router]);

  return null;
}
