
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  History, 
  ShieldAlert, 
  User, 
  Clock, 
  ExternalLink,
  Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

export default function AdminLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();

  const logsQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(100)) : null;
  }, [db]);

  const { data: logs, loading } = useCollection(logsQuery);

  const filteredLogs = logs?.filter(log => 
    log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge className="bg-green-500">CREATE</Badge>;
      case 'UPDATE': return <Badge className="bg-blue-500">UPDATE</Badge>;
      case 'DELETE': return <Badge variant="destructive">DELETE</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Audit Logs</h1>
        <p className="text-muted-foreground">Detailed history of administrative actions for security compliance.</p>
      </header>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search logs by email, action, or resource..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.timestamp ? format(new Date(log.timestamp.toDate()), 'MMM dd, HH:mm:ss') : 'Just now'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.adminEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">{log.resourceType}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {log.resourceId?.slice(-8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs text-muted-foreground truncate" title={JSON.stringify(log.details)}>
                        {Object.entries(log.details || {}).map(([key, val]) => `${key}: ${val}`).join(', ')}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <History className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold font-headline">No logs found</h3>
              <p className="text-muted-foreground">Admin actions will appear here as they occur.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
