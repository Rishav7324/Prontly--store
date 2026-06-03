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
      <div className="bg-white/80 backdrop-blur-xl border border-stone-gray/10 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-xs">
        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-midnight-ink">
            <span className="text-primary">{purchase.name}</span> just purchased
          </p>
          <p className="text-[10px] text-slate-blue font-medium truncate">{purchase.product}</p>
          <p className="text-[9px] text-ghost-gray uppercase font-black tracking-widest mt-0.5">{purchase.time}</p>
        </div>
      </div>
    </div>
  );
}
