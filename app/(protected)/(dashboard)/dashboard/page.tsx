"use client";

import { useState, useEffect, useMemo } from "react";
import { Content } from "@/components/layouts/crm/components/content";
import { ChevronLeft, ChevronRight, FileText, HardHat, Home, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPropertyListUser,
  generateMultipleReports,
  checkoutReports,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { PropertyCard } from "@/components/common/property-card";
import { UnifiedSearchBar } from "@/components/common/unified-search-bar";
import { PropertyGrid } from "@/components/common/property-grid";
import MapView from "./map-view";
import { useUser } from "@/components/providers/user-provider";
import { ScreenLoader } from "@/components/common/screen-loader";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { cn, downloadPdfFromUrl } from "@/lib/utils";
import type { SearchScope } from "@/components/common/unified-search-bar";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
  const isAdmin = role === "admin";
  const isPropertyOwner = role === "property_owner";
  const isContractor = role === "contractor";
  const resultsVisible = (!isAdmin || !isContractor) && showResults;

  useEffect(() => {
    if (!user) return;

    const fetchProperties = async () => {
      if (role === "property_owner") {
        try {
          setLoading(true);
          const propertiesRes = await getPropertyListUser();
          setUserProperties(propertiesRes?.data || propertiesRes || []);
        } catch (error: any) {
          toast.error(error.message || "Failed to load data");
          console.error("Failed to fetch properties:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProperties();
  }, [user, role]);

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

  if (loading) {
    return <ScreenLoader />;
  }

  return (
    <Content
      className={cn(
        "p-0 flex flex-col items-center w-full min-h-[calc(80vh-118px)]",
        isContractor
          ? "bg-linear-to-b from-[#265D81] to-[#212B45] justify-center py-12 md:py-20"
          : "bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF]"
      )}
    >
      {isContractor ? (
        <div className="space-y-10 mt-3">
          <div className="w-full max-w-[1170px] px-4 flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-8 md:gap-12">
            <div className="flex flex-col items-start gap-4 md:gap-[17px] w-full lg:w-[321px] shrink-0 text-left">
              <span className="font-inter font-bold text-[20px] leading-[24px] text-[#339FD0]">
                Welcome back, {user?.first_name || "Clark"}
              </span>
              <h1 className="font-inter font-bold text-[38px] leading-[46px] text-white">
                What would you like to do today?
              </h1>
              <div className="w-[75px] h-0 border-t-2 border-[#339FD0]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:max-w-[786px] justify-items-center">
              <button
                onClick={() => router.push("/projects")}
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-[4px] border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
              >
                <div className="w-[94px] h-[94px] rounded-full bg-linear-to-b from-[#265D81] to-[#212B45] flex items-center justify-center shrink-0">
                  <div className="relative w-[54px] h-[54px] flex items-center justify-center">
                    <Image
                      src="/assets/add_project_new.png"
                      alt="Enter New Project"
                      width={54}
                      height={54}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
                  <span className="font-inter font-bold text-[18px] leading-[22px] text-black">
                    Enter New Project
                  </span>
                  <span className="font-inter font-normal text-[15px] leading-[18px] text-black/70 mt-1 line-clamp-3">
                    Create a new project and get started.
                  </span>
                </div>
                <div className="w-[29px] h-[29px] bg-[#20A8A7] rounded-[4px] flex items-center justify-center shrink-0 self-center group-hover:bg-[#1CA7A6] transition-colors">
                  <ChevronRight className="size-4 text-white stroke-[3px]" />
                </div>
              </button>

              <button
                onClick={() => router.push("/properties/new")}
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-[4px] border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
              >
                <div className="w-[94px] h-[94px] rounded-full bg-gradient-to-b from-[#265D81] to-[#212B45] flex items-center justify-center shrink-0">
                  <div className="relative w-[52px] h-[52px] flex items-center justify-center">
                    <Image
                      src="/assets/add_property_new.png"
                      alt="Enter New Property"
                      width={52}
                      height={52}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
                  <span className="font-inter font-bold text-[18px] leading-[22px] text-black">
                    Enter New Property
                  </span>
                  <span className="font-inter font-normal text-[15px] leading-[18px] text-black/70 mt-1 line-clamp-3">
                    Add a new property and keep records organized.
                  </span>
                </div>
                <div className="w-[29px] h-[29px] bg-[#20A8A7] rounded-[4px] flex items-center justify-center shrink-0 self-center group-hover:bg-[#1CA7A6] transition-colors">
                  <ChevronRight className="size-4 text-white stroke-[3px]" />
                </div>
              </button>

              <button
                onClick={() => router.push("/my-projects")}
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-[4px] border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
              >
                <div className="w-[94px] h-[94px] rounded-full bg-linear-to-b from-[#265D81] to-[#212B45] flex items-center justify-center shrink-0">
                  <div className="relative w-[52px] h-[52px] flex items-center justify-center">
                    <Image
                      src="/assets/view_project_new.png"
                      alt="View Projects"
                      width={52}
                      height={52}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
                  <span className="font-inter font-bold text-[18px] leading-[22px] text-black">
                    View Projects
                  </span>
                  <span className="font-inter font-normal text-[15px] leading-[18px] text-black/70 mt-1 line-clamp-3">
                    Access and manage all your projects in one place
                  </span>
                </div>
                <div className="w-[29px] h-[29px] bg-[#20A8A7] rounded-[4px] flex items-center justify-center shrink-0 self-center group-hover:bg-[#1CA7A6] transition-colors">
                  <ChevronRight className="size-4 text-white stroke-[3px]" />
                </div>
              </button>

              <button
                onClick={() => router.push("/reports")}
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-[4px] border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
              >
                <div className="w-[94px] h-[94px] rounded-full bg-linear-to-b from-[#265D81] to-[#212B45] flex items-center justify-center shrink-0">
                  <div className="relative w-[50px] h-[50px] flex items-center justify-center">
                    <Image
                      src="/assets/view_report_new.png"
                      alt="View Reports"
                      width={50}
                      height={50}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
                  <span className="font-inter font-bold text-[18px] leading-[22px] text-black">
                    View Reports
                  </span>
                  <span className="font-inter font-normal text-[15px] leading-[18px] text-black/70 mt-1 line-clamp-3">
                    Review and download detailed reports and insights
                  </span>
                </div>
                <div className="w-[29px] h-[29px] bg-[#20A8A7] rounded-[4px] flex items-center justify-center shrink-0 self-center group-hover:bg-[#1CA7A6] transition-colors">
                  <ChevronRight className="size-4 text-white stroke-[3px]" />
                </div>
              </button>
            </div>
          </div>
          <div className="pt-[20px] md:pt-[60px] space-y-[20px] relative z-0">
            {/* Background Text */}
            <div className="absolute inset-0 top-2 md:top-6 lg:top-17 flex items-center justify-center pointer-events-none select-none z-0">
              <span className="text-[65px] md:text-[141px] font-bold font-asap leading-[75px] md:leading-[162px] uppercase opacity-20 bg-linear-to-b from-[#E5E8E8] to-[#1F2A44] bg-clip-text text-transparent whitespace-nowrap">
                TRUSTED BY
              </span>
            </div>

            {/* Heading */}
            <div className="relative z-10 text-center">
              <h3 className="text-[18px] md:text-[36px] font-bold font-asap leading-[21px] md:leading-[41px] tracking-tight text-white uppercase">
                TRUSTED BY.
              </h3>
            </div>

            {/* Pills */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 md:gap-4 px-4 md:px-0">
              {[
                {
                  name: "Homeowners",
                  image: "/assets/propertyowner.png",
                  width: "108px",
                  mdWidth: "198px",
                  fontSize: "11px",
                  mdFontSize: "16px",
                },
                {
                  name: "Insurance Firms",
                  image: "/assets/insurance_firm.png",
                  width: "120px",
                  mdWidth: "219px",
                  fontSize: "11px",
                  mdFontSize: "18px",
                },
                {
                  name: "Contractors",
                  image: "/assets/contractors_new.png",
                  width: "98px",
                  mdWidth: "180px",
                  fontSize: "11px",
                  mdFontSize: "18px",
                },
                {
                  name: "Mortgage Firms",
                  image: "/assets/mortgage_firms_new.png",
                  width: "114px",
                  mdWidth: "210px",
                  fontSize: "11px",
                  mdFontSize: "18px",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center justify-center gap-1 md:gap-2 h-[29px] md:h-[53px] rounded-[10px] border transition-all 
                                          bg-[#ffffff] text-[#000000] hover:border-[#339FD0] w-[var(--width)] md:w-[var(--md-width)]`}
                  style={
                    {
                      "--width": item.width,
                      "--md-width": item.mdWidth,
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={20}
                    height={20}
                    className="size-3 md:size-5 object-contain"
                  />
                  <span
                    className="font-medium font-asap"
                    style={{
                      fontSize: `clamp(${item.fontSize}, 2vw, ${item.mdFontSize})`,
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[1170px] px-4 py-8 md:py-16 space-y-[20px] md:space-y-[30px]">
          {isPropertyOwner && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              <Button
                onClick={() => router.push("/projects")}
                className="h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
              >
                <Image
                  src="/assets/enter_project.png"
                  alt="Enter New Project"
                  width={50}
                  height={50}
                />
                Enter New Project
              </Button>
              <Button
                onClick={() => router.push("/my-projects")}
                className="h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
              >
                <Image
                  src="/assets/view_project.png"
                  alt="View Projects"
                  width={50}
                  height={50}
                />
                View Projects
              </Button>
            </div>
          )}
          {isAdmin && (
            <>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <Button
                  onClick={() => router.push("/projects")}
                  className="h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/enter_project.png"
                    alt="Enter New Project"
                    width={50}
                    height={50}
                  />
                  Enter New Project
                </Button>
                <Button
                  onClick={() => router.push("/properties/new")}
                  className="h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/enter_property.png"
                    alt="View Projects"
                    width={50}
                    height={50}
                  />
                  Enter New Property
                </Button>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <Button
                  onClick={() => router.push("/all-projects")}
                  className="h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/View_Report.png"
                    alt="Enter New Project"
                    width={50}
                    height={50}
                  />
                  View All Projects
                </Button>
                <Button
                  onClick={() => router.push("/my-projects")}
                  className="h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/View_Report.png"
                    alt="View My Projects"
                    width={50}
                    height={50}
                  />
                  View My Projects
                </Button>
              </div>
            </>
          )}

          {/* Unified Search Bar */}
          {!isContractor &&
            <UnifiedSearchBar
              showSearchButton={true}
              onChange={setFilters}
              onSearchTriggered={() => setShowResults(true)}
            />
          }

          {resultsVisible && (
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
              {viewMode === "list" && (
                <PropertyGrid searchParams={searchParams} showActionButtons={true} showDetail={true} />
              )}
              {viewMode === "map" && <MapView searchParams={searchParams} />}
            </div>
          )}

          {!resultsVisible && (
            <div className="pt-[20px] md:pt-[60px] space-y-[20px] relative z-0">
              {/* Background Text */}
              <div className="absolute inset-0 top-2 md:top-6 lg:top-17 flex items-center justify-center pointer-events-none select-none z-0">
                <span className="text-[65px] md:text-[141px] font-bold font-asap leading-[75px] md:leading-[162px] uppercase opacity-20 bg-linear-to-b from-[#E5E8E8] to-[#1F2A44] bg-clip-text text-transparent whitespace-nowrap">
                  TRUSTED BY
                </span>
              </div>

              {/* Heading */}
              <div className="relative z-10 text-center">
                <h3 className="text-[18px] md:text-[36px] font-bold font-asap leading-[21px] md:leading-[41px] tracking-tight text-[#1F2A44] uppercase">
                  TRUSTED BY.
                </h3>
              </div>

              {/* Pills */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 md:gap-4 px-4 md:px-0">
                {[
                  {
                    name: "Homeowners",
                    icon: Home,
                    width: "108px",
                    mdWidth: "198px",
                    fontSize: "11px",
                    mdFontSize: "16px",
                  },
                  {
                    name: "Insurance Firms",
                    icon: ShieldCheck,
                    width: "120px",
                    mdWidth: "219px",
                    fontSize: "11px",
                    mdFontSize: "18px",
                  },
                  {
                    name: "Contractors",
                    icon: HardHat,
                    width: "98px",
                    mdWidth: "180px",
                    fontSize: "11px",
                    mdFontSize: "18px",
                  },
                  {
                    name: "Mortgage Firms",
                    icon: Landmark,
                    width: "114px",
                    mdWidth: "210px",
                    fontSize: "11px",
                    mdFontSize: "18px",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-center gap-1 md:gap-2 h-[29px] md:h-[53px] rounded-[10px] border transition-all 
                                          bg-[#F2FFFF] text-[#22a699] hover:border-[#1CA7A6] w-[var(--width)] md:w-[var(--md-width)]`}
                    style={
                      {
                        "--width": item.width,
                        "--md-width": item.mdWidth,
                      } as React.CSSProperties
                    }
                  >
                    <item.icon className="size-3 md:size-5 text-[#22a699]" />
                    <span
                      className="font-medium font-asap"
                      style={{
                        fontSize: `clamp(${item.fontSize}, 2vw, ${item.mdFontSize})`,
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <PdfGenerationLoader
        isOpen={isGeneratingTop10}
        message="Generating Reports..."
      />
    </Content>
  );
}
