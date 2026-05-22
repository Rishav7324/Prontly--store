'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Code2, 
  Globe, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Loader2,
  FileCode,
  Layout,
  AlertCircle
} from "lucide-react";
import { 
  listTemplates, 
  createResendTemplate, 
  deleteResendTemplate, 
  listResendDomains 
} from '@/app/actions/resend-actions';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '<html><body><h1>New Template</h1><p>Start writing your content here...</p></body></html>'
  });

  const fetchData = async () => {
    setLoading(true);
    const [tRes, dRes] = await Promise.all([listTemplates(), listResendDomains()]);
    
    if (tRes.success) setTemplates(tRes.data);
    else toast({ variant: "destructive", title: "Error", description: tRes.error });
    
    if (dRes.success) setDomains(dRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await createResendTemplate(formData);
    if (res.success) {
      toast({ title: "Template Created", description: "Successfully synced with Resend." });
      setIsModalOpen(false);
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Creation Failed", description: res.error });
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template from Resend?')) return;
    const res = await deleteResendTemplate(id);
    if (res.success) {
      toast({ title: "Template Removed" });
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Email Management</h1>
          <p className="text-muted-foreground">Administer Resend services, templates, and delivery domains.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Sync Resend
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Resend Template</DialogTitle>
                <DialogDescription>Define a reusable HTML template for automated workflows.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Template Name (Unique)</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. welcome-onboarding"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input 
                    id="subject" 
                    value={formData.subject} 
                    onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                    placeholder="Welcome to Prontly!"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="html">HTML Payload</Label>
                  <Textarea 
                    id="html" 
                    value={formData.html} 
                    onChange={(e) => setFormData({...formData, html: e.target.value})} 
                    className="font-code text-xs h-60"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Publish to Resend
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="templates" className="gap-2"><Layout className="h-4 w-4" /> Templates</TabsTrigger>
          <TabsTrigger value="domains" className="gap-2"><Globe className="h-4 w-4" /> Domains</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Code2 className="h-4 w-4" /> Account Info</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted" />)
            ) : templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} className="bg-card/30 border-white/5 overflow-hidden group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-xs font-mono">{template.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">Resend SDK V4</Badge>
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                        <a href={`https://resend.com/templates/${template.id}`} target="_blank">View in Console <ExternalLink className="ml-1 h-3 w-3" /></a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full py-20 flex flex-col items-center justify-center border-dashed border-2 bg-muted/5">
                <Mail className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-xl font-bold">No Templates Found</h3>
                <p className="text-muted-foreground mb-6">Create your first template to start using automated Resend flows.</p>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>Get Started</Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Domains</CardTitle>
              <CardDescription>Domains verified for sending emails from your Prontly Store.</CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length > 0 ? (
                <div className="space-y-4">
                  {domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-3 w-3 rounded-full", domain.status === 'verified' ? "bg-green-500" : "bg-yellow-500")} />
                        <div>
                          <p className="font-bold">{domain.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{domain.status}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{domain.region}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                  <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No domains configured in Resend yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SDK Status</Label>
                <div className="flex items-center gap-2 text-sm text-green-500 font-bold">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Resend Node.js SDK Active (v4.1.2)
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-primary/10">
                <Label>Environment Variables</Label>
                <div className="rounded-lg bg-black/40 p-4 font-mono text-xs text-muted-foreground">
                  RESEND_API_KEY: {process.env.RESEND_API_KEY ? '••••••••' + process.env.RESEND_API_KEY.slice(-4) : 'NOT_SET'}
                </div>
                {!process.env.RESEND_API_KEY && (
                  <div className="flex items-center gap-2 text-destructive text-xs mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Emails will not be sent until API key is provided.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
