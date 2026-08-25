
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  RefreshCw,
  Trash2,
  Globe,
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
} from '@/app/actions/brevo-actions';
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
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold font-headline">Communication Center</h1>
          <p className="text-xs text-muted-foreground">Administer Resend templates, campaigns, and delivery health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh Data
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 rounded-lg text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">Create Branded Template</DialogTitle>
                <DialogDescription className="text-xs">Supports <code>{"{{{variable}}}"}</code> syntax for dynamic personalization.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-[10px] font-medium text-muted-foreground">Internal Name</Label>
                  <Input id="name" className="h-9 rounded-lg text-xs" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Welcome Series" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="subject" className="text-[10px] font-medium text-muted-foreground">Default Subject Line</Label>
                  <Input id="subject" className="h-9 rounded-lg text-xs" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="Welcome to Prontly Store!" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="html" className="text-[10px] font-medium text-muted-foreground">HTML Layout</Label>
                  <Textarea id="html" value={formData.html} onChange={(e) => setFormData({...formData, html: e.target.value})} className="font-code text-[11px] h-64 bg-muted/30 rounded-lg leading-relaxed" required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving} className="h-9 rounded-lg text-xs">Deploy & Publish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 w-full justify-start h-9 flex-nowrap overflow-x-auto">
          <TabsTrigger value="templates" className="gap-1.5 px-3 text-xs"><Layout className="h-3.5 w-3.5" /> Templates</TabsTrigger>
          <TabsTrigger value="audience" className="gap-1.5 px-3 text-xs"><Users className="h-3.5 w-3.5" /> Subscribers</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 px-3 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
          <TabsTrigger value="domains" className="gap-1.5 px-3 text-xs"><Globe className="h-3.5 w-3.5" /> Verified Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && templates.length === 0 ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-40 animate-pulse bg-muted/20 rounded-xl shadow-sm border" />)
            ) : templates.map((template) => (
              <Card key={template.id} className="rounded-xl shadow-sm border overflow-hidden group hover:border-primary/30 transition-all bg-card">
                <CardHeader className="pb-2 p-4">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div className="flex gap-0.5 -mr-2 -mt-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPreviewTemplate(template)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-sm font-semibold">Send Test Blast</DialogTitle>
                          </DialogHeader>
                          <div className="py-2 space-y-1.5">
                            <Label className="text-[10px] font-medium text-muted-foreground">Recipient Email</Label>
                            <Input placeholder="name@domain.com" className="h-9 rounded-lg text-xs" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleSendTest(template.id)} disabled={isTesting} className="h-9 rounded-lg text-xs">Dispatch Now</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => { if(confirm('Delete template?')) deleteResendTemplate(template.id).then(fetchData); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold truncate">{template.name}</CardTitle>
                  <CardDescription className="text-[10px] font-mono truncate">{template.id}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Badge variant="outline" className="text-[10px] font-medium border-green-500/20 text-green-500 bg-green-500/5">Production Ready</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card className="rounded-xl shadow-sm border overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold">Subscriber Audience</CardTitle>
                <CardDescription className="text-xs">Managed list of verified email contacts from your Resend list.</CardDescription>
              </div>
              <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5 h-8 rounded-lg text-xs shrink-0">
                    <UserPlus className="h-3.5 w-3.5" />
                    New Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-sm font-semibold">Manual Registration</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateContact} className="space-y-4 py-2">
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-medium text-muted-foreground">Primary Email</Label>
                      <Input type="email" className="h-9 rounded-lg text-xs" value={contactData.email} onChange={(e) => setContactData({...contactData, email: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] font-medium text-muted-foreground">First Name</Label>
                        <Input className="h-9 rounded-lg text-xs" value={contactData.firstName} onChange={(e) => setContactData({...contactData, firstName: e.target.value})} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] font-medium text-muted-foreground">Last Name</Label>
                        <Input className="h-9 rounded-lg text-xs" value={contactData.lastName} onChange={(e) => setContactData({...contactData, lastName: e.target.value})} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSaving} className="h-9 rounded-lg text-xs">Add to Audience</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-[10px] font-medium text-muted-foreground">Recipient</TableHead>
                    <TableHead className="text-[10px] font-medium text-muted-foreground">Full Name</TableHead>
                    <TableHead className="text-[10px] font-medium text-muted-foreground">State</TableHead>
                    <TableHead className="text-right pr-4 text-[10px] font-medium text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length > 0 ? contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="pl-4 font-medium text-xs">{contact.email}</TableCell>
                      <TableCell className="text-xs">{contact.firstName} {contact.lastName}</TableCell>
                      <TableCell>
                        <Badge variant={contact.unsubscribed ? "destructive" : "secondary"} className="text-[10px] font-medium px-1.5 py-0">
                          {contact.unsubscribed ? "Unsubscribed" : "Subscribed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 rounded-lg" onClick={() => handleDeleteContact(contact.id)}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-xs text-muted-foreground">
                        No active contacts found in the selected audience.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Events', val: events?.length || 0, icon: BarChart3, color: 'text-primary' },
              { label: 'Delivered', val: events?.filter(e => e.type === 'delivered').length || 0, icon: CheckCircle2, color: 'text-green-500' },
              { label: 'Opened', val: events?.filter(e => e.type === 'opened').length || 0, icon: Eye, color: 'text-accent' },
              { label: 'Engagement', val: `${Math.round(((events?.filter(e => e.type === 'clicked').length || 0) / (events?.length || 1)) * 100)}%`, icon: Megaphone, color: 'text-orange-500' },
            ].map((stat, i) => (
              <Card key={i} className="rounded-xl shadow-sm border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-muted-foreground">{stat.label}</p>
                    <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mt-1">{stat.val}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-xl shadow-sm border overflow-hidden bg-card">
            <CardHeader className="p-4 pb-3"><CardTitle className="text-sm font-semibold">Live Delivery Stream</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-[10px] font-medium text-muted-foreground">Event Type</TableHead>
                    <TableHead className="text-[10px] font-medium text-muted-foreground">Recipient</TableHead>
                    <TableHead className="text-[10px] font-medium text-muted-foreground">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="pl-4">
                        <Badge className={cn(
                          "text-[10px] font-medium px-1.5 py-0 border-none",
                          ev.type === 'delivered' ? "bg-green-500/10 text-green-500" :
                          ev.type === 'opened' ? "bg-blue-500/10 text-blue-500" :
                          ev.type === 'clicked' ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                        )}>
                          {ev.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{ev.data?.to?.join(', ') || 'System'}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {ev.timestamp ? new Date(ev.timestamp.toDate()).toLocaleString() : 'Recent'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card className="rounded-xl shadow-sm border bg-card">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold">Infrastructure Verification</CardTitle>
              <CardDescription className="text-xs">Resend domain identity and security validation.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", domain.status === 'verified' ? "bg-green-500" : "bg-yellow-500")} />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate">{domain.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground capitalize">{domain.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">{domain.region}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" asChild>
                      <a href="https://app.brevo.com/senders" target="_blank"><ExternalLink className="h-3.5 w-3.5" /></a>
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
          <div className="p-3 border-b bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary text-white shrink-0"><Layout className="h-3.5 w-3.5" /></div>
              <h3 className="font-semibold text-sm truncate">{previewTemplate?.name}</h3>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px] font-mono font-medium">{previewTemplate?.id}</Badge>
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
