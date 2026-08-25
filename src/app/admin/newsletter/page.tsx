'use client';

import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Search, 
  Trash2, 
  Mail, 
  Download,
  Users,
  SendHorizontal,
  Loader2,
  AlertCircle
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { listTemplates, sendNewsletterCampaign } from '@/app/actions/brevo-actions';
import { Label } from '@/components/ui/label';

export default function AdminNewsletter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    templateId: '',
    subject: ''
  });

  const db = useFirestore();
  
  const subscribersQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'newsletter_subscribers'), orderBy('createdAt', 'desc')) : null;
  }, [db]);

  const { data: subscribers, loading } = useCollection(subscribersQuery);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await listTemplates();
      if (res.success) setTemplates(res.data);
    };
    fetchTemplates();
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastData.templateId || !subscribers) return;
    
    setIsBroadcasting(true);
    const emails = subscribers.map(s => s.email);
    
    try {
      // Sanitize settings for Server Action
      const plainEmailSettings = settings?.emailSettings ? {
        fromEmail: settings.emailSettings.fromEmail,
        senderName: settings.emailSettings.senderName
      } : undefined;

      const res = await sendNewsletterCampaign({
        templateId: broadcastData.templateId,
        subject: broadcastData.subject || "Newsletter Update from Prontly",
        recipients: emails,
        sender: plainEmailSettings
      });

      if (res.success) {
        toast({ title: "Campaign Sent!", description: `Blast initiated to ${emails.length} subscribers.` });
        setIsCampaignModalOpen(false);
      } else {
        toast({ variant: "destructive", title: "Blast Failed", description: res.error });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Internal broadcast error." });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredSubscribers = subscribers?.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    if (!subscribers) return;
    const headers = ['Email', 'Source', 'Date Subscribed'];
    const rows = subscribers.map(s => [
      s.email,
      s.source || 'Website',
      s.createdAt ? format(new Date(s.createdAt.toDate()), 'yyyy-MM-dd') : 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Newsletter</h1>
          <p className="text-xs text-muted-foreground">Manage your audience and trigger high-scale email broadcasts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm" className="h-8 rounded-lg gap-2">
            <Download className="h-4 w-4" />
            Export List
          </Button>
          <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 rounded-lg gap-2">
                <SendHorizontal className="h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Broadcast Newsletter</DialogTitle>
                <DialogDescription>Send a pre-designed Resend template to all {subscribers?.length || 0} active subscribers.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-medium text-muted-foreground">Email Template</Label>
                  <Select onValueChange={(id) => setBroadcastData({...broadcastData, templateId: id})}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-medium text-muted-foreground">Campaign Subject</Label>
                  <Input 
                    className="h-9 rounded-lg"
                    placeholder="e.g. This Week's Top AI Prompts" 
                    value={broadcastData.subject}
                    onChange={(e) => setBroadcastData({...broadcastData, subject: e.target.value})}
                  />
                </div>
                <div className="rounded-lg bg-primary/5 p-3 flex items-start gap-2.5 border border-primary/20">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Broadcasts are sent via Resend Batch API. Ensure your selected template is verified and follows anti-spam regulations.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleBroadcast} 
                  disabled={isBroadcasting || !broadcastData.templateId}
                  size="sm"
                  className="w-full h-8 rounded-lg"
                >
                  {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendHorizontal className="h-4 w-4 mr-2" />}
                  Launch Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">Active Audience</p>
              <h3 className="text-xl md:text-2xl font-semibold mt-1">{subscribers?.length || 0}</h3>
              <p className="text-[10px] font-medium text-muted-foreground mt-1">Verified Emails</p>
            </div>
            <Users className="h-8 w-8 text-primary opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredSubscribers && filteredSubscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4">Email Address</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((sub: any) => (
                    <TableRow key={sub.id} className="transition-colors">
                      <TableCell className="pl-4 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-medium">{sub.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        {sub.source || 'Website'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {sub.createdAt ? format(new Date(sub.createdAt.toDate()), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right pr-4 px-3 py-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                          if (confirm('Remove subscriber?')) deleteDoc(doc(db!, 'newsletter_subscribers', sub.id));
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Mail className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">No subscribers yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Users who sign up via your footer will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
