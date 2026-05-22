
"use client";

import Link from "next/link";
import { ShoppingCart, Search, User, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-foreground">
              PRONTLY <span className="text-primary">STORE</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/categories" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Browse</Link>
            <Link href="/prompts" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">AI Prompts</Link>
            <Link href="/templates" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Templates</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">0</span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard">
            <Button size="sm" className="hidden md:flex items-center gap-2">
              <User className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
