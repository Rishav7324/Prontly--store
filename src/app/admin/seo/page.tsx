'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Globe, 
  Map, 
  FileJson, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function AdminSEO() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">SEO Tools</h1>
        <p className="text-muted-foreground">Monitor and optimize your store's search engine presence.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-green-500" />
                Dynamic Sitemap
              </CardTitle>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <CardDescription>Automatically generated index of all products and categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-background border p-4 flex items-center justify-between">
              <code className="text-xs">{siteUrl}/sitemap.xml</code>
              <Button variant="ghost" size="sm" asChild>
                <a href={`${siteUrl}/sitemap.xml`} target="_blank"><ExternalLink className="h-4 w-4" /></a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Last regenerated: {new Date().toLocaleDateString()}
            </p>
            <Button size="sm" variant="outline" className="w-full gap-2">
              <RefreshCw className="h-3 w-3" />
              Force Regenerate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Robots.txt
              </CardTitle>
              <Badge variant="outline">Configured</Badge>
            </div>
            <CardDescription>Search engine crawler instructions and path exclusions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-background border p-4">
              <pre className="text-[10px] leading-tight text-muted-foreground">
                User-agent: *<br />
                Allow: /<br />
                Disallow: /admin/<br />
                Disallow: /dashboard/<br />
                Sitemap: {siteUrl}/sitemap.xml
              </pre>
            </div>
            <Button size="sm" variant="outline" className="w-full gap-2" asChild>
              <a href={`${siteUrl}/robots.txt`} target="_blank"><ExternalLink className="h-4 w-4" /> View Live</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schema.org Health</CardTitle>
          <CardDescription>Structured data status for rich search results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Organization', status: 'Healthy', icon: Globe },
              { label: 'Products', status: 'Healthy', icon: FileJson },
              { label: 'Breadcrumbs', status: 'Healthy', icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl border bg-card/50 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs text-green-500">● {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Google Search Console</CardTitle>
          <CardDescription>Submit your sitemap to Google for faster indexing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
            <a href="https://search.google.com/search-console" target="_blank">
              Go to Search Console
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
