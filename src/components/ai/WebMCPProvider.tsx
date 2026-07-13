
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview WebMCP Tool Provider
 * Exposes site actions to AI agents via the browser's model context.
 */
export function WebMCPProvider() {
  const router = useRouter();

  useEffect(() => {
    // Only proceed if the emerging WebMCP API is available
    if (typeof window !== 'undefined' && 'modelContext' in navigator) {
      const modelContext = (navigator as any).modelContext;

      modelContext.provideContext({
        tools: [
          {
            name: "search_products",
            description: "Search the Prontly Store for specific digital assets or AI prompts.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "The search term" },
                category: { type: "string", description: "Filter by category slug" }
              },
              required: ["query"]
            },
            execute: async ({ query, category }: any) => {
              const path = `/products?q=${encodeURIComponent(query)}${category ? `&category=${category}` : ''}`;
              router.push(path);
              return { success: true, navigated_to: path };
            }
          },
          {
            name: "view_inventory",
            description: "View the full catalog of professional assets.",
            execute: async () => {
              router.push('/products');
              return { success: true, message: "Displaying full catalog." };
            }
          }
        ]
      });
    }
  }, [router]);

  return null; // Invisible provider
}
