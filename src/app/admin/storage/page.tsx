'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Database, 
  RefreshCw, 
  File, 
  ImageIcon, 
  FileArchive,
  Download,
  Copy,
  Check
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listStorageFiles, deleteStorageFile } from '@/app/actions/r2-actions';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminStorage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await listStorageFiles();
      setFiles(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch storage files." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (key: string) => {
    if (!confirm('Permanently delete this file from storage?')) return;
    try {
      await deleteStorageFile(key);
      setFiles(files.filter(f => f.key !== key));
      toast({ title: "File Deleted", description: "Storage asset removed successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete file." });
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(url);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: "Copied", description: "URL copied to clipboard." });
  };

  const filteredFiles = files.filter(f => 
    f.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (key: string) => {
    const ext = key.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext!)) return <ImageIcon className="h-3.5 w-3.5 text-blue-500" />;
    if (['zip', 'rar', '7z'].includes(ext!)) return <FileArchive className="h-3.5 w-3.5 text-orange-500" />;
    return <File className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Storage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Browse and manage assets in your Cloudflare R2 bucket.</p>
        </div>
        <Button onClick={fetchFiles} disabled={loading} variant="outline" className="gap-1.5 h-9 rounded-lg text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm p-4 border-primary/20 bg-primary/5">
          <CardContent className="p-0 space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground">Total Assets</span>
            <div className="text-lg md:text-xl font-semibold tabular-nums">{files.length}</div>
            <p className="text-[10px] font-medium text-muted-foreground">Managed via R2 bucket</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm p-4 border-0">
          <CardContent className="p-0 space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground">Storage Region</span>
            <div className="text-lg md:text-xl font-semibold">Auto</div>
            <p className="text-[10px] font-medium text-muted-foreground">Cloudflare Global Edge</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm p-0 overflow-hidden border-0">
        <div className="p-4 border-b bg-card">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10 rounded-lg text-xs"
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
              <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2 text-xs">File Name</TableHead>
                  <TableHead className="px-3 py-2 text-xs">Size</TableHead>
                  <TableHead className="px-3 py-2 text-xs">Last Modified</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.key}>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(file.key)}
                        <span className="font-medium text-xs truncate max-w-[300px]">{file.key}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                      {format(new Date(file.lastModified), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => copyToClipboard(file.url)}>
                          {copiedKey === file.url ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive" onClick={() => handleDelete(file.key)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center p-6 gap-1">
              <Database className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
              <h3 className="text-sm font-semibold">No files found</h3>
              <p className="text-xs text-muted-foreground">Try adjusting your search or upload new assets.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
