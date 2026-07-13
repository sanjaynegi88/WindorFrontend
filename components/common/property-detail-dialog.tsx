'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, MapPin, Loader2, Grid3X3 } from 'lucide-react';
import { cn, downloadPdfFromUrl } from '@/lib/utils';
import { generatePdfReport } from '@/lib/actions';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PdfGenerationLoader } from './pdf-generation-loader';

function ImageWithLoader({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className={cn("relative overflow-hidden bg-muted/20 w-full h-full", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/5 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600/40" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, 33vw"
        className={cn(
          "object-cover w-full h-full transition-all duration-700 ease-in-out",
          loading ? "scale-110 blur-md opacity-0" : "scale-100 blur-0 opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}


interface PropertyDetailDialogProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyDetailDialog({ property, isOpen, onClose }: PropertyDetailDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expansion state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);

  if (!property) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(property.id);
      await downloadPdfFromUrl(url, `property-report-${property.id}.pdf`);
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };


  const allImages = (property.projects ?? [])
    .map((p: any) => p.components)
    .filter(Boolean)
    .flatMap((comp: any) =>
      (comp.images ?? []).flatMap((img: any) => [
        img.image_url ? `${img.image_url}` : null,
        img.property_owner_files ? `${img.property_owner_files}` : null
      ].filter(Boolean))
    );

  // Remove duplicates
  const uniqueImages = Array.from(new Set(allImages)) as string[];
  const displayImages = isExpanded ? uniqueImages : uniqueImages.slice(0, 4);
  const hasMore = uniqueImages.length > 4;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-s-0 shadow-2xl"
      >
        <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg font-bold">Product Details</SheetTitle>
        </SheetHeader>

        <SheetBody className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Image Section */}
          <div className="space-y-4">
            {uniqueImages.length > 0 ? (
              <div className={cn(
                "grid gap-2",
                isExpanded ? "grid-cols-2" : (uniqueImages.length === 1 ? "grid-cols-1" : "grid-cols-2")
              )}>
                {displayImages.map((src, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border border-border/50 bg-muted/30 group",
                      !isExpanded && uniqueImages.length === 1 ? "aspect-video" : "aspect-square",
                      !isExpanded && uniqueImages.length === 3 && idx === 0 ? "col-span-2 aspect-video" : ""
                    )}
                  >
                    <ImageWithLoader
                      src={src}
                      alt={`${property.address} - ${idx}`}
                    />

                    {!isExpanded && idx === 3 && uniqueImages.length > 4 && (
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white hover:bg-black/70 transition-all group-hover:backdrop-blur-sm"
                      >
                        <Grid3X3 className="size-6 mb-1 opacity-80" />
                        <span className="text-xl font-black">+{uniqueImages.length - 3}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">View All</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted/30 border border-border/50 flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                <MapPin className="size-12" strokeWidth={1.5} />
                <span className="text-sm font-medium">No Property Images Found</span>
              </div>
            )}

            {isExpanded && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px] font-black uppercase tracking-widest h-8 border-dashed"
                onClick={() => setIsExpanded(false)}
              >
                Hide Extra Images
              </Button>
            )}
          </div>

          {/* Title and Description */}
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {property.address || 'Property Details'}
            </h2>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-4 pt-2">

            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
                City
              </span>
              <span className="text-xs font-bold text-foreground">
                {property.city_name || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
                Zip Code
              </span>
              <span className="text-xs font-bold text-foreground">
                {property.zip || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
                Owner Email
              </span>
              <span className="text-xs font-bold text-foreground">
                {property.owner_email || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col gap-2 py-1">
              <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Installations:</span>
              <span className="text-muted-foreground text-xs leading-relaxed font-medium">
                {(property.projects ?? [])
                  .map((p: any) => p.components?.component_type)
                  .filter(Boolean)
                  .join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="p-6 border-t bg-muted/5">
          <Button
            className="w-full h-14 text-sm font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-widest"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            <FileText className="size-5" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </SheetFooter>
      </SheetContent>

      <PdfGenerationLoader isOpen={isGenerating} message="Generating Property Report..." />
    </Sheet>
  );
}

