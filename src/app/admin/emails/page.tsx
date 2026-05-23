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
  Send,
  Eye,
  Copy,
  Users,
  UserPlus,
  UserX,
  Check
} from "lucide-react";
import { 
  listTemplates, 
  createResendTemplate, 
  deleteResendTemplate, 
  listResendDomains,
  sendTestEmail,
  duplicateResendTemplate,
  listResendAudiences,
  listResendContacts,
  createResendContact,
  deleteResendContact
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function AdminEmailsPage() {
  const db = useFirestore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '<html>\n<body style="font-family: sans-serif;">\n  <h1>Welcome to Prontly</h1>\n  <p>Hello {{{name}}},</p>\n  <p>Your journey begins here.</p>\n</body>\n</html>'
  });

  const [contactData, setContactData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes, aRes] = await Promise.all([
        listTemplates(), 
        listResendDomains(),
        listResendAudiences()
      ]);
      
      if (tRes.success) setTemplates(tRes.data);
      if (dRes.success) setDomains(dRes.data);
      if (aRes.success) {
        setAudiences(aRes.data);
        if (aRes.data.length > 0) setSelectedAudience(aRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    if (!selectedAudience) return;
    setLoading(true);
    const res = await listResendContacts(selectedAudience);
    if (res.success) setContacts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAudience) fetchContacts();
  }, [selectedAudience]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await createResendTemplate(formData);
    if (res.success) {
      toast({ title: "Template Published" });
      setIsModalOpen(false);
      setFormData({ name: '', subject: '', html: '' });
      fetchData();
    } else {
      toast({ variant: "destructive", title: "Failed", description: res.error });
    }
    setIsSaving(false);
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudience) return;
    setIsSaving(true);
    const res = await createResendContact({ ...contactData, audienceId: selectedAudience });
    if (res.success) {
      toast({ title: "Contact Created" });
      setIsContactModalOpen(false);
      setContactData({ email: '', firstName: '', lastName: '' });
      fetchContacts();
    } else {
      toast({ variant: "destructive", title: "Failed", description: res.error });
    }
    setIsSaving(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedAudience || !confirm('Remove this contact?')) return;
    const res = await deleteResendContact(selectedAudience, contactId);
    if (res.success) {
      toast({ title: "Contact Removed" });
      fetchContacts();
    }
  };

  const handleDuplicate = async (id: string) => {
    toast({ title: "Duplicating..." });
    const res = await duplicateResendTemplate(id);
    if (res.success) {
      toast({ title: "Template Duplicated" });
      fetchData();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await deleteResendTemplate(id);
    if (res.success) {
      toast({ title: "Template Removed" });
      fetchData();
    }
  };

  const handleSendTest = async (templateId: string) => {
    if (!testEmail) {
      toast({ variant: "destructive", title: "Email Required" });
      return;
    }
    setIsTesting(true);

    // Sanitize settings for Server Action
    const plainEmailSettings = settings?.emailSettings ? {
      fromEmail: settings.emailSettings.fromEmail,
      senderName: settings.emailSettings.senderName
    } : undefined;

    const res = await sendTestEmail({
      to: testEmail,
      subject: 'Prontly Template Test',
      templateId,
      sender: plainEmailSettings
    });

    if (res.success) {
      toast({ title: "Test Sent", description: `Check ${testEmail}` });
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
          <p className="text-muted-foreground">Administer Resend templates, audience contacts, and delivery health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
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
                <DialogTitle>Create Template</DialogTitle>
                <DialogDescription>Use <code>{"{{{variable}}}"}</code> for dynamic fields.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Default Subject</Label>
                  <Input id="subject" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="html">HTML Content</Label>
                  <Textarea id="html" value={formData.html} onChange={(e) => setFormData({...formData, html: e.target.value})} className="font-code text-[10px] h-60 bg-black/30" required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>Create & Publish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start h-12">
          <TabsTrigger value="templates" className="gap-2 px-6"><Layout className="h-4 w-4" /> Templates</TabsTrigger>
          <TabsTrigger value="audience" className="gap-2 px-6"><Users className="h-4 w-4" /> Audience</TabsTrigger>
          <TabsTrigger value="domains" className="gap-2 px-6"><Globe className="h-4 w-4" /> Domains</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 px-6"><Code2 className="h-4 w-4" /> Connection</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && templates.length === 0 ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted/20" />)
            ) : templates.map((template) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(template.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Send className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Test</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <Input placeholder="Recipient Email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleSendTest(template.id)} disabled={isTesting}>Dispatch Test</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-[10px] uppercase border-white/10 text-green-500 bg-green-500/5">Published</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card className="bg-card/20 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audience Contacts</CardTitle>
                <CardDescription>Manage subscribers in your Resend list.</CardDescription>
              </div>
              <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Contact</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateContact} className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label>Email Address</Label>
                      <Input type="email" value={contactData.email} onChange={(e) => setContactData({...contactData, email: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>First Name</Label>
                        <Input value={contactData.firstName} onChange={(e) => setContactData({...contactData, firstName: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Last Name</Label>
                        <Input value={contactData.lastName} onChange={(e) => setContactData({...contactData, lastName: e.target.value})} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSaving}>Add to List</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-white/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length > 0 ? contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.email}</TableCell>
                        <TableCell>{contact.firstName} {contact.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={contact.unsubscribed ? "destructive" : "secondary"}>
                            {contact.unsubscribed ? "Unsubscribed" : "Subscribed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteContact(contact.id)}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No contacts found in this audience.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card className="bg-card/20 border-white/5">
            <CardHeader>
              <CardTitle>Verified Domains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-3 w-3 rounded-full", domain.status === 'verified' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]")} />
                    <div>
                      <p className="font-bold text-sm">{domain.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{domain.status}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">{domain.region}</Badge>
                </div>
              ))}
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
            <CardContent>
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
