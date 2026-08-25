"use client";

import { useEffect, useState } from "react";
import { getMyProjects, getPropertyListAll } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, FileText, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
import { generatePdfReport, purchaseReport, getReportUsage } from "@/lib/actions";
import { toast } from "sonner";
import { useUser } from "@/components/providers/user-provider";
import { PdfGenerationLoader } from "./pdf-generation-loader";
import { downloadPdfFromUrl, getErrorMessage } from "@/lib/utils";

interface PropertyListProps {
  searchParams?: any;
  isPurchased?: boolean;
  myProjects?: boolean;
}

interface PropertyRowProps {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyId: string;
  isPurchased?: boolean;
}

function PropertyRow({ address, city, state, zip, propertyId, isPurchased = false }: PropertyRowProps) {
  const { user, role } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [reportUsage, setReportUsage] = useState<any>(null);
  const [purchased, setPurchased] = useState(isPurchased);

  const isAdmin = role === "admin";
  const isCityInspector = role === "city_inspector";

  useEffect(() => {
    if (role === "insurance_company") {
      fetchReportUsage();
    }
  }, [role]);

  const fetchReportUsage = async () => {
    try {
      const response = await getReportUsage();
      setReportUsage(response.data);
    } catch (error: any) {
      console.error("Failed to fetch report usage:", error);
    }
  };

  const handleGenerateReport = async () => {
    if (!user) {
      toast.error("Please log in to generate a report");
      return;
    }

    if (role === "property_owner" || isAdmin || isCityInspector) {
      await downloadReport();
      return;
    }

    if (role === "contractor") {
      if (purchased) {
        await downloadReport();
      } else {
        setShowPurchaseDialog(true);
      }
      return;
    }

    if (role === "insurance_company") {
      if (purchased) {
        await downloadReport();
      } else if (reportUsage && reportUsage.remaining > 0) {
        await downloadReport();
      } else {
        setShowPurchaseDialog(true);
      }
      return;
    }
  };

  const downloadReport = async () => {
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(propertyId, undefined, user?.role);
      await downloadPdfFromUrl(url, `property-report-${propertyId}.pdf`);
      toast.success("Report downloaded successfully");
      setPurchased(true);

      if (user?.role === "insurance_company") {
        await fetchReportUsage();
      }
    } catch (error: any) {
      console.error("Download report error:", error);
      toast.error(error.message || "Failed to download report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePurchase = async () => {
    setShowPurchaseDialog(false);
    setIsGenerating(true);
    try {
      const response = await purchaseReport(propertyId);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      if (response.data?.checkoutUrl) {
        localStorage.setItem("pending_report_id", propertyId);
        localStorage.setItem("pending_report_type", "single");
        window.location.href = response.data.checkoutUrl;
      } else {
        toast.success("Report purchased successfully");
        setPurchased(true);
        await downloadReport();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Something went wrong."));
      setIsGenerating(false);
    }
  };

  const showBuyOption =
    (role === "contractor" && !purchased) ||
    (role === "insurance_company" &&
      !purchased &&
      (!reportUsage || reportUsage.remaining === 0));

  const showGenerateOption =
    role === "property_owner" ||
    role === "admin" ||
    role === "city_inspector" ||
    (role === "contractor" && purchased) ||
    (role === "insurance_company" &&
      (purchased || (reportUsage && reportUsage.remaining > 0)));

  return (
    <>
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-white border border-[#1CA7A6] rounded-[10px] hover:shadow-md transition-all">
        {/* Icon */}
        <div className="shrink-0">
          <Image
            src="/assets/home-icon.png"
            alt="property"
            width={36}
            height={36}
            className="md:hidden"
          />
          <Image
            src="/assets/home-icon.png"
            alt="property"
            width={44}
            height={44}
            className="hidden md:block"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-base font-black text-[#1e293b] uppercase tracking-tight font-asap truncate">
            {address}
          </h3>
          <p className="flex items-center gap-1 text-xs md:text-sm font-bold text-gray-400 mt-0.5">
            <MapPin className="size-3 shrink-0" />
            {city}{city && state ? ", " : ""}{state} {zip}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">

          {showGenerateOption && (
            <Button
              size="sm"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="h-8 md:h-9 px-3 md:px-4 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-widest gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              <span className="hidden sm:inline">Generate Report</span>
              <span className="sm:hidden">Report</span>
            </Button>
          )}

          {/* Buy Report button */}
          {showBuyOption && (
            <Button
              size="sm"
              onClick={() => setShowPurchaseDialog(true)}
              className="h-8 md:h-9 px-3 md:px-4 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-xs uppercase tracking-widest gap-1.5"
            >
              <ShoppingCart className="size-3.5" />
              <span className="hidden sm:inline">Buy Report</span>
              <span className="sm:hidden">Buy</span>
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)]">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Purchase Report
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
              {user?.role === "contractor"
                ? "This report requires purchase. Would you like to proceed with the payment?"
                : `You have ${reportUsage?.remaining || 0} free reports remaining. Would you like to purchase this report?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest"
            >
              Purchase Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfGenerationLoader isOpen={isGenerating} message="Generating Report..." />
    </>
  );
}

export function PropertyList({ searchParams, isPurchased }: PropertyListProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProperties = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const response = await getPropertyListAll({
        ...searchParams,
        page: pageNum,
        limit: 15,
        ...(isPurchased !== undefined && { is_purchased: isPurchased }),
      });

      const newData = response?.data || [];
      if (append) {
        setProperties((prev) => [...prev, ...newData]);
      } else {
        setProperties(newData);
      }

      setHasMore(newData.length === 15);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProperties(1, false);
  }, [searchParams, isPurchased]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage, true);
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-[2rem]">
        <p className="text-gray-400 font-black uppercase tracking-widest text-lg">
          No properties found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="space-y-2 md:space-y-3">
        {properties.map((prop) => (
          <PropertyRow
            key={prop.id}
            id={`RE${prop.id.slice(-4).toUpperCase()}`}
            address={prop.property_name || ""}
            city={prop.city_name || prop.city?.name || ""}
            state={prop.state_name || prop.state?.name || ""}
            zip={prop.zip || ""}
            propertyId={prop.id}
            isPurchased={prop.is_purchased || false}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2 font-black uppercase tracking-widest text-[#22a699] hover:bg-[#e6f7f5]"
          >
            {loadingMore && <Loader2 className="size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
