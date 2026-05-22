'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext!)) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (['zip', 'rar', '7z'].includes(ext!)) return <FileArchive className="h-4 w-4 text-orange-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Storage Manager</h1>
          <p className="text-muted-foreground">Browse and manage assets in your Cloudflare R2 bucket.</p>
        </div>
        <Button onClick={fetchFiles} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Managed via R2 bucket</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">Auto</div>
            <p className="text-xs text-muted-foreground mt-1">Cloudflare Global Edge</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : filteredFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.key}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.key)}
                        <span className="font-medium text-sm truncate max-w-[300px]">{file.key}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(file.lastModified), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(file.url)}>
                          {copiedKey === file.url ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(file.key)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Database className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold font-headline">No files found</h3>
              <p className="text-muted-foreground">Try adjusting your search or upload new assets.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
