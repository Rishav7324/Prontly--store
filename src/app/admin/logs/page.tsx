'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  History,
  User
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => fetcher('/api/admin/logs'),
    refetchInterval: 30000,
  });

  const filteredLogs = (logs as any[]).filter(log =>
    log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge className="text-[10px] font-medium bg-green-500/10 text-green-600 border-none">CREATE</Badge>;
      case 'UPDATE': return <Badge className="text-[10px] font-medium bg-blue-500/10 text-blue-600 border-none">UPDATE</Badge>;
      case 'DELETE': return <Badge className="text-[10px] font-medium bg-destructive/10 text-destructive border-none">DELETE</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-medium">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg md:text-xl font-semibold">Audit Logs</h1>
        <p className="text-xs text-muted-foreground">Detailed history of administrative actions for security compliance.</p>
      </header>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs by email, action, or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-3 py-2">Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id} className="transition-colors">
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : 'Just now'}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{log.adminEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">{getActionBadge(log.action)}</TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-primary">{log.resourceType}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: …{log.resourceId?.slice(-8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs px-3 py-2">
                        <p className="text-xs text-muted-foreground truncate" title={JSON.stringify(log.details)}>
                          {Object.entries(log.details || {}).map(([key, val]) => `${key}: ${val}`).join(', ')}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <History className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">No logs found</h3>
              <p className="text-xs text-muted-foreground mt-1">Admin actions will appear here as they occur.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
