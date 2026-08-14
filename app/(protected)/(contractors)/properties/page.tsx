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

    const urlSearch = searchParamsHook.get("search") || "";
    const urlSearchBy = (searchParamsHook.get("searchBy") as SearchScope) || "all";
    const urlStateId = searchParamsHook.get("state_id") || searchParamsHook.get("state") || "";
    const urlCityId = searchParamsHook.get("city_id") || searchParamsHook.get("city") || "";

    const hasUrlSearchParams = Boolean(
      urlSearch.trim() ||
        urlSearchBy !== "all" ||
        (urlStateId && urlStateId !== "all") ||
        (urlCityId && urlCityId !== "all"),
    );

    if (hasUrlSearchParams) {
      const urlFilters = {
        search: urlSearch,
        searchBy: urlSearchBy,
        state: urlStateId || "all",
        city: urlCityId || "all",
        state_id: urlStateId !== "all" ? urlStateId : "",
        city_id: urlCityId !== "all" ? urlCityId : "",
      };
      setFilters(urlFilters);
      setAppliedFilters(urlFilters);
      setShowResults(true);
    } else if (view === "map") {
      setShowResults(true);
    }

    if (lat && lng) {
      setMapFocus({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (id) {
      setMapFocusId(id);
    }
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

    const params = new URLSearchParams();
    if (targetFilters.search) params.set("search", targetFilters.search);
    if (targetFilters.searchBy && targetFilters.searchBy !== "all") {
      params.set("searchBy", targetFilters.searchBy);
    }
    const activeStateId =
      targetFilters.state_id && targetFilters.state_id !== "all"
        ? targetFilters.state_id
        : targetFilters.state !== "all"
          ? targetFilters.state
          : "";
    const activeCityId =
      targetFilters.city_id && targetFilters.city_id !== "all"
        ? targetFilters.city_id
        : targetFilters.city !== "all"
          ? targetFilters.city
          : "";
    if (activeStateId) params.set("state_id", activeStateId);
    if (activeCityId) params.set("city_id", activeCityId);

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.pushState(null, "", newUrl);
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
          initialFilters={appliedFilters}
          showSearchButton={true}
          onChange={setFilters}
          onSearch={handleSearchTriggered}
          onSearchTriggered={handleSearchTriggered}
          isMapView={false}
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
            <PropertyGrid
              searchParams={searchParams}
              showActionButtons={true}
              showDetail={true}
              onOpenInMap={(lat, lng, id) => {
                setMapFocus({ lat, lng });
                setMapFocusId(id);
                const mapElement = document.getElementById("contractor-properties-map-view");
                if (mapElement) {
                  mapElement.scrollIntoView({ behavior: "smooth" });
                }
              }}
              mapSlot={
                <div id="contractor-properties-map-view" className="my-6">
                  <MapView
                    searchParams={searchParams}
                    focusCenter={mapFocus || undefined}
                    focusId={mapFocusId || undefined}
                    onFocusCleared={() => {
                      setMapFocus(null);
                      setMapFocusId(null);
                    }}
                  />
                </div>
              }
            />
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
