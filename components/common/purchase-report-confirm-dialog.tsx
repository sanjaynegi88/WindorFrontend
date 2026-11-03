import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface PurchaseReportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  remaining?: number;
  baseLimit?: number;
  hasQuotaLimit?: boolean;
  isProcessing?: boolean;
  reportName?: string;
  price?: number | string;
}

export const PurchaseReportConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  remaining = 0,
  baseLimit = 0,
  hasQuotaLimit = false,
  isProcessing = false,
  reportName = "this report",
  price,
}: PurchaseReportConfirmDialogProps) => {
  const isLimitReached = hasQuotaLimit || remaining === 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-6 font-asap">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight">
            {isLimitReached ? "Membership Limit Reached" : "Purchase Report"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
            {isLimitReached ? (
              <>
                You have reached your membership report limit for this period. To
                access {reportName}, you can purchase it individually.
              </>
            ) : (
              <>
                Accessing {reportName} requires purchase. Would you like to
                proceed to payment?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          {isLimitReached && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider font-inter">
                Membership Quota
              </span>
              <span className="text-sm font-black text-amber-900 font-inter">
                0 out of {baseLimit} available
              </span>
            </div>
          )}

          {price !== undefined && price !== null && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider font-inter">
                Total Price
              </span>
              <span className="text-sm font-black text-[#1F2A44] font-inter">
                ${price}
              </span>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
          <AlertDialogCancel
            disabled={isProcessing}
            className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-gray-50 flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isProcessing}
            className="h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest flex-1 gap-1.5"
          >
            {isProcessing && <Loader2 className="size-4 animate-spin" />}
            {isProcessing
              ? "Processing…"
              : price !== undefined && price !== null
                ? `Purchase Now ($${price})`
                : "Purchase Now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
