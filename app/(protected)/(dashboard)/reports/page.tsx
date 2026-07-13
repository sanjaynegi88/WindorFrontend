"use client";

import { useState, useEffect, useMemo } from "react";
import { Content } from "@/components/layouts/crm/components/content";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, MapPin, FileText, Download, ChevronLeft } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  getPurchasedReports,
  generatePdfReport,
  generateProjectPdfReport,
  generateAllContractorPdfReport,
  generateContractorProjectPdfReport,
  generateOwnerProjectPdfReport,
  generateMultipleReports,
} from "@/lib/actions";
import { downloadPdfFromUrl, toPascalCase, cn } from "@/lib/utils";
import { toast } from "sonner";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportItem {
  id: string;
  type: string;
  source: string;
  propertyId: string | null;
  projectId: string | null;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  amountPaid: string;
  purchaseDate: string;
  raw: any;
}

interface ReportRowProps {
  item: ReportItem;
  onDownload: (item: ReportItem) => Promise<void>;
  downloadingId: string | null;
}

function ReportRow({ item, onDownload, downloadingId }: ReportRowProps) {
  const isDownloading = downloadingId === item.id;

  const getSourceBadge = (source: string) => {
    switch (source) {
      // case "bulk_reports":
      //   return {
      //     label: "Bulk Reports",
      //     className: "bg-[rgba(67,160,71,0.1)] text-[#43A047] border-[#43A047]",
      //   };
      case "full_property":
        return {
          label: "Complete Property Report",
          className: "bg-[rgba(28,167,166,0.12)] text-[#1CA7A6] border-[#1CA7A6]",
        };
      case "property_report":
        return {
          label: "Property Report",
          className: "bg-[rgba(31,42,68,0.1)] text-[#1F2A44] border-[#1F2A44]",
        };
      case "individual_project":
        return {
          label: "Individual Project",
          className: "bg-[rgba(255,193,7,0.12)] text-[#F59E0B] border-[#F59E0B]",
        };
      case "contractor_project":
        return {
          label: "Contractor Project",
          className: "bg-[rgba(34,166,153,0.12)] text-[#22a699] border-[#22a699]",
        };
      case "owner_project":
        return {
          label: "Owner Project",
          className: "bg-[rgba(103,58,183,0.12)] text-[#673ab7] border-[#673ab7]",
        };
      default:
        return {
          label: toPascalCase(source),
          className: "bg-gray-100 text-gray-600 border-gray-300",
        };
    }
  };

  const badge = getSourceBadge(item.source);

  const formattedDate = item.purchaseDate
    ? new Date(item.purchaseDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "N/A";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 bg-white border border-[#E8EDF2] rounded-[14px] hover:shadow-[0px_4px_20px_rgba(31,42,68,0.08)] transition-all">
      <div className="flex gap-3 md:gap-4 items-center min-w-0">
        <div className="shrink-0 p-3 bg-[#F2FFFF] rounded-xl border border-[#1CA7A6]/20">
          <FileText className="size-8 text-[#1CA7A6]" />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm md:text-base font-black text-[#1e293b] uppercase tracking-tight font-asap truncate">
            {item.title}
          </h3>
          <p className="flex items-center gap-1 text-xs md:text-sm font-bold text-gray-400">
            <MapPin className="size-3 shrink-0" />
            {item.address}
            {item.city ? ` • ${item.city}, ${item.state} ${item.zip}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border font-inter",
              badge.className
            )}>
              {badge.label}
            </span>
            <span className="text-[11px] font-medium text-gray-500 font-asap">
              Purchased: {formattedDate}
            </span>
            <span className="text-[11px] font-bold text-[#1F2A44] font-asap bg-gray-50 px-2 py-0.5 rounded-md">
              ${item.amountPaid}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          size="sm"
          onClick={() => onDownload(item)}
          disabled={isDownloading || !!downloadingId}
          className="h-8 md:h-10 px-4 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-widest gap-2"
        >
          {isDownloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download PDF
        </Button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [purchasedProperties, setPurchasedProperties] = useState<any[]>([]);
  const [purchasedProjects, setPurchasedProjects] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { key: "all", label: "All" },
    { key: "full_property", label: "Complete Property Report(Contractors & Owners)" },
    { key: "property_report", label: "Property Report(Contractors)" },
    { key: "contractor_project", label: "Contractor Project" },
    { key: "owner_project", label: "Owner Project" },
  ];

  const fetchPurchases = async (pageNum: number, append: boolean = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      else if (append) setLoadingMore(true);

      const response = await getPurchasedReports(pageNum, 15, debouncedSearchQuery);

      const properties = response?.data?.purchasedProperties || [];
      const projects = response?.data?.purchasedProjects || [];

      if (append) {
        setPurchasedProperties((prev) => [...prev, ...properties]);
        setPurchasedProjects((prev) => [...prev, ...projects]);
      } else {
        setPurchasedProperties(properties);
        setPurchasedProjects(projects);
      }

      setHasMore(response?.data?.pagination?.hasNextPage || false);
    } catch (error) {
      console.error("Failed to fetch purchased reports:", error);
      toast.error("Failed to load purchased reports");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPurchases(1, false);
  }, [debouncedSearchQuery]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPurchases(nextPage, true);
  };

  const allItems = useMemo(() => {
    const props = purchasedProperties.map((item) => {
      const source = item.purchaseInfo?.metadata?.source || "full_property";
      return {
        id: item.purchaseInfo?.id || item.property?.id,
        type: "property",
        source,
        propertyId: item.property?.id,
        projectId: null,
        title: item.property?.property_name || item.property?.address || "",
        address: item.property?.address || "",
        city: item.property?.city_name || item.property?.city?.name || "",
        state: item.property?.state_name || item.property?.state?.state_name || "",
        zip: item.property?.zip || "",
        amountPaid: item.purchaseInfo?.amountPaid || "",
        purchaseDate: item.purchaseInfo?.purchaseDate || "",
        raw: item,
      };
    });

    const projs = purchasedProjects.map((item) => {
      let source = item.purchaseInfo?.metadata?.source || "individual_project";
      if (source === "individual_project") {
        const projectRaw = item.project;
        const ownerId = item.property?.property_owner_id || projectRaw?.property_owner_id || item.property?.property_owner?.id || projectRaw?.property?.property_owner_id;
        const ownerEmail = item.property?.property_owner_email || projectRaw?.property_owner_email || item.property?.property_owner?.email || projectRaw?.property?.property_owner?.email;
        const isOwner =
          projectRaw?.created_by_type === 'PROPERTY_OWNER' ||
          projectRaw?.added_by === 'PROPERTY_OWNER' ||
          (projectRaw?.created_by && ownerId && projectRaw?.created_by === ownerId) ||
          (projectRaw?.created_by_email && ownerEmail && projectRaw?.created_by_email.toLowerCase() === ownerEmail.toLowerCase());
        const isContractor = !isOwner;
        source = isContractor ? "contractor_project" : "owner_project";
      }
      return {
        id: item.purchaseInfo?.id || item.project?.id,
        type: "project",
        source,
        propertyId: item.property?.id || item.project?.property_id,
        projectId: item.project?.id,
        title: item.project?.project_name || item.property?.address || "",
        address: item.property?.property_name || item.property?.address,
        city: item.property?.city_name || item.property?.city?.name || "",
        state: item.property?.state_name || item.property?.state?.state_name || "",
        zip: item.property?.zip || "",
        amountPaid: item.purchaseInfo?.amountPaid || "",
        purchaseDate: item.purchaseInfo?.purchaseDate || "",
        raw: item,
      };
    });

    // Merge and sort by purchaseDate descending
    return [...props, ...projs].sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      return dateB - dateA;
    });
  }, [purchasedProperties, purchasedProjects]);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return allItems;
    return allItems.filter((item) => item.source === activeTab);
  }, [allItems, activeTab]);

  const handleDownload = async (item: ReportItem) => {
    setDownloadingId(item.id);
    try {
      let downloadUrl = "";
      let filename = "";

      switch (item.source) {
        // case "bulk_reports":
        //   downloadUrl = await generateMultipleReports({ search: debouncedSearchQuery });
        //   filename = `bulk-reports-${item.id}.pdf`;
        //   break;
        case "full_property":
          if (!item.propertyId) throw new Error("Property ID is missing");
          downloadUrl = await generatePdfReport(item.propertyId);
          filename = `full-property-report-${item.address}.pdf`;
          break;
        case "property_report":
          if (!item.propertyId) throw new Error("Property ID is missing");
          downloadUrl = await generateAllContractorPdfReport(item.propertyId);
          filename = `full-contractor-projects-report-${item.address}.pdf`;
          break;
        case "contractor_project":
          if (!item.projectId) throw new Error("Project ID is missing");
          downloadUrl = await generateContractorProjectPdfReport(item.projectId);
          filename = `contractor-projects-report-${item.title}.pdf`;
          break;
        case "owner_project":
          if (!item.projectId) throw new Error("Project ID is missing");
          downloadUrl = await generateOwnerProjectPdfReport(item.projectId);
          filename = `owner-projects-report-${item.title}.pdf`;
          break;
        case "individual_project":
          if (!item.projectId) throw new Error("Project ID is missing");
          const projectRaw = item.raw?.project;
          const ownerId = item.raw?.property?.property_owner_id || projectRaw?.property_owner_id || item.raw?.property?.property_owner?.id || projectRaw?.property?.property_owner_id;
          const ownerEmail = item.raw?.property?.property_owner_email || projectRaw?.property_owner_email || item.raw?.property?.property_owner?.email || projectRaw?.property?.property_owner?.email;
          const isOwner =
            projectRaw?.created_by_type === 'PROPERTY_OWNER' ||
            projectRaw?.added_by === 'PROPERTY_OWNER' ||
            (projectRaw?.created_by && ownerId && projectRaw?.created_by === ownerId) ||
            (projectRaw?.created_by_email && ownerEmail && projectRaw?.created_by_email.toLowerCase() === ownerEmail.toLowerCase());
          const isContractor = !isOwner;
          if (isContractor) {
            downloadUrl = await generateContractorProjectPdfReport(item.projectId);
            filename = `contractor-projects-report-${item.projectId}.pdf`;
          } else {
            downloadUrl = await generateOwnerProjectPdfReport(item.projectId);
            filename = `owner-projects-report-${item.projectId}.pdf`;
          }
          break;
        default:
          throw new Error("Unknown report source type");
      }

      await downloadPdfFromUrl(downloadUrl, filename);
      toast.success("Report downloaded successfully");
    } catch (error: any) {
      console.error("Failed to download report:", error);
      toast.error(error.message || "Failed to download report");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Content className="p-0 bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] min-h-[calc(100vh-80px)] flex flex-col items-center py-4">
      <div className="w-full max-w-[1170px] px-4 py-6 md:py-12 space-y-6 md:space-y-10">
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-2xl md:text-4xl font-black text-[#1e293b] tracking-tighter uppercase">
            Reports
          </h1>
          <p className="text-gray-400 font-bold text-xs md:text-base">
            List of all purchased property reports.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-2">
          <div className="relative w-full max-w-[480px]">
            <Input
              placeholder="Search reports by title or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<Search className="size-5 text-[#B0BEC5]" />}
              endIcon={
                searchQuery.length > 0 ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[#B0BEC5] hover:text-[#1F2A44] transition-colors cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                ) : null
              }
              className="h-[52px] w-full rounded-xl border border-[#E8EDF2] focus:border-[#1CA7A6] focus:ring-1 focus:ring-[#1CA7A6] font-asap text-[15px] font-medium placeholder:text-[#B0BEC5] text-[#1F2A44]"
            />
          </div>
        </div>

        {/* Tab filters */}
        <div className="border-b border-[#D9D9D9] pt-2">
          <div className="flex flex-wrap justify-start gap-x-8 gap-y-4 pb-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tab.key === "all"
                ? allItems.length
                : allItems.filter((i) => i.source === tab.key).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative whitespace-nowrap text-sm md:text-base font-medium cursor-pointer font-asap pb-2 transition-all",
                    isActive ? "text-[#1CA7A6]" : "text-[#1F2A44] hover:text-[#1CA7A6]"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1CA7A6]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List content */}
        {loading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 md:h-28 rounded-[14px]" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <ReportRow
                key={item.id}
                item={item}
                onDownload={handleDownload}
                downloadingId={downloadingId}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="h-11 px-6 rounded-xl border-2 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#e6f7f5] font-black uppercase tracking-widest text-sm gap-2"
                >
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  Load More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-4xl border border-dashed border-[#E8EDF2]">
            <p className="text-gray-400 font-black uppercase tracking-widest text-base md:text-lg">
              {allItems.length === 0 ? "No purchased reports found." : "No reports in this category."}
            </p>
          </div>
        )}

        <div className="flex justify-center pt-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 group font-asap"
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

      <PdfGenerationLoader isOpen={!!downloadingId} message="Generating & Downloading Report PDF..." />
    </Content>
  );
}
