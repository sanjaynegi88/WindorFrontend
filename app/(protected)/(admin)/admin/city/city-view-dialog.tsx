"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Building2, Edit, Hash } from "lucide-react";
import { formatDate } from "@/lib/helpers";
import { toTitleCase } from "@/lib/utils";

interface CityViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: any | null;
  onEdit?: (city: any) => void;
}

export function CityViewDialog({
  isOpen,
  onClose,
  city,
  onEdit,
}: CityViewDialogProps) {
  if (!city) return null;

  const zipCodes: string[] = city.zip_codes || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {toTitleCase(city.name)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                City Details & Associated Zip Codes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/50">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                State
              </span>
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 className="size-3.5 text-primary" />
                {city.state_entity?.state_name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Total Zip Codes
              </span>
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <Hash className="size-3.5 text-primary" />
                {zipCodes.length} {zipCodes.length === 1 ? "Code" : "Codes"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-foreground mb-2 block">
              Zip Codes
            </span>
            {zipCodes.length > 0 ? (
              <div className="max-h-40 overflow-y-auto p-2.5 bg-background border border-border/60 rounded-xl flex flex-wrap gap-1.5">
                {zipCodes.map((zip: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="primary"
                    className="text-xs px-2.5 py-0.5"
                  >
                    {zip}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No zip codes found.
              </span>
            )}
          </div>

          {city.updated_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Calendar className="size-3.5" />
              <span>
                Last Updated:{" "}
                <span className="font-medium text-foreground">
                  {formatDate(city.updated_at)}
                </span>
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(city);
              }}
              className="rounded-xl px-4 h-10 gap-1.5"
            >
              <Edit className="size-3.5 text-muted-foreground" />
              Edit City
            </Button>
          )}
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 h-10 bg-primary text-white hover:bg-primary/90"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
