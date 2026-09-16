'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [isMultipleReport, setIsMultipleReport] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    const storedType = typeof window !== 'undefined' ? localStorage.getItem('pending_report_type') : null;
    if (storedType === 'users') {
      setIsUsersPurchase(true);
    } else if (storedType === 'multiple') {
      setIsMultipleReport(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    handleSuccess();
  }, [user]);

  const handleSuccess = async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      const storedReportType = localStorage.getItem('pending_report_type');
      const isStoredUsers = storedReportType === 'users';
      const isStoredMultiple = storedReportType === 'multiple';

      if (isStoredMultiple) {
        setIsMultipleReport(true);
      }

      // Step 1: confirm the Stripe session
      const sessionId = searchParams.get('session_id');
      let responseData: any = null;
      if (sessionId) {
        const response = await confirmPayment(sessionId);
        if (!response.success) {
          toast.error(response.message);
          setError(response.message || 'Payment confirmation failed');
          return;
        }
        responseData = response.data;
      }

      // Step 2: determine purchase type (from localStorage or session metadata)
      const isBackendUsers =
        responseData?.type === 'users' ||
        responseData?.metadata?.type === 'users' ||
        responseData?.session?.metadata?.type === 'users' ||
        responseData?.session?.metadata?.product_type === 'users';

      if (isStoredUsers || isBackendUsers) {
        // User purchase flow — just confirm and redirect
        const redirectUrl = localStorage.getItem('pending_redirect_url') || '/profile';
        localStorage.removeItem('pending_report_type');
        localStorage.removeItem('pending_redirect_url');
        setIsUsersPurchase(true);
        toast.success('Users purchased successfully!');
        setReportGenerated(true);
        setTimeout(() => router.push(redirectUrl), 3000);
        return;
      }

      const reportType = storedReportType;

      if (reportType === 'multiple') {
        setIsMultipleReport(true);
        try {
          const filtersStr = localStorage.getItem('pending_report_filters');
          const filters = filtersStr ? JSON.parse(filtersStr) : {};
          const generatedDownloadUrl = await generateMultipleReports(filters);
          setDownloadUrl(generatedDownloadUrl);
          if (generatedDownloadUrl) {
            await downloadPdfFromUrl(generatedDownloadUrl, 'top-10-properties-report.pdf');
            toast.success('Top 10 report downloaded successfully!');
          }
        } catch (err: any) {
          console.error('Failed to generate/download top 10 report:', err);
          toast.error('Payment succeeded, but could not download the PDF automatically. You can download it using the button below.');
        }
      }

      // Clear pending storage keys
      localStorage.removeItem('pending_report_id');
      localStorage.removeItem('pending_report_property_id');
      localStorage.removeItem('pending_report_type');
      localStorage.removeItem('pending_report_filters');
      localStorage.removeItem('pending_redirect_url');

      setReportGenerated(true);
      toast.success('Payment confirmed successfully!');
    } catch (err: any) {
      console.error('Purchase success error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    handledRef.current = false;
    handleSuccess();
  };

  const handleDownloadReport = async () => {
    if (!downloadUrl) {
      toast.error('Download link not available.');
      return;
    }
    try {
      setIsDownloading(true);
      await downloadPdfFromUrl(downloadUrl, 'top-10-properties-report.pdf');
      toast.success('Report downloaded successfully!');
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5FFFF] to-[#FFFFFF] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-8 md:p-12 text-center">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="confirming"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#1CA7A6]/20 rounded-full animate-ping" />
                    <div className="relative bg-[#1CA7A6]/10 rounded-full p-4">
                      <Loader2 className="size-16 text-[#1CA7A6] animate-spin" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
                    Confirming Payment...
                  </h1>
                  <p className="text-sm md:text-base text-gray-500 font-medium">
                    Please wait while we confirm your payment and verify the transaction.
                  </p>
                </div>

                {/* Status message */}
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#F2FFFF] border border-[#1CA7A6]/20 rounded-xl text-xs md:text-sm font-semibold text-[#1CA7A6]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1CA7A6] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1CA7A6]" />
                  </span>
                  Verifying with payment provider. Please do not close or refresh.
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    <div className="relative bg-red-500/10 rounded-full p-4">
                      <AlertCircle className="size-16 text-red-500" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-red-600 uppercase tracking-tight font-asap">
                    Payment Failed
                  </h1>
                  <p className="text-sm md:text-base text-gray-500 font-medium">
                    {error}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleRetry}
                    className="w-full h-12 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest cursor-pointer"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest border-2 cursor-pointer"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
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
                    {isUsersPurchase
                      ? 'Your additional user account has been purchased successfully'
                      : isMultipleReport
                      ? 'Your Top 10 Properties report has been generated successfully'
                      : 'Your report has been purchased successfully'}
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  {isUsersPurchase ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="size-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          Users Added!
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 animate-pulse">
                        Redirecting in a moment...
                      </p>
                    </div>
                  ) : isMultipleReport ? (
                    <p className="text-sm text-[#1F2A44] font-medium bg-[#F2FFFF] border border-[#1CA7A6]/20 rounded-xl p-4 leading-relaxed">
                      Your Top 10 Properties report is ready. Click the button below to download your report PDF.
                    </p>
                  ) : (
                    <p className="text-sm text-[#1F2A44] font-medium bg-[#F2FFFF] border border-[#1CA7A6]/20 rounded-xl p-4 leading-relaxed">
                      Your reports are now ready. You can download your purchased reports at any time from the{' '}
                      <span className="font-bold text-[#1CA7A6]">Reports</span> page.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-3">
                  {isMultipleReport ? (
                    <Button
                      onClick={handleDownloadReport}
                      disabled={isDownloading || !downloadUrl}
                      className="w-full h-12 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="size-5" />
                          <span>Download Report</span>
                        </>
                      )}
                    </Button>
                  ) : !isUsersPurchase ? (
                    <Button
                      onClick={() => router.push('/reports')}
                      className="w-full h-12 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest cursor-pointer"
                    >
                      Go to Reports
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest border-2 cursor-pointer"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

