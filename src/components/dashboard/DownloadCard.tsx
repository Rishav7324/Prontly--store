"use client";

import Image from 'next/image';
import { DownloadButton } from './DownloadButton';
import type { DownloadRecord } from '@/types/download';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { FileText, Package, Clock, Calendar } from 'lucide-react';

interface DownloadCardProps {
  record: DownloadRecord;
}

export function DownloadCard({ record }: DownloadCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const progressPercent = Math.round((record.downloadCount / record.downloadLimit) * 100);

  // Helper to normalize dates from both API (string) and Firebase (Timestamp)
  const formatFriendlyDate = (dateVal: any, formatStr: string) => {
    if (!dateVal) return 'N/A';
    try {
      const d = dateVal.toDate ? dateVal.toDate() : (typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal));
      return format(d, formatStr);
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <Card className="bg-card/40 border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex gap-6">
          <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-muted border border-white/5 shrink-0">
            {record.productImage ? (
              <Image src={record.productImage} alt={record.productName} fill className="object-cover transition-transform group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                {record.productName}
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black tracking-widest px-2 py-0">
                  {record.fileFormat.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] font-bold">
                  {formatFileSize(record.fileSize)}
                </Badge>
                <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] font-bold">
                  v{record.fileVersion}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                <span>{record.downloadCount} of {record.downloadLimit} Used</span>
                {record.lastDownloadedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> 
                    {formatFriendlyDate(record.lastDownloadedAt, 'MMM dd')}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    progressPercent >= 100 ? "bg-red-500" : progressPercent >= 60 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
              <Calendar className="h-3 w-3" />
              Purchased {formatFriendlyDate(record.purchasedAt, 'PPP')}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <DownloadButton
            productId={record.productId}
            orderId={record.orderId}
            downloadCount={record.downloadCount}
            downloadLimit={record.downloadLimit}
            isActive={record.isActive}
          />
        </div>
      </CardContent>
    </Card>
  );
}
