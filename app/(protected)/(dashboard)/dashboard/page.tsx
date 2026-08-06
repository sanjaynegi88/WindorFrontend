"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Content } from "@/components/layouts/crm/components/content";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HardHat,
  Home,
  Landmark,
  List,
  Loader2,
  Map,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPropertyListUser,
  generateMultipleReports,
  checkoutReports,
  getFreeTrialStatus,
  type FreeTrialStatusData,
} from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedSearchBar } from "@/components/common/unified-search-bar";
import { PropertyGrid } from "@/components/common/property-grid";
import MapView from "./map-view";
import { useUser } from "@/components/providers/user-provider";
import { ScreenLoader } from "@/components/common/screen-loader";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import { toast } from "sonner";
import { cn, downloadPdfFromUrl } from "@/lib/utils";
import type { SearchScope } from "@/components/common/unified-search-bar";
import Image from "next/image";
import Link from "next/link";

function DashboardPageContent() {
  const router = useRouter();
  const { user } = useUser();
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);
  const [isGeneratingTop10, setIsGeneratingTop10] = useState(false);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatusData | null>(
    null,
  );

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        const res = await getFreeTrialStatus();
        if (res.success && res.data?.data) {
          setTrialStatus(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch trial status:", err);
      }
    };
    fetchTrialStatus();
  }, []);

  const searchParamsHook = useSearchParams();

  const role = user?.role?.toLowerCase() || "";
  const isAdminOrInspector = role === "admin" || role === "city_inspector";
  const isAdmin = role === "admin";
  const isPropertyOwner = role === "property_owner";
  const isContractor = role === "contractor";

  const hasMembershipCookie =
    typeof document !== "undefined" &&
    document.cookie
      .split("; ")
      .some((c) => c.trim().startsWith("has-membership=true"));
  const hasMembership =
    isAdminOrInspector ||
    Boolean(user?.has_membership ?? user?.hasMembership ?? hasMembershipCookie);

  useEffect(() => {
    if (!searchParamsHook) return;
    const view = searchParamsHook.get("view");
    const lat = searchParamsHook.get("lat");
    const lng = searchParamsHook.get("lng");
    const id = searchParamsHook.get("id");

    if (view === "map") {
      if (hasMembership) {
        setViewMode("map");
        setShowResults(true);
      }

      // Clean up search params from the address bar so they don't persist on refresh or page navigation
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, "", cleanUrl);
    }
    if (lat && lng) {
      setMapFocus({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (id) {
      setMapFocusId(id);
    }
  }, [searchParamsHook, hasMembership]);

  const [filters, setFilters] = useState({
    search: "",
    searchBy: "all" as SearchScope,
    state: "all",
    city: "all",
    state_id: "",
    city_id: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const searchParams = useMemo(() => {
    const { search, searchBy, state, city, state_id, city_id } = appliedFilters;
    const activeStateId =
      state_id && state_id !== "all" ? state_id : state !== "all" ? state : "";
    const activeCityId =
      city_id && city_id !== "all" ? city_id : city !== "all" ? city : "";
    return {
      search: searchBy === "all" ? search : "",
      brandName: searchBy === "brand" ? search : "",
      color: searchBy === "color" ? search : "",
      style: searchBy === "style" ? search : "",
      state_id: activeStateId,
      city_id: activeCityId,
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

  const resultsVisible =
    hasMembership && (!isAdmin || !isContractor) && showResults;

  const handleSearchTriggered = (newFilters?: typeof filters) => {
    if (!hasMembership) {
      toast.error(
        "Active membership is required to search properties. Please purchase a membership plan.",
      );
      setShowResults(false);
      return;
    }
    const targetFilters = newFilters || filters;
    setAppliedFilters(targetFilters);
    setShowResults(true);
  };

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
          : "bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF]",
      )}
    >
      {isContractor ? (
        <div className="space-y-10 mt-3 w-full max-w-[1170px] px-4 flex flex-col items-center">
          {trialStatus && trialStatus.show_free_trial_dashboard && (
            <div
              className={cn(
                "w-full p-4 rounded-2xl border backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm",
                trialStatus.is_free_trial_active
                  ? "bg-amber-500/20 border-amber-500/40 text-white"
                  : trialStatus.is_expired
                    ? "bg-red-500/20 border-red-500/40 text-white"
                    : "bg-blue-500/20 border-blue-500/40 text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-base text-white flex items-center gap-2">
                    {trialStatus.is_free_trial_active ? (
                      <span>
                        Free Trial Active —{" "}
                        <strong>
                          {trialStatus.days_left}{" "}
                          {trialStatus.days_left === 1 ? "day" : "days"}{" "}
                          remaining
                        </strong>
                      </span>
                    ) : trialStatus.is_expired ? (
                      <span>Free Trial Expired</span>
                    ) : (
                      <span>Free Trial Status</span>
                    )}
                  </h4>
                  {trialStatus.display_message && (
                    <p className="text-xs sm:text-sm text-white/90">
                      {trialStatus.display_message}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href="/plans"
                className="shrink-0 px-4 py-2 bg-[#339FD0] hover:bg-[#2887b3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          )}
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-8 md:gap-12">
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
              <Link
                href="/projects"
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-4 border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
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
              </Link>

              <Link
                href="/properties/new"
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-4 border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
              >
                <div className="w-[94px] h-[94px] rounded-full bg-linear-to-b from-[#265D81] to-[#212B45] flex items-center justify-center shrink-0">
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
              </Link>

              <Link
                href="/my-projects"
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-4 border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
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
              </Link>

              <Link
                href="/reports"
                className="w-full max-w-[381px] cursor-pointer h-[160px] bg-white rounded-[20px] p-[17px] flex items-center gap-[19px] text-left border-4 border-transparent hover:border-[#20A8A7] hover:shadow-[0px_0px_20px_rgba(0,0,0,0.75)] active:scale-[0.98] transition-all duration-300 ease-in-out group"
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
              </Link>
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
                                          bg-[#ffffff] text-[#000000] hover:border-[#339FD0] w-(--width) md:w-(--md-width)`}
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
          {trialStatus && trialStatus.show_free_trial_dashboard && (
            <div
              className={cn(
                "w-full p-4 rounded-2xl border backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm",
                trialStatus.is_free_trial_active
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                  : trialStatus.is_expired
                    ? "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1F2A44]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#1F2A44]" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-base flex items-center gap-2">
                    {trialStatus.is_free_trial_active ? (
                      <span>
                        Free Trial Active —{" "}
                        <strong>
                          {trialStatus.days_left}{" "}
                          {trialStatus.days_left === 1 ? "day" : "days"}{" "}
                          remaining
                        </strong>
                      </span>
                    ) : trialStatus.is_expired ? (
                      <span>Free Trial Expired</span>
                    ) : (
                      <span>Free Trial Status</span>
                    )}
                  </h4>
                  {trialStatus.display_message && (
                    <p className="text-xs sm:text-sm opacity-90">
                      {trialStatus.display_message}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href="/plans"
                className="shrink-0 px-4 py-2 bg-[#1F2A44] hover:bg-[#1a212c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          )}
          {isPropertyOwner && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              <Link
                href={"/projects"}
                className="flex items-center justify-center h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
              >
                <Image
                  src="/assets/enter_project.png"
                  alt="Enter New Project"
                  width={50}
                  height={50}
                  className="w-[25px] h-[25px] md:w-[50px] md:h-[50px] object-contain"
                />
                Enter New Project
              </Link>
              <Link
                href={"/my-projects"}
                className="flex items-center justify-center h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
              >
                <Image
                  src="/assets/view_project.png"
                  alt="View Projects"
                  width={50}
                  height={50}
                  className="w-[25px] h-[25px] md:w-[50px] md:h-[50px] object-contain"
                />
                View Projects
              </Link>
            </div>
          )}
          {isAdmin && (
            <>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <Link
                  href={"/projects"}
                  className="flex items-center justify-center h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/enter_project.png"
                    alt="Enter New Project"
                    width={50}
                    height={50}
                    className="w-[25px] h-[25px] md:w-[50px] md:h-[50px] object-contain"
                  />
                  Enter New Project
                </Link>
                <Link
                  href={"/properties/new"}
                  className="flex items-center justify-center h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/enter_property.png"
                    alt="Enter New Property"
                    width={50}
                    height={50}
                    className="w-[25px] h-[25px] md:w-[50px] md:h-[50px] object-contain"
                  />
                  Enter New Property
                </Link>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <Link
                  href={"/all-projects"}
                  className="flex items-center justify-center h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/View_Report.png"
                    alt="View All Projects"
                    width={50}
                    height={50}
                    className="w-[25px] h-[25px] md:w-[50px] md:h-[50px] object-contain"
                  />
                  View All Projects
                </Link>
                <Link
                  href={"/my-projects"}
                  className="flex items-center justify-center h-[50px] md:h-[100px] w-full bg-[#1F2A44] gap-4 md:gap-10 hover:bg-[#1a212c] text-white font-bold text-[18px] md:text-[30px] leading-[22px] md:leading-[34px] rounded-[10px] transition-all shadow-none"
                >
                  <Image
                    src="/assets/View_Report.png"
                    alt="View My Projects"
                    width={50}
                    height={50}
                    className="w-[25px] h-[25px] md:w-[50px] md:h-[50px] object-contain"
                  />
                  View My Projects
                </Link>
              </div>
            </>
          )}

          {/* Unified Search Bar */}
          {!isContractor && (
            <UnifiedSearchBar
              showSearchButton={true}
              onChange={setFilters}
              onSearch={handleSearchTriggered}
              onSearchTriggered={handleSearchTriggered}
              isMapView={viewMode === "map"}
            />
          )}

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
                                          bg-[#F2FFFF] text-[#22a699] hover:border-[#1CA7A6] w-(--width) md:w-(--md-width)`}
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

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500 font-semibold font-asap">
          Loading Dashboard...
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
