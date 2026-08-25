'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Ticket, 
  Trash2, 
  Calendar,
  Percent
} from 'lucide-react';
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
  
  const couponsQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'coupons'), orderBy('createdAt', 'desc')) : null;
  }, [db]);

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
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Coupons</h1>
          <p className="text-xs text-muted-foreground">Manage discount codes and promotional campaigns.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 rounded-lg">
              <Plus className="mr-2 h-4 w-4" />
              New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promotional Coupon</DialogTitle>
              <DialogDescription>Discount codes apply at the checkout page.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="code" className="text-[10px] font-medium text-muted-foreground">Coupon Code</Label>
                <Input 
                  id="code" 
                  className="h-9 rounded-lg"
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  placeholder="SUMMER25"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="type" className="text-[10px] font-medium text-muted-foreground">Type</Label>
                  <select 
                    id="type"
                    className="bg-background border rounded-lg h-9 px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="value" className="text-[10px] font-medium text-muted-foreground">Discount Value</Label>
                  <Input 
                    id="value" 
                    className="h-9 rounded-lg"
                    type="number"
                    value={formData.value} 
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} 
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="minOrder" className="text-[10px] font-medium text-muted-foreground">Min Order Amount (₹)</Label>
                <Input 
                  id="minOrder" 
                  className="h-9 rounded-lg"
                  type="number"
                  value={formData.minOrderAmount} 
                  onChange={(e) => setFormData({...formData, minOrderAmount: Number(e.target.value)})} 
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="expiry" className="text-[10px] font-medium text-muted-foreground">Expiry Date</Label>
                <Input 
                  id="expiry" 
                  className="h-9 rounded-lg"
                  type="date"
                  value={formData.expiresAt} 
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})} 
                />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" className="h-8 rounded-lg">Activate Coupon</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="h-36 animate-pulse bg-muted rounded-xl shadow-sm" />
          ))
        ) : coupons?.map((coupon: any) => (
          <Card key={coupon.id} className="relative overflow-hidden group rounded-xl shadow-sm p-4">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="font-mono text-sm py-1 px-2.5 border-dashed border-primary/50 text-primary">
                  {coupon.code}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(coupon.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold">
                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
              </h3>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Percent className="h-3 w-3" />
                  <span>Min Order: ₹{coupon.minOrderAmount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {coupon.expiresAt ? format(new Date(coupon.expiresAt), 'PP') : 'Never'}</span>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{coupon.usageCount || 0} uses</span>
                  <Badge variant={coupon.isActive ? 'default' : 'secondary'} className="text-[10px] font-medium">
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && coupons?.length === 0 && (
        <Card className="rounded-xl shadow-sm p-4">
          <div className="flex h-52 flex-col items-center justify-center text-center p-6">
            <Ticket className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
            <h3 className="text-sm font-semibold">No coupons active</h3>
            <p className="text-xs text-muted-foreground mt-1">Create promotional codes to boost your store sales.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
