'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  itemIds: string[];
  toggleItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      itemIds: [],
      toggleItem: (id) => {
        const { itemIds } = get();
        if (itemIds.includes(id)) {
          set({ itemIds: itemIds.filter((itemId) => itemId !== id) });
        } else {
          set({ itemIds: [...itemIds, id] });
        }
      },
      isInWishlist: (id) => get().itemIds.includes(id),
    }),
    {
      name: 'prontly-wishlist',
    }
  )
);
