import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WishlistClient } from '@/components/store/WishlistClient';
import { generateMeta } from '@/lib/seo/generate-meta';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "My Wishlist",
    description: "Access your saved digital assets and AI prompt packs on Prontly Store.",
    path: '/wishlist',
    noIndex: true // Private page for users, should not be indexed
  });
}

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16">
        <WishlistClient />
      </main>
      <Footer />
    </div>
  );
}
