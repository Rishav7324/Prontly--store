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
    <div className="space-y-6">
      <header>
        <h1 className="text-lg md:text-xl font-semibold">SEO Tools</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Monitor and optimize your store&apos;s search engine presence.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm p-4 border-green-500/20 bg-green-500/5">
          <CardHeader className="p-0 pb-3 space-y-0.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Map className="h-4 w-4 text-green-600" />
                Sitemap
              </CardTitle>
              <Badge className="bg-green-500 text-[10px] h-5">Active</Badge>
            </div>
            <CardDescription className="text-xs">Auto-generated index of all products and categories.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="rounded-lg bg-background border p-2.5 flex items-center justify-between gap-2">
              <code className="text-xs truncate">{siteUrl}/sitemap.xml</code>
              <Button variant="ghost" size="icon" asChild className="h-7 w-7 shrink-0">
                <a href={`${siteUrl}/sitemap.xml`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Last regenerated: {new Date().toLocaleDateString()}
            </p>
            <Button size="sm" variant="outline" className="w-full gap-1.5 h-8 rounded-lg text-xs">
              <RefreshCw className="h-3 w-3" />
              Force Regenerate
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm p-4 border-0">
          <CardHeader className="p-0 pb-3 space-y-0.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Search className="h-4 w-4 text-blue-500" />
                Robots.txt
              </CardTitle>
              <Badge variant="outline" className="text-[10px] h-5">Configured</Badge>
            </div>
            <CardDescription className="text-xs">Crawler instructions and path exclusions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="rounded-lg bg-background border p-2.5">
              <pre className="text-[10px] leading-tight text-muted-foreground">
                User-agent: *<br />
                Allow: /<br />
                Disallow: /admin/<br />
                Disallow: /dashboard/<br />
                Sitemap: {siteUrl}/sitemap.xml
              </pre>
            </div>
            <Button size="sm" variant="outline" className="w-full gap-1.5 h-8 rounded-lg text-xs" asChild>
              <a href={`${siteUrl}/robots.txt`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /> View Live</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm p-4 border-0">
        <CardHeader className="p-0 pb-3 space-y-0.5">
          <CardTitle className="text-sm font-semibold">Schema.org Health</CardTitle>
          <CardDescription className="text-xs">Structured data status for rich search results.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Organization', status: 'Healthy', icon: Globe },
              { label: 'Products', status: 'Healthy', icon: FileJson },
              { label: 'Breadcrumbs', status: 'Healthy', icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg border bg-background flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-muted">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] font-medium text-green-600">● {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm p-4 border-blue-500/20 bg-blue-500/5">
        <CardHeader className="p-0 pb-3 space-y-0.5">
          <CardTitle className="text-sm font-semibold">Google Search Console</CardTitle>
          <CardDescription className="text-xs">Submit your sitemap to Google for faster indexing.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Button asChild className="gap-1.5 h-8 rounded-lg px-3 text-xs bg-blue-600 hover:bg-blue-700">
            <a href="https://search.google.com/search-console" target="_blank">
              Go to Search Console
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
