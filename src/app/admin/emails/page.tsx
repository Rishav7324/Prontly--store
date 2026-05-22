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
  Loader2,
  FileCode,
  Layout,
  AlertCircle,
  Send,
  Eye,
  Copy,
  Wand2
} from "lucide-react";
import { 
  listTemplates, 
  createResendTemplate, 
  deleteResendTemplate, 
  listResendDomains,
  sendTestEmail,
  duplicateResendTemplate
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
import { cn } from '@/lib/utils';

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '<html>\n<body style="font-family: sans-serif;">\n  <h1>Welcome to Prontly</h1>\n  <p>Hello {{{name}}},</p>\n  <p>Your journey begins here.</p>\n</body>\n</html>'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([listTemplates(), listResendDomains()]);
      
      if (tRes.success) setTemplates(tRes.data);
      else if (tRes.error !== 'API Key missing') toast({ variant: "destructive", title: "Templates Error", description: tRes.error });
      
      if (dRes.success) setDomains(dRes.data);
      else if (dRes.error !== 'API Key missing') toast({ variant: "destructive", title: "Domains Error", description: dRes.error });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await createResendTemplate(formData);
    if (res.success) {
      toast({ title: "Template Published", description: "Successfully synced and published to Resend." });
      setIsModalOpen(false);
      setFormData({ name: '', subject: '', html: '' });
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Creation Failed", description: res.error });
    }
    setIsSaving(false);
  };

  const handleDuplicate = async (id: string) => {
    toast({ title: "Duplicating...", description: "Creating a copy of the template." });
    const res = await duplicateResendTemplate(id);
    if (res.success) {
      toast({ title: "Template Duplicated" });
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Duplication Failed", description: res.error });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template permanently from Resend?')) return;
    const res = await deleteResendTemplate(id);
    if (res.success) {
      toast({ title: "Template Removed" });
      fetchData();
    }
  };

  const handleSendTest = async (templateId: string) => {
    if (!testEmail) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter a destination email." });
      return;
    }
    setIsTesting(true);
    const res = await sendTestEmail({
      to: testEmail,
      subject: 'Prontly Template Test',
      templateId
    });
    if (res.success) {
      toast({ title: "Test Sent", description: `Check ${testEmail} for the preview.` });
    } else {
      toast({ variant: "destructive", title: "Test Failed", description: res.error });
    }
    setIsTesting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Email Control Center</h1>
          <p className="text-muted-foreground">Administer Resend services, templates, and delivery health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Create Resend Template</DialogTitle>
                <DialogDescription>Define a reusable HTML template with variable support (e.g. <code>{"{{{name}}}"}</code>).</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="order-confirmation"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Default Subject Line</Label>
                  <Input 
                    id="subject" 
                    value={formData.subject} 
                    onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                    placeholder="Your order is confirmed!"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="html">HTML Payload</Label>
                  <Textarea 
                    id="html" 
                    value={formData.html} 
                    onChange={(e) => setFormData({...formData, html: e.target.value})} 
                    className="font-code text-[10px] h-60 bg-black/30"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Create & Publish
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start h-12">
          <TabsTrigger value="templates" className="gap-2 px-6"><Layout className="h-4 w-4" /> My Templates</TabsTrigger>
          <TabsTrigger value="domains" className="gap-2 px-6"><Globe className="h-4 w-4" /> Domains</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 px-6"><Code2 className="h-4 w-4" /> Connection</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted/20" />)
            ) : templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} className="bg-card/30 border-white/5 overflow-hidden group hover:border-primary/30 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleDuplicate(template.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                              <Send className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Test Email</DialogTitle>
                              <DialogDescription>Verify "{template.name}" in your inbox.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid gap-2">
                                <Label>Recipient Email</Label>
                                <Input 
                                  placeholder="you@example.com" 
                                  value={testEmail} 
                                  onChange={(e) => setTestEmail(e.target.value)} 
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleSendTest(template.id)} disabled={isTesting}>
                                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                Dispatch Test
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    <CardDescription className="text-[10px] font-mono opacity-50">{template.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline" className="text-[10px] uppercase border-white/10 text-green-500 bg-green-500/5">Published</Badge>
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary text-xs" asChild>
                        <a href={`https://resend.com/templates/${template.id}`} target="_blank">View in Console <ExternalLink className="ml-1 h-3 w-3" /></a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full py-20 flex flex-col items-center justify-center border-dashed border-2 bg-muted/5 border-white/5">
                <Mail className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-xl font-bold">No Templates Found</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-xs text-sm">Create your first template to start using automated Resend transactional flows.</p>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>Initialize First Template</Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card className="bg-card/20 border-white/5">
            <CardHeader>
              <CardTitle>Verified Sending Domains</CardTitle>
              <CardDescription>Configure these in your Resend Dashboard to ensure high deliverability.</CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length > 0 ? (
                <div className="space-y-4">
                  {domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-3 w-3 rounded-full", domain.status === 'verified' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]")} />
                        <div>
                          <p className="font-bold text-sm">{domain.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{domain.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px] uppercase">{domain.region}</Badge>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <a href={`https://resend.com/domains/${domain.id}`} target="_blank"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-muted/5 rounded-2xl border border-dashed border-white/10">
                  <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-muted-foreground">No domains configured in Resend yet.</p>
                  <Button variant="link" asChild className="mt-2">
                    <a href="https://resend.com/domains" target="_blank">Add Domain in Resend</a>
                  </Button>
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
                API Connectivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Node.js SDK Status</p>
                  <div className="flex items-center gap-2 text-xs text-green-500 font-medium">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    v4.x Integration Active
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-none">CONNECTED</Badge>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Environment Config</Label>
                <div className="rounded-lg bg-black/60 p-4 font-mono text-[10px] flex items-center justify-between">
                  <span className="text-muted-foreground">RESEND_API_KEY</span>
                  <span className="text-foreground">{process.env.RESEND_API_KEY ? 're_••••••••' + process.env.RESEND_API_KEY.slice(-4) : <span className="text-destructive font-bold">NOT CONFIGURED</span>}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white">
          <div className="p-4 border-b bg-muted flex items-center justify-between">
            <h3 className="font-bold text-black">Preview: {previewTemplate?.name}</h3>
            <Badge className="bg-primary">{previewTemplate?.id}</Badge>
          </div>
          <div className="flex-1 bg-white">
            <iframe 
              srcDoc={previewTemplate?.html} 
              title="Template Preview"
              className="w-full h-full border-none"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
