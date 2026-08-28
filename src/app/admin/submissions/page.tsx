'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  FileCode,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logAdminAction } from '@/lib/admin-logs';

export default function AdminSubmissions() {
  const { user } = useUser();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: async () => {
      if (!auth?.currentUser) return [];
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/admin/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const handleApprove = async (submission: any) => {
    setProcessingId(submission.id);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: submission.id, isPublished: true }),
      });

      if (!res.ok) throw new Error();

      if (user) {
        logAdminAction({
          adminId: user.uid,
          adminEmail: user.email || 'unknown',
          action: 'UPDATE',
          resourceType: 'PRODUCT',
          resourceId: submission.id,
          details: { action: 'APPROVED_CREATOR_SUBMISSION', name: submission.name },
        });
      }

      toast({ title: "Listing Approved!", description: `"${submission.name}" is now live in the store.` });
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not approve submission." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submission: any) => {
    if (!confirm(`Reject and delete "${submission.name}"?`)) return;
    setProcessingId(submission.id);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: submission.id, action: 'delete' }),
      });

      if (!res.ok) throw new Error();

      toast({ title: "Listing Rejected", description: `"${submission.name}" has been removed.` });
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            COMMUNITY CURATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Creator Submissions Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Review community-submitted prompts, verify quality, and publish to the live storefront.
          </p>
        </div>

        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold bg-accent/10 text-accent rounded-full shrink-0">
          {submissions.length} Pending Approvals
        </Badge>
      </div>

      {/* Submissions List Card */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : submissions.length > 0 ? (
            <div className="divide-y divide-border/60">
              {submissions.map((sub: any) => (
                <div key={sub.id} className="p-5 sm:p-6 space-y-4 hover:bg-muted/20 transition-colors">
                  
                  {/* Top Bar: Name, Price, Category */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-muted border border-border/60 shrink-0 shadow-2xs">
                        <Image
                          src={sub.images?.[0] || 'https://picsum.photos/seed/placeholder/200/200'}
                          alt={sub.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{sub.categorySlug}</span>
                          <Badge variant="outline" className="text-[9px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                            Pending Review
                          </Badge>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground font-headline truncate mt-0.5">{sub.name}</h3>
                        <p className="text-xs font-extrabold text-foreground font-headline">₹{((sub.price || 0) / 100).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(sub)}
                        disabled={processingId === sub.id}
                        className="h-9 rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        {processingId === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                        Approve & Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(sub)}
                        disabled={processingId === sub.id}
                        className="h-9 rounded-xl px-3 text-xs font-semibold text-destructive border-border/80 hover:bg-destructive/10"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {/* Submission Content Preview */}
                  {sub.shortDescription && (
                    <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/50">
                      <strong>Summary:</strong> {sub.shortDescription}
                    </p>
                  )}

                  {sub.description && (
                    <div 
                      className="text-xs text-muted-foreground bg-zinc-950 text-zinc-300 p-3.5 rounded-xl font-mono overflow-x-auto max-h-36"
                      dangerouslySetInnerHTML={{ __html: sub.description }}
                    />
                  )}

                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center p-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-3 opacity-25" />
              <h3 className="text-sm font-bold text-foreground">Queue is Clear</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                No pending creator submissions waiting for moderation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
