"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  generateMultipleReports,
  checkoutReports,
  PropertyFilters,
} from "@/lib/actions";
import { downloadPdfFromUrl } from "@/lib/utils";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
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

interface UseTop10ReportParams {
  reportFilters: PropertyFilters;
  isAdminOrInspector?: boolean;
  user: any;
}

interface PaymentDialogState {
  isOpen: boolean;
  message: string;
  checkoutUrl: string;
}

export function useTop10Report({
  reportFilters,
  isAdminOrInspector = false,
  user,
}: UseTop10ReportParams) {
  const [isGeneratingTop10, setIsGeneratingTop10] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState>({
    isOpen: false,
    message: "",
    checkoutUrl: "",
  });

  const handleGenerateTop10 = async () => {
    if (!user) {
      toast.error("Please log in to generate a report");
      return;
    }

    setIsGeneratingTop10(true);

    try {
      if (isAdminOrInspector) {
        const url = await generateMultipleReports(reportFilters);
        await downloadPdfFromUrl(url, "top-10-properties-report.pdf");
        toast.success("Report downloaded successfully");
      } else {
        const checkoutResponse = await checkoutReports(reportFilters);
        if (!checkoutResponse.success) {
          toast.error(checkoutResponse.message);
          return;
        }

        const data = checkoutResponse.data?.data;
        if (data?.requiresPayment && data?.checkoutUrl) {
          setIsGeneratingTop10(false);

          const backendMessage =
            data?.message || "Payment required for additional properties.";

          setPaymentDialog({
            isOpen: true,
            message: backendMessage,
            checkoutUrl: data.checkoutUrl,
          });
          return;
        }

        const url = await generateMultipleReports(reportFilters);
        await downloadPdfFromUrl(url, "top-10-properties-report.pdf");
        toast.success("Report downloaded successfully");
      }
    } catch (error: any) {
      console.error("Generate top 10 report error:", error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setIsGeneratingTop10(false);
    }
  };

  const handlePayNow = () => {
    if (paymentDialog.checkoutUrl) {
      localStorage.setItem(
        "pending_report_filters",
        JSON.stringify(reportFilters),
      );
      localStorage.setItem("pending_report_type", "multiple");
      window.location.href = paymentDialog.checkoutUrl;
    }
  };

  const handleCancelPayment = () => {
    setPaymentDialog({
      isOpen: false,
      message: "",
      checkoutUrl: "",
    });
    setIsGeneratingTop10(false);
  };

  const Top10Dialogs = () => (
    <>
      <AlertDialog
        open={paymentDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelPayment();
        }}
      >
        <AlertDialogContent className="sm:max-w-[440px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)]">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Purchase Report
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
              {paymentDialog.message ||
                "Payment is required to generate this report. Would you like to proceed with payment?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel
              onClick={handleCancelPayment}
              className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePayNow}
              className="h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest cursor-pointer"
            >
              Pay Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfGenerationLoader
        isOpen={isGeneratingTop10}
        message="Generating Reports..."
      />
    </>
  );

  return {
    isGeneratingTop10,
    handleGenerateTop10,
    paymentDialog,
    handlePayNow,
    handleCancelPayment,
    Top10Dialogs,
  };
}
