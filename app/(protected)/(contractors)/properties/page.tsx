"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { PropertyGrid } from "@/components/common/property-grid";
import { Content } from "@/components/layouts/crm/components/content";
import { Button } from "@/components/ui/button";
import React from "react";
import { UnifiedSearchBar } from "@/components/common/unified-search-bar";
import { FileText, List, Loader2, Map } from "lucide-react";
import { generateMultipleReports, checkoutReports } from "@/lib/actions";
import { useUser } from "@/components/providers/user-provider";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { SearchScope } from "@/components/common/unified-search-bar";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import MapView from "../../(dashboard)/dashboard/map-view";
import { cn, downloadPdfFromUrl } from "@/lib/utils";

function PropertyPageContent() {
  const { user } = useUser();
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);
  const [isGeneratingTop10, setIsGeneratingTop10] = useState(false);

  const searchParamsHook = useSearchParams();

  useEffect(() => {
    if (!searchParamsHook) return;
    const view = searchParamsHook.get("view");
    const lat = searchParamsHook.get("lat");
    const lng = searchParamsHook.get("lng");
    const id = searchParamsHook.get("id");

    if (view === "map") {
      setViewMode("map");
      setShowResults(true);
    }
    if (lat && lng) {
      setMapFocus({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (id) {
      setMapFocusId(id);
    }

    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
  }, [searchParamsHook]);

  const [filters, setFilters] = useState({
    search: "",
    searchBy: "all" as SearchScope,
    state: "all",
    city: "all",
    state_id: "",
    city_id: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const role = user?.role?.toLowerCase() || "";
  const isAdminOrInspector = role === "admin" || role === "city_inspector";

  const searchParams = useMemo(() => {
    const { search, searchBy, state, city, state_id, city_id } = appliedFilters;
    return {
      search: searchBy === "all" ? search : "",
      brandName: searchBy === "brand" ? search : "",
      color: searchBy === "color" ? search : "",
      style: searchBy === "style" ? search : "",
      state_id: state_id || (state !== "all" ? state : ""),
      city_id: city_id || (city !== "all" ? city : ""),
    };
  }, [appliedFilters]);

  const reportFilters = useMemo(() => {
    const { search, searchBy, state_id, city_id } = appliedFilters;
    return {
      search,
      brandName: searchBy === "brand" ? search : "",
      color: searchBy === "color" ? search : "",
      style: searchBy === "style" ? search : "",
      state_id: state_id,
      city_id: city_id,
    };
  }, [appliedFilters]);

  const handleSearchTriggered = (newFilters?: typeof filters) => {
    const targetFilters = newFilters || filters;
    setAppliedFilters(targetFilters);
    setShowResults(true);
  };

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
        <UnifiedSearchBar
          showSearchButton={true}
          onChange={setFilters}
          onSearch={handleSearchTriggered}
          onSearchTriggered={handleSearchTriggered}
          isMapView={viewMode === "map"}
        />

        {showResults && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-4xl font-black text-[#1e293b] tracking-tighter uppercase font-asap">
                Properties
              </h2>
              {role !== "contractor" && (
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
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium h-auto transition-all",
                  viewMode === "list"
                    ? "bg-[#1F2A44] text-white shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground",
                )}
              >
                <List className="size-4 mr-2" />
                List View
              </Button>
              <Button
                onClick={() => setViewMode("map")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium h-auto transition-all",
                  viewMode === "map"
                    ? "bg-[#1F2A44] text-white shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground",
                )}
              >
                <Map className="size-4 mr-2" />
                Map View
              </Button>
            </div>
            {viewMode === "list" && (
              <PropertyGrid
                searchParams={searchParams}
                showActionButtons={true}
                showDetail={true}
                onOpenInMap={(lat, lng, id) => {
                  setMapFocus({ lat, lng });
                  setMapFocusId(id);
                  setViewMode("map");
                }}
              />
            )}
            {viewMode === "map" && (
              <MapView
                searchParams={searchParams}
                focusCenter={mapFocus || undefined}
                focusId={mapFocusId || undefined}
                onFocusCleared={() => {
                  setMapFocus(null);
                  setMapFocusId(null);
                }}
              />
            )}
          </div>
        )}
      </div>

      <PdfGenerationLoader
        isOpen={isGeneratingTop10}
        message="Generating Reports..."
      />
    </Content>
  );
}

export default function PropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[#1CA7A6]" />
        </div>
      }
    >
      <PropertyPageContent />
    </Suspense>
  );
}
