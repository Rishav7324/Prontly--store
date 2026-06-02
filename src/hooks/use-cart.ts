'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analytics } from '@/lib/analytics';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (newItem: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const item = { ...newItem, quantity: 1 };
        analytics.addToCart(item);
        
        set((state) => {
          const existingItem = state.items.find((i) => String(i.id) === String(newItem.id));
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                String(i.id) === String(newItem.id) ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => String(item.id) !== String(id)),
        }));
      },
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            String(item.id) === String(id) ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'prontly-cart-v3',
    }
  )
);
