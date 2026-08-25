"use client";

import Image from 'next/image';
import { DownloadButton } from './DownloadButton';
import type { DownloadRecord } from '@/types/download';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { Package, Clock, Calendar } from 'lucide-react';

interface DownloadCardProps {
  record: DownloadRecord;
}

export function DownloadCard({ record }: DownloadCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const progressPercent = Math.round((record.downloadCount / record.downloadLimit) * 100);

  // Robust helper to normalize and format dates from any source (API string, Timestamp, or Date)
  const formatFriendlyDate = (dateVal: any, formatStr: string) => {
    if (!dateVal) return 'N/A';
    try {
      let d: Date;
      if (dateVal.toDate) {
        d = dateVal.toDate();
      } else if (typeof dateVal === 'string') {
        d = parseISO(dateVal);
      } else {
        d = new Date(dateVal);
      }
      
      return isValid(d) ? format(d, formatStr) : 'Recent';
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <Card className="rounded-xl shadow-sm p-4 overflow-hidden border-border/60 hover:border-primary/30 transition-colors">
      <CardContent className="p-0">
        <div className="flex gap-4 min-w-0">
          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
            {record.productImage ? (
              <Image 
                src={record.productImage} 
                alt={record.productName} 
                fill 
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <Package className="h-7 w-7" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {record.productName}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-medium px-2 py-0 rounded-md">
                  {(record.fileFormat || 'SOURCE').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] font-medium px-2 py-0 rounded-md">
                  {formatFileSize(record.fileSize)}
                </Badge>
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] font-medium px-2 py-0 rounded-md">
                  v{record.fileVersion || '1.0'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>{record.downloadCount} of {record.downloadLimit} used</span>
                {record.lastDownloadedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> 
                    {formatFriendlyDate(record.lastDownloadedAt, 'MMM dd')}
                  </span>
                )}
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent >= 100 ? "bg-red-500" : progressPercent >= 60 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
              <Calendar className="h-2.5 w-2.5" />
              Purchased {formatFriendlyDate(record.purchasedAt, 'PPP')}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60">
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
