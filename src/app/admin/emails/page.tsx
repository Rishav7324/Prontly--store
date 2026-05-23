
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
  Megaphone,
  BarChart3,
  CheckCircle2,
  Clock
} from "lucide-react";
import { 
  listTemplates, 
  createResendTemplate, 
  deleteResendTemplate, 
  listResendDomains,
  sendTestEmail,
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
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';

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

  // Stats from Firestore logs
  const eventsQuery = useMemoFirebase(() => db ? query(collection(db, 'email_events'), orderBy('timestamp', 'desc'), limit(100)) : null, [db]);
  const { data: events } = useCollection(eventsQuery);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '<html>\n<body style="font-family: sans-serif; color: #4a5568;">\n  <h1 style="color: #5b52d6;">Welcome to Prontly</h1>\n  <p>Hello {{{name}}},</p>\n  <p>Your journey into the digital ecosystem begins here.</p>\n</body>\n</html>'
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

  const handleSendTest = async (templateId: string) => {
    if (!testEmail) {
      toast({ variant: "destructive", title: "Email Required" });
      return;
    }
    setIsTesting(true);

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
      toast({ title: "Test Sent", description: `Check ${testEmail} inbox.` });
    } else {
      toast({ variant: "destructive", title: "Test Failed", description: res.error });
    }
    setIsTesting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Communication Center</h1>
          <p className="text-muted-foreground">Administer Resend templates, campaigns, and delivery health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh Data
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
                <DialogTitle>Create Branded Template</DialogTitle>
                <DialogDescription>Supports <code>{"{{{variable}}}"}</code> syntax for dynamic personalization.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Internal Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Welcome Series" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Default Subject Line</Label>
                  <Input id="subject" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="Welcome to Prontly Store!" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="html">HTML Layout</Label>
                  <Textarea id="html" value={formData.html} onChange={(e) => setFormData({...formData, html: e.target.value})} className="font-code text-[11px] h-80 bg-black/30 leading-relaxed" required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>Deploy & Publish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start h-12 flex-nowrap overflow-x-auto">
          <TabsTrigger value="templates" className="gap-2 px-6"><Layout className="h-4 w-4" /> Templates</TabsTrigger>
          <TabsTrigger value="audience" className="gap-2 px-6"><Users className="h-4 w-4" /> Subscribers</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 px-6"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="domains" className="gap-2 px-6"><Globe className="h-4 w-4" /> Verified Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && templates.length === 0 ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted/20" />)
            ) : templates.map((template) => (
              <Card key={template.id} className="bg-card/30 border-white/5 overflow-hidden group hover:border-primary/30 transition-all rounded-3xl">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Send className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Test Blast</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <Label className="mb-2 block">Recipient Email</Label>
                            <Input placeholder="name@domain.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleSendTest(template.id)} disabled={isTesting}>Dispatch Now</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if(confirm('Delete template?')) deleteResendTemplate(template.id).then(fetchData); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                  <CardDescription className="text-[10px] font-mono">{template.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-[10px] uppercase border-green-500/20 text-green-500 bg-green-500/5">Production Ready</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card className="bg-card/20 border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5">
              <div>
                <CardTitle>Subscriber Audience</CardTitle>
                <CardDescription>Managed list of verified email contacts from your Resend list.</CardDescription>
              </div>
              <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-xl">
                    <UserPlus className="h-4 w-4" />
                    New Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manual Registration</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateContact} className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label>Primary Email</Label>
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
                      <Button type="submit" disabled={isSaving}>Add to Audience</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-white/5">
                    <TableHead className="pl-8">Recipient</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length > 0 ? contacts.map((contact) => (
                    <TableRow key={contact.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="pl-8 font-medium">{contact.email}</TableCell>
                      <TableCell>{contact.firstName} {contact.lastName}</TableCell>
                      <TableCell>
                        <Badge variant={contact.unsubscribed ? "destructive" : "secondary"} className="text-[9px] uppercase font-bold px-2 py-0.5">
                          {contact.unsubscribed ? "Unsubscribed" : "Subscribed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteContact(contact.id)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                        No active contacts found in the selected audience.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Events', val: events?.length || 0, icon: BarChart3, color: 'text-primary' },
              { label: 'Delivered', val: events?.filter(e => e.type === 'delivered').length || 0, icon: CheckCircle2, color: 'text-green-500' },
              { label: 'Opened', val: events?.filter(e => e.type === 'opened').length || 0, icon: Eye, color: 'text-accent' },
              { label: 'Engagement', val: `${Math.round(((events?.filter(e => e.type === 'clicked').length || 0) / (events?.length || 1)) * 100)}%`, icon: Megaphone, color: 'text-orange-500' },
            ].map((stat, i) => (
              <Card key={i} className="bg-card/30 border-white/5 rounded-3xl">
                <CardContent className="pt-6">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{stat.label}</p>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-3xl font-bold font-headline">{stat.val}</h3>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/20 border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5"><CardTitle>Live Delivery Stream</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-white/5">
                    <TableHead className="pl-8">Event Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((ev) => (
                    <TableRow key={ev.id} className="border-white/5">
                      <TableCell className="pl-8">
                        <Badge className={cn(
                          "uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border-none",
                          ev.type === 'delivered' ? "bg-green-500/10 text-green-500" :
                          ev.type === 'opened' ? "bg-blue-500/10 text-blue-500" :
                          ev.type === 'clicked' ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                        )}>
                          {ev.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{ev.data?.to?.join(', ') || 'System'}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-mono">
                        {ev.timestamp ? new Date(ev.timestamp.toDate()).toLocaleString() : 'Recent'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card className="bg-card/20 border-white/5 rounded-3xl">
            <CardHeader>
              <CardTitle>Infrastructure Verification</CardTitle>
              <CardDescription>Resend domain identity and security validation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-4 w-4 rounded-full", domain.status === 'verified' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]")} />
                    <div>
                      <p className="font-bold text-sm tracking-tight">{domain.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em]">{domain.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[9px] uppercase border-white/10">{domain.region}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                      <a href="https://resend.com/domains" target="_blank"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Screen Preview */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <div className="p-4 border-b bg-muted flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-white"><Layout className="h-4 w-4" /></div>
              <h3 className="font-bold text-black uppercase tracking-tight">{previewTemplate?.name}</h3>
            </div>
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
