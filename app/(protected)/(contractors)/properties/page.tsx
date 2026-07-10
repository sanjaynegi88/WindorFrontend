"use client";

import { useState, useMemo } from "react";
import { PropertyGrid } from '@/components/common/property-grid'
import { Content } from '@/components/layouts/crm/components/content'
import { Button } from '@/components/ui/button'
import React from 'react'
import { UnifiedSearchBar } from "@/components/common/unified-search-bar";
import { FileText, Loader2 } from "lucide-react";
import { generateMultipleReports, checkoutReports } from "@/lib/actions";
import { useUser } from "@/components/providers/user-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import type { SearchScope } from "@/components/common/unified-search-bar";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import MapView from "../../(dashboard)/dashboard/map-view";
import { downloadPdfFromUrl } from "@/lib/utils";

export default function PropertyPage() {
    const { user } = useUser();
    const [showResults, setShowResults] = useState(false);
    const [viewMode] = useState<"list" | "map">("list");
    const [isGeneratingTop10, setIsGeneratingTop10] = useState(false);

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

    const role = user?.role?.toLowerCase() || "";
    const isAdminOrInspector = role === "admin" || role === "city_inspector";

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
                    onSearchTriggered={() => setShowResults(true)}
                />

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
                    {viewMode === "list" && (
                        <PropertyGrid searchParams={searchParams} showActionButtons={true} showDetail={true} />
                    )}
                    {viewMode === "map" && <MapView searchParams={searchParams} />}
                </div>
            </div>

            <PdfGenerationLoader
                isOpen={isGeneratingTop10}
                message="Generating Reports..."
            />
        </Content>
    )
}
