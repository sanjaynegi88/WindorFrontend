"use client";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import { PropertyGrid } from "@/components/common/property-grid";
import {
  SearchScope,
  UnifiedSearchBar,
} from "@/components/common/unified-search-bar";
import { Content } from "@/components/layouts/crm/components/content";
import { useUser } from "@/components/providers/user-provider";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { checkoutReports, generateMultipleReports } from "@/lib/actions";
import { ChevronLeft, FileText, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadPdfFromUrl } from "@/lib/utils";

export default function ProjectList() {
  const [filters, setFilters] = useState({
    search: "",
    searchBy: "all" as SearchScope,
    state: "all",
    city: "all",
    state_id: "",
    city_id: "",
  });

  const debouncedSearch = useDebounce(filters.search, 300);
  const { searchBy, state, city, state_id, city_id } = filters;

  const searchParams = useMemo(
    () => ({
      search: searchBy === "all" ? debouncedSearch : "",
      brandName: searchBy === "brand" ? debouncedSearch : "",
      color: searchBy === "color" ? debouncedSearch : "",
      style: searchBy === "style" ? debouncedSearch : "",
      state: state,
      city: city,
      state_id: state_id,
      city_id: city_id,
    }),
    [debouncedSearch, searchBy, state, city, state_id, city_id],
  );

  const reportFilters = useMemo(
    () => ({
      search: debouncedSearch,
      brandName: searchBy === "brand" ? debouncedSearch : "",
      color: searchBy === "color" ? debouncedSearch : "",
      style: searchBy === "style" ? debouncedSearch : "",
      state_id: state_id,
      city_id: city_id,
    }),
    [debouncedSearch, searchBy, state_id, city_id],
  );
  const { user } = useUser();
  const role = user?.role?.toLowerCase() || "";
  const isAdminOrInspector = role === "admin" || role === "city_inspector";
  const isPropertyOwner = role === "property_owner";
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGeneratingTop10, setIsGeneratingTop10] = useState(false);

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
        if (
          checkoutResponse.data?.requiresPayment &&
          checkoutResponse.data?.checkoutUrl
        ) {
          localStorage.setItem(
            "pending_report_filters",
            JSON.stringify(reportFilters),
          );
          localStorage.setItem("pending_report_type", "multiple");
          window.location.href = checkoutResponse.data.checkoutUrl;
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
  return (
    <Content className="p-0 bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full max-w-[1170px] px-4 py-8 md:py-16 space-y-[20px] md:space-y-[30px]">
        <div className="text-center mb-10">
          <span className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1 text-3xl font-semibold text-primary">
            Step 1
          </span>

          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            Select Property
          </h1>

          <p className="mt-2 text-slate-500">Choose a property to continue</p>
        </div>

        <UnifiedSearchBar
          showSearchButton={true}
          onChange={setFilters}
          onSearchTriggered={() => setShowResults(true)}
        />

        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-4xl font-black text-[#1e293b] tracking-tighter uppercase font-asap">
              Properties
            </h2>
            <Button
              onClick={handleGenerateTop10}
              disabled={isGeneratingTop10}
              className="h-9 md:h-11 px-4 md:px-6 rounded-[10px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs md:text-sm uppercase tracking-widest gap-2 shadow-none"
            >
              {isGeneratingTop10 ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              <span className="hidden sm:inline">
                Generate reports (max 10)
              </span>
              <span className="sm:hidden">Top 10</span>
            </Button>
          </div>
        </div>

        <PropertyGrid searchParams={searchParams} redirectUrl="properties/new?propertyId=" isPropertyOwner={isPropertyOwner} />

        {/* Back Button */}
        <div className="flex justify-center pt-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 group font-asap cursor-pointer"
          >
            <div className="size-8 rounded-full bg-[#F2FFFF] flex items-center justify-center text-[#1CA7A6] transition-transform group-hover:-translate-x-1 border border-[#1CA7A6]/20">
              <ChevronLeft className="size-5" />
            </div>
            <span className="text-sm font-bold text-[#1CA7A6] uppercase tracking-widest">
              Back
            </span>
          </button>
        </div>
      </div>

      <PdfGenerationLoader
        isOpen={isGeneratingTop10}
        message="Generating Reports..."
      />
    </Content>
  );
}
