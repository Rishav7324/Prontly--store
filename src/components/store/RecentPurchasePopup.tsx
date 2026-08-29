'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

/**
 * @fileOverview Client Component for social proof notifications.
 */
export function RecentPurchasePopup() {
  const [visible, setVisible] = useState(false);
  const [purchase, setPurchase] = useState({ name: "Alex", product: "AI Business Kit", time: "2 mins ago" });
  
  useEffect(() => {
    const names = ["Sarah", "Michael", "Elena", "David", "Priya", "John"];
    const products = ["AI Prompt Pack", "Automation System", "Creator Toolkit", "Business Kit", "Technical Guide"];
    
    const interval = setInterval(() => {
      setPurchase({
        name: names[Math.floor(Math.random() * names.length)],
        product: products[Math.floor(Math.random() * products.length)],
        time: "Just now"
      });
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 animate-in slide-in-from-left-full duration-700 md:bottom-8 md:left-8">
      <div className="bg-white/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-3.5 flex items-center gap-3.5 max-w-xs">
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <ShoppingCart className="h-4.5 w-4.5 text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">
            <span className="text-accent">{purchase.name}</span> just purchased
          </p>
          <p className="text-[11px] text-muted-foreground font-semibold truncate">{purchase.product}</p>
          <p className="text-[9px] text-muted-foreground/80 uppercase font-bold tracking-wider mt-0.5">{purchase.time}</p>
        </div>
      </div>
    </div>
  );
}
