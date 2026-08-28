'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  productId?: string;
  productName?: string;
  price?: number;
  quantity?: number;
}

interface OrderData {
  id?: string;
  totalAmount?: number;
  status?: string;
  items?: OrderItem[];
  invoicePdfBase64?: string | null;
}

function downloadInvoice(base64: string, orderId: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { user } = useUser();

  // Fetch the signed-in user's orders (Neon via API) and locate this order
  const { data: order, isLoading } = useQuery<OrderData | null>({
    queryKey: ['user-orders', user?.uid ?? '', orderId],
    queryFn: async () => {
      const token = user ? await user.getIdToken() : '';
      const res = await fetch('/api/user/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!json?.success || !Array.isArray(json.data)) return null;
      return (json.data as OrderData[]).find((o) => o.id === orderId) ?? null;
    },
    enabled: !!orderId && !!user,
  });

  if (!user || isLoading || !order) {
    return (
      <div className="flex h-[55vh] max-h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start sm:items-center justify-center overflow-hidden px-4 py-10">
      <div className="w-full max-w-[calc(100vw-32px)] md:max-w-md rounded-t-[2rem] rounded-b-xl md:rounded-[3rem] border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />

          <h1 className="mt-3 text-lg font-semibold tracking-tight">Payment Successful</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Thank you for your purchase. Your assets are ready.
          </p>

          <div className="mt-4 w-full rounded-lg bg-muted/40 px-4 py-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono font-medium">{(order.id || orderId)?.slice(-8)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold">
                ₹{((order.totalAmount || 0) / 100).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <ul className="mt-4 w-full divide-y divide-border/60 text-left">
              {order.items.map((item, index) => (
                <li key={item.productId || index} className="py-2 flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate font-medium">{item.productName}</span>
                  <span className="shrink-0 text-muted-foreground">× {item.quantity ?? 1}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 grid w-full grid-cols-1 gap-2">
            <Button asChild className="h-10 rounded-lg w-full sm:w-auto font-medium">
              <Link href="/dashboard/downloads">Go to My Downloads</Link>
            </Button>

            {order.invoicePdfBase64 ? (
              <Button
                variant="outline"
                className="h-10 rounded-lg w-full sm:w-auto"
                onClick={() => downloadInvoice(order.invoicePdfBase64 as string, orderId || '')}
              >
                <FileDown className="mr-2 h-4 w-4" />
                View invoice
              </Button>
            ) : null}

            <Button variant="ghost" asChild className="h-10 rounded-lg w-full sm:w-auto text-xs">
              <Link href="/products">Back to store</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex h-[55vh] max-h-[600px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
