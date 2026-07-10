'use client';

import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface PdfGenerationLoaderProps {
  isOpen: boolean;
  message?: string;
}

export function PdfGenerationLoader({
  isOpen,
  message = "Generating PDF..."
}: PdfGenerationLoaderProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[350px] flex flex-col items-center justify-center py-10 outline-none"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20 opacity-75" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>

          <div className="space-y-1.5 text-center">
            <DialogTitle className="text-lg font-semibold tracking-tight leading-none">
              {message}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Please wait while we process your request.
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

