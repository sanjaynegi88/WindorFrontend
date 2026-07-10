'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { confirmPayment, generateMultipleReports } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';
import { downloadPdfFromUrl } from '@/lib/utils';

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const [isProcessing, setIsProcessing] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isUsersPurchase, setIsUsersPurchase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    handleSuccess();
  }, [user]);

  const handleSuccess = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: confirm the Stripe session
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        const response = await confirmPayment(sessionId);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
      }

      // Step 2: determine purchase type
      const reportType = localStorage.getItem('pending_report_type');

      if (reportType === 'users') {
        // User purchase flow — just confirm and redirect to profile
        localStorage.removeItem('pending_report_type');
        setIsUsersPurchase(true);
        toast.success('Users purchased successfully!');
        setReportGenerated(true);
        setTimeout(() => router.push('/profile'), 3000);
        return;
      }

      if (reportType === 'multiple') {
        try {
          const filtersStr = localStorage.getItem('pending_report_filters');
          const filters = filtersStr ? JSON.parse(filtersStr) : {};
          const downloadUrl = await generateMultipleReports(filters);
          await downloadPdfFromUrl(downloadUrl, 'top-10-properties-report.pdf');
          toast.success('Top 10 report downloaded successfully!');
        } catch (err: any) {
          console.error('Failed to generate/download top 10 report:', err);
          toast.error('Payment succeeded, but could not download the PDF automatically. You can download it from the Reports page.');
        }
      }

      // Clear pending storage keys
      localStorage.removeItem('pending_report_id');
      localStorage.removeItem('pending_report_property_id');
      localStorage.removeItem('pending_report_type');
      localStorage.removeItem('pending_report_filters');

      setReportGenerated(true);
      toast.success('Payment confirmed successfully!');
    } catch (err: any) {
      console.error('Purchase success error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#F5FFFF] to-[#FFFFFF] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-8 md:p-12 space-y-6 text-center">

            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative bg-green-500/10 rounded-full p-4">
                  <CheckCircle2 className="size-16 text-green-500" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
                Purchase Successful!
              </h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">
                Your report has been purchased successfully
              </p>
            </div>

            {/* Status */}
            <div className="space-y-3">
              {isProcessing ? (
                <div className="flex items-center justify-center gap-3 text-[#1CA7A6] py-4">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Confirming payment...
                  </span>
                </div>
              ) : reportGenerated ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  {isUsersPurchase ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="size-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          Users Added!
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 animate-pulse">
                        Redirecting to profile in a moment...
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#1F2A44] font-medium bg-[#F2FFFF] border border-[#1CA7A6]/20 rounded-xl p-4 leading-relaxed">
                      Your reports are now ready. You can download your purchased reports at any time from the **Reports** page.
                    </p>
                  )}
                </div>
              ) : error ? (
                <div className="space-y-3">
                  <p className="text-red-500 text-sm font-medium py-2">{error}</p>
                  <Button
                    onClick={handleSuccess}
                    variant="outline"
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest"
                  >
                    Try Again
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              {!isProcessing && reportGenerated && !isUsersPurchase && (
                <Button
                  onClick={() => router.push('/reports')}
                  className="w-full h-12 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest cursor-pointer"
                >
                  Go to Reports
                </Button>
              )}
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full h-12 rounded-xl font-black uppercase tracking-widest border-2 cursor-pointer"
              >
                Go to Dashboard
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
