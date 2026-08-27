import { ReactNode } from 'react';

/**
 * Dashboard Layout — premium compact shell
 * - Keeps Navbar/Footer in pages for backward compat, but enforces overflow handling
 * - Ensures consistent max-width and overflow isolation for all /dashboard/* routes
 * - Pages themselves use pt-20 md:pt-24 consistently; layout must not add extra padding
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden min-w-0">
      <div className="min-w-0 overflow-x-hidden">{children}</div>
    </div>
  );
}
