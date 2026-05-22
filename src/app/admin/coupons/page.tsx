'use client';

import { useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Ticket, 
  Trash2, 
  Calendar,
  Percent,
  Banknote
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

export default function AdminCoupons() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const db = useFirestore();
  
  const couponsQuery = db ? query(collection(db, 'coupons'), orderBy('createdAt', 'desc')) : null;
  const { data: coupons, loading } = useCollection(couponsQuery);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: 0,
    minOrderAmount: 0,
    expiresAt: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    await addDoc(collection(db, 'coupons'), {
      ...formData,
      code: formData.code.toUpperCase(),
      isActive: true,
      usageCount: 0,
      createdAt: serverTimestamp()
    });

    setIsModalOpen(false);
    setFormData({ code: '', type: 'percentage', value: 0, minOrderAmount: 0, expiresAt: '' });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm('Delete this coupon code?')) return;
    await deleteDoc(doc(db, 'coupons', id));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and promotional campaigns.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promotional Coupon</DialogTitle>
              <DialogDescription>Discount codes apply at the checkout page.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  placeholder="SUMMER25"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <select 
                    id="type"
                    className="bg-background border rounded h-10 px-3 outline-none focus:ring-1 focus:ring-primary"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Discount Value</Label>
                  <Input 
                    id="value" 
                    type="number"
                    value={formData.value} 
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} 
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minOrder">Min Order Amount (₹)</Label>
                <Input 
                  id="minOrder" 
                  type="number"
                  value={formData.minOrderAmount} 
                  onChange={(e) => setFormData({...formData, minOrderAmount: Number(e.target.value)})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input 
                  id="expiry" 
                  type="date"
                  value={formData.expiresAt} 
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})} 
                />
              </div>
              <DialogFooter>
                <Button type="submit">Activate Coupon</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))
        ) : coupons?.map((coupon: any) => (
          <Card key={coupon.id} className="relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-primary" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-code text-lg py-1 px-3 border-dashed border-primary/50 text-primary">
                  {coupon.code}
                </Badge>
                <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(coupon.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-2xl mt-4">
                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Percent className="h-3 w-3" />
                  <span>Min Order: ₹{coupon.minOrderAmount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {coupon.expiresAt ? format(new Date(coupon.expiresAt), 'PPP') : 'Never'}</span>
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="font-bold text-foreground">{coupon.usageCount || 0} uses</span>
                  <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && coupons?.length === 0 && (
        <div className="flex h-60 flex-col items-center justify-center text-center p-8 border rounded-xl bg-card">
          <Ticket className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-bold font-headline">No coupons active</h3>
          <p className="text-muted-foreground mb-6">Create promotional codes to boost your store sales.</p>
        </div>
      )}
    </div>
  );
}