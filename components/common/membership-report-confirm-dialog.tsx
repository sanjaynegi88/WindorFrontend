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

interface MembershipReportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  remaining?: number;
  baseLimit?: number;
  isGenerating?: boolean;
  title?: string;
  reportName?: string;
}

export const MembershipReportConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  remaining = 0,
  baseLimit = 0,
  isGenerating = false,
  title = "Confirm Report Access",
  reportName = "this report",
}: MembershipReportConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-6 font-asap">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
            Accessing {reportName} will use{" "}
            <span className="font-bold text-[#1F2A44]">1 report credit</span> from
            your membership allowance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-2 p-3.5 rounded-xl bg-[#F4FBFB] border border-[#1CA7A6]/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider font-inter">
            Membership Quota
          </span>
          <span className="text-sm font-black text-[#1CA7A6] font-inter">
            {remaining} out of {baseLimit} available
          </span>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
          <AlertDialogCancel
            disabled={isGenerating}
            className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-gray-50 flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isGenerating}
            className="h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest flex-1 gap-1.5"
          >
            {isGenerating && <Loader2 className="size-4 animate-spin" />}
            {isGenerating ? "Downloading…" : "Confirm & Download"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
