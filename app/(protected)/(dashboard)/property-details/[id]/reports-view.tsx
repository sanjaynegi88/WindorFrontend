import { useEffect, useState } from "react";
import { Loader2, FileText, ShoppingCart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, downloadPdfFromUrl, getErrorMessage } from "@/lib/utils";
import {
  generatePdfReport,
  generateOwnerProjectPdfReport,
  purchaseReport,
  purchaseProject,
  getReportUsage,
  getprojectListingOfProperty,
  purchaseAllContractorReports,
  generateAllContractorPdfReport,
  generateContractorProjectPdfReport,
} from "@/lib/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import { useUser } from "@/components/providers/user-provider";
import { Installation } from "./types";

interface ReportsViewProps {
  installations: Installation[];
  propertyId: string;
  isPurchased?: boolean;
  components?: any[];
  onBack: () => void;
  propertyOwnerEmail: string;
  componentsData: any;
}

export const ReportsView = ({
  installations,
  propertyId,
  isPurchased = false,
  components = [],
  onBack,
  propertyOwnerEmail,
  componentsData,
}: ReportsViewProps) => {
  const { user, role } = useUser();
  const totalProjectsCount = (componentsData?.projects ?? []).length;
  const contractorProjectsCount = (componentsData?.projects ?? []).filter(
    (p: any) => p.created_by_type === "CONTRACTOR" || p.added_by === "CONTRACTOR"
  ).length;
  const homeownerProjectsCount = (componentsData?.projects ?? []).filter(
    (p: any) => p.created_by_type === "PROPERTY_OWNER" || p.added_by === "PROPERTY_OWNER"
  ).length;
  const isOwnerOfProperty = role === "property_owner" && !!propertyOwnerEmail && user?.email?.toLowerCase() === propertyOwnerEmail?.toLowerCase();
  const isAdmin = role === "admin";
  const isCityInspector = role === "city_inspector";
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [reportUsage, setReportUsage] = useState<any>(null);
  const [purchased, setPurchased] = useState(isPurchased);

  const [showAllContractorDialog, setShowAllContractorDialog] = useState(false);
  const [showContractorProjectsDialog, setShowContractorProjectsDialog] = useState(false);
  const [showHomeOwnerProjectsDialog, setShowHomeOwnerProjectsDialog] = useState(false);
  const [generatingProjects, setGeneratingProjects] = useState<Record<string, boolean>>({});

  const [contractorProjects, setContractorProjects] = useState<any[]>([]);
  const [homeownerProjects, setHomeownerProjects] = useState<any[]>([]);
  const [loadingContractor, setLoadingContractor] = useState(false);
  const [loadingHomeowner, setLoadingHomeowner] = useState(false);

  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [selectedHomeowners, setSelectedHomeowners] = useState<string[]>([]);
  const [isBulkPurchasing, setIsBulkPurchasing] = useState(false);

  const [allContractorPurchased, setAllContractorPurchased] = useState<boolean>(
    componentsData?.is_all_contractor_purchased === true ||
    false
  );
  console.log("allContractorPurchased", allContractorPurchased);
  console.log("componentsData", componentsData);
  const [isGeneratingAllContractor, setIsGeneratingAllContractor] = useState(false);
  const hasAllContractorAccess = allContractorPurchased || isPurchased || isAdmin || isCityInspector || isOwnerOfProperty;

  useEffect(() => {
    setAllContractorPurchased(
      componentsData?.all_contractor_purchased === true ||
      componentsData?.is_all_contractor_purchased === true ||
      componentsData?.all_contractors_purchased === true ||
      false
    );
  }, [componentsData]);

  const downloadAllContractorReport = async () => {
    setIsGeneratingAllContractor(true);
    try {
      const url = await generateAllContractorPdfReport(
        propertyId
      );
      await downloadPdfFromUrl(
        url,
        `all-contractor-projects-report-${propertyId}.pdf`
      );
      toast.success("Report downloaded successfully");
      setAllContractorPurchased(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to download report");
    } finally {
      setIsGeneratingAllContractor(false);
    }
  };

  const handleAllContractorPurchase = async () => {
    setShowAllContractorDialog(false);
    setIsGeneratingAllContractor(true);
    try {
      const response = await purchaseAllContractorReports(propertyId);
      if (!response.success) {
        toast.error(response.message);
        setIsGeneratingAllContractor(false);
        return;
      }
      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        localStorage.setItem("pending_report_id", propertyId);
        localStorage.setItem("pending_report_type", "all-contractor");
        window.location.href = checkoutUrl;
      } else {
        setAllContractorPurchased(true);
        await downloadAllContractorReport();
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong."));
      setIsGeneratingAllContractor(false);
    }
  };

  useEffect(() => {
    if (!showContractorProjectsDialog) {
      setSelectedContractors([]);
    }
  }, [showContractorProjectsDialog]);

  useEffect(() => {
    if (!showHomeOwnerProjectsDialog) {
      setSelectedHomeowners([]);
    }
  }, [showHomeOwnerProjectsDialog]);

  useEffect(() => {
    if (showContractorProjectsDialog) {
      setLoadingContractor(true);
      getprojectListingOfProperty(propertyId, undefined, "CONTRACTOR")
        .then((res) => {
          const projects = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          setContractorProjects(projects);
        })
        .catch((err) => {
          console.error("Failed to fetch contractor projects:", err);
          toast.error("Failed to load contractor projects");
        })
        .finally(() => setLoadingContractor(false));
    }
  }, [showContractorProjectsDialog, propertyId]);

  useEffect(() => {
    if (showHomeOwnerProjectsDialog) {
      setLoadingHomeowner(true);
      getprojectListingOfProperty(propertyId, undefined, "PROPERTY_OWNER")
        .then((res) => {
          const projects = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          setHomeownerProjects(projects);
        })
        .catch((err) => {
          console.error("Failed to fetch homeowner projects:", err);
          toast.error("Failed to load homeowner projects");
        })
        .finally(() => setLoadingHomeowner(false));
    }
  }, [showHomeOwnerProjectsDialog, propertyId]);

  useEffect(() => {
    setPurchased(isPurchased);
  }, [isPurchased]);

  useEffect(() => {
    if (role === "insurance_company") {
      getReportUsage()
        .then((res) => setReportUsage(res.data))
        .catch(() => { });
    }
  }, [role]);

  const downloadReport = async (projectType?: string) => {
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(
        propertyId,
        projectType,
        user?.role,
      );
      await downloadPdfFromUrl(
        url,
        projectType
          ? `property-report-${propertyId}-${projectType}.pdf`
          : `property-report-${propertyId}.pdf`
      );
      toast.success("Report downloaded successfully");
      setPurchased(true);
      if (user?.role === "insurance_company") {
        getReportUsage()
          .then((res) => setReportUsage(res.data))
          .catch(() => { });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download report");
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  };

  const showGenerateOption =
    (role === "property_owner" && (isOwnerOfProperty || purchased)) ||
    role === "admin" ||
    role === "city_inspector" ||
    (role === "contractor" && (purchased)) ||
    (role === "manufacturer" && purchased) ||
    (role === "realtor" && purchased) ||
    (role === "insurance_company" &&
      (purchased || (reportUsage && reportUsage.remaining > 0)));

  const showBuyOption =
    totalProjectsCount > 0 &&
    ((role === "property_owner" && !isOwnerOfProperty && !purchased) ||
      (role === "contractor" && !purchased) ||
      (role === "manufacturer" && !purchased) ||
      (role === "realtor" && !purchased) ||
      (role === "insurance_company" &&
        !purchased &&
        (!reportUsage || reportUsage.remaining === 0)));

  const handlePurchaseReport = async () => {
    setIsGenerating(true);
    try {
      const response = await purchaseReport(propertyId);
      if (!response.success) {
        toast.error(response.message);
        setIsGenerating(false);
        return;
      }
      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        localStorage.setItem("pending_report_id", propertyId);
        localStorage.setItem("pending_report_type", "single");
        window.location.href = checkoutUrl;
      } else {
        setPurchased(true);
        await downloadReport();
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Something went wrong."));
      setIsGenerating(false);
    }
  };

  const handleGenerateProjectReport = async (projectId: string, projectName: string) => {
    setGeneratingProjects((prev) => ({ ...prev, [projectId]: true }));
    try {
      const isContractor = contractorProjects.some(
        (proj: any) => String(proj.id ?? proj.project_id ?? proj._id) === String(projectId)
      );
      const url = isContractor
        ? await generateContractorProjectPdfReport(projectId)
        : await generateOwnerProjectPdfReport(projectId);
      const filename = isContractor
        ? `contractor-projects-report-${projectName}.pdf`
        : `owner-projects-report-${projectName}.pdf`;
      await downloadPdfFromUrl(url, filename);
      toast.success("Report downloaded successfully");
    } catch (error: any) {
      console.error("Download project report error:", error);
      toast.error(getErrorMessage(error, "Failed to download report"));
    } finally {
      setGeneratingProjects((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handlePurchaseProjectReport = async (projectId: string) => {
    try {
      const response = await purchaseProject(projectId, propertyId);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        const isContractor = contractorProjects.some(
          (proj: any) => String(proj.id ?? proj.project_id ?? proj._id) === String(projectId)
        );
        localStorage.setItem("pending_report_id", projectId);
        localStorage.setItem("pending_report_type", isContractor ? "contractor-project" : "project");
        localStorage.setItem("pending_report_property_id", propertyId);
        window.location.href = checkoutUrl;
      } else {
        toast.success("Report purchased successfully");
        setContractorProjects((prev) =>
          prev.map((proj) => {
            const pid = proj.id ?? proj.project_id ?? proj._id;
            if (String(pid) === String(projectId)) {
              return { ...proj, is_purchased: true, project_purchased: true };
            }
            return proj;
          })
        );
        setHomeownerProjects((prev) =>
          prev.map((proj) => {
            const pid = proj.id ?? proj.project_id ?? proj._id;
            if (String(pid) === String(projectId)) {
              return { ...proj, is_purchased: true, project_purchased: true };
            }
            return proj;
          })
        );
        await handleGenerateProjectReport(projectId, "Project Report");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong."));
    }
  };

  const handlePurchaseMultipleProjects = async (projectIds: string[]) => {
    if (projectIds.length === 0) return;
    setIsBulkPurchasing(true);
    try {
      const response = await purchaseProject(projectIds, propertyId);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        const isContractor = projectIds.some(pid =>
          contractorProjects.some((proj: any) => String(proj.id ?? proj.project_id ?? proj._id) === String(pid))
        );
        localStorage.setItem("pending_report_id", projectIds.join(','));
        localStorage.setItem("pending_report_type", isContractor ? "contractor-project" : "project");
        localStorage.setItem("pending_report_property_id", propertyId);
        window.location.href = checkoutUrl;
      } else {
        toast.success("Reports purchased successfully");
        setContractorProjects((prev) =>
          prev.map((proj) => {
            const pid = proj.id ?? proj.project_id ?? proj._id;
            if (projectIds.includes(String(pid))) {
              return { ...proj, is_purchased: true };
            }
            return proj;
          })
        );
        setHomeownerProjects((prev) =>
          prev.map((proj) => {
            const pid = proj.id ?? proj.project_id ?? proj._id;
            if (projectIds.includes(String(pid))) {
              return { ...proj, is_purchased: true };
            }
            return proj;
          })
        );

        setSelectedContractors([]);
        setSelectedHomeowners([]);

        for (const pid of projectIds) {
          await handleGenerateProjectReport(pid, "Project Report");
        }
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong."));
    } finally {
      setIsBulkPurchasing(false);
    }
  };

  return (
    <div className="space-y-[20px] md:space-y-[32px] font-asap">
      {/* Header */}
      <div className="px-4 md:px-[76px]">
        <h2 className="text-[16px] md:text-[20px] font-bold text-[#1F2A44] uppercase tracking-wide font-asap">
          Report
        </h2>
        {totalProjectsCount === 0 ? (
          <div className="mt-4 p-6 text-center rounded-[14px] border border-dashed border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)]">
            <p className="text-sm font-semibold text-red-500 font-asap">
              No reports available
            </p>
          </div>
        ) : (
          <p className="mt-1 text-[12px] md:text-[13px] text-[#708090] font-asap">
            Download or purchase individual reports or all contractor reports for this property.
          </p>
        )}
      </div>

      {totalProjectsCount > 0 && (
        <>
          <div>
            {(showGenerateOption || showBuyOption) && (
              <div className="px-4 md:px-[76px]">
                <div className="rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-[rgba(28,167,166,0.1)] flex items-center justify-center text-[#1CA7A6]">
                        <FileText className="size-5" />
                      </div>
                      <h4 className="text-[16px] font-bold text-[#1F2A44] uppercase tracking-wide font-inter">
                        Full Property Report
                      </h4>
                    </div>
                    <p className="text-[13px] text-[#708090] leading-relaxed max-w-[600px] font-asap">
                      Download or purchase the complete comprehensive report containing all contractor and homeowner projects on this property.
                    </p>
                  </div>
                  <div className="w-full md:w-auto min-w-[240px]">
                    {showGenerateOption ? (
                      <Button
                        onClick={() => downloadReport()}
                        disabled={isGenerating}
                        className="w-full h-12 rounded-xl bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
                      >
                        {isGenerating && <Loader2 className="size-4 animate-spin" />}
                        {isGenerating ? "Downloading…" : "Download Full Report"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePurchaseReport}
                        disabled={isGenerating}
                        className="w-full h-12 rounded-xl bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
                      >
                        {isGenerating ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                        {isGenerating ? "Processing…" : "Buy Full Report"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action area: Three options */}
          <div className="px-4 md:px-[76px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1: All Contractor Reports */}
              <div className="rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)] p-6 flex flex-col justify-between min-h-[180px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-[rgba(28,167,166,0.1)] flex items-center justify-center text-[#1CA7A6]">
                      <FileText className="size-4.5" />
                    </div>
                    <h4 className="text-[16px] font-bold text-[#1F2A44] uppercase tracking-wide font-inter">
                      Complete ALL Report
                    </h4>
                  </div>
                  <p className="text-[13px] text-[#708090] leading-relaxed font-asap">
                    Access or purchase all contractor projects reports on this property.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      if (hasAllContractorAccess) {
                        downloadAllContractorReport();
                      } else {
                        setShowAllContractorDialog(true);
                      }
                    }}
                    disabled={isGeneratingAllContractor}
                    className="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm uppercase tracking-widest gap-2 shadow-none"
                  >
                    {isGeneratingAllContractor ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      hasAllContractorAccess ? "Download" : "Access Reports"
                    )}
                  </Button>
                </div>
              </div>

              {/* Option 2: Individual Contractor Projects */}
              <div className="rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)] p-6 flex flex-col justify-between min-h-[180px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-[rgba(28,167,166,0.1)] flex items-center justify-center text-[#1CA7A6]">
                      <FileText className="size-4.5" />
                    </div>
                    <h4 className="text-[16px] font-bold text-[#1F2A44] uppercase tracking-wide font-inter">
                      Project Report – Regular
                    </h4>
                  </div>
                  <p className="text-[13px] text-[#708090] leading-relaxed font-asap">
                    View, purchase, and download reports for individual contractor projects.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => setShowContractorProjectsDialog(true)}
                    className="w-full h-9 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-sm uppercase tracking-widest gap-2 shadow-none"
                  >
                    View Projects
                  </Button>
                </div>
              </div>

              {/* Option 3: Home Owner Projects */}
              <div className="rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)] p-6 flex flex-col justify-between min-h-[180px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-[rgba(28,167,166,0.1)] flex items-center justify-center text-[#1CA7A6]">
                      <FileText className="size-4.5" />
                    </div>
                    <h4 className="text-[16px] font-bold text-[#1F2A44] uppercase tracking-wide font-inter">
                      Project Report – Homeowner
                    </h4>
                  </div>
                  <p className="text-[13px] text-[#708090] leading-relaxed font-asap">
                    View, purchase, and download reports for individual homeowner projects.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => setShowHomeOwnerProjectsDialog(true)}
                    className="w-full h-9 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-sm uppercase tracking-widest gap-2 shadow-none"
                  >
                    View Projects
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dialog 1: All Contractor Reports */}
      <Dialog open={showAllContractorDialog} onOpenChange={setShowAllContractorDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              {hasAllContractorAccess ? "All Contractor Reports" : "Purchase All Contractor Reports"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
              {hasAllContractorAccess
                ? "You have access to all contractor reports for this property. Click below to download the PDF report."
                : "This feature allows you to purchase access to all contractor reports associated with this property at once. Would you like to proceed to payment?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAllContractorDialog(false)}
              className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-gray-50 flex-1"
            >
              Cancel
            </Button>
            {hasAllContractorAccess ? (
              <Button
                onClick={downloadAllContractorReport}
                disabled={isGeneratingAllContractor}
                className="h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest flex-1 gap-2 animate-none"
              >
                {isGeneratingAllContractor ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  "Download"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleAllContractorPurchase}
                disabled={isGeneratingAllContractor}
                className="h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest flex-1 gap-2 animate-none"
              >
                {isGeneratingAllContractor ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Purchase Now"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Contractor Projects List */}
      <Dialog open={showContractorProjectsDialog} onOpenChange={setShowContractorProjectsDialog}>
        <DialogContent className="sm:max-w-[550px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Project Report – Regular
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              A list of contractor projects on this property. You can purchase or download reports for each project.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {loadingContractor ? (
              <div className="py-12 flex justify-center items-center gap-2 text-[#708090] text-sm">
                <Loader2 className="size-5 animate-spin text-[#1CA7A6]" />
                Loading projects...
              </div>
            ) : contractorProjects.length === 0 ? (
              <div className="py-12 text-center text-[#708090] text-sm">
                No contractor projects found for this property.
              </div>
            ) : (
              contractorProjects.map((project: any) => {
                const projectId = project.id ?? project.project_id ?? project._id;
                const isProjectGenerating = !!generatingProjects[projectId];
                const isProjectPurchased = project.project_purchased === true || project.is_purchased === true;
                const isSelected = selectedContractors.includes(String(projectId));
                const projectPrice = project.project_price ?? 29;

                const hasProjectAccess =
                  isProjectPurchased ||
                  allContractorPurchased ||
                  isPurchased ||
                  isAdmin ||
                  isCityInspector ||
                  isOwnerOfProperty;

                return (
                  <div
                    key={projectId}
                    className="flex items-start p-4 rounded-xl border border-[#E8EDF2] bg-white gap-4 hover:shadow-xs transition-shadow"
                  >
                    <div className="pt-1 select-none">
                      <Checkbox
                        checked={isSelected}
                        disabled={hasProjectAccess}
                        onCheckedChange={(checked) => {
                          const pidStr = String(projectId);
                          if (checked) {
                            setSelectedContractors((prev) => [...prev, pidStr]);
                          } else {
                            setSelectedContractors((prev) => prev.filter((id) => id !== pidStr));
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1F2A44] font-inter">
                          {project.project_name || "Untitled Project"}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-[rgba(28,167,166,0.08)] text-[#1CA7A6] border border-[#1CA7A6]/20 px-2 py-0.5 rounded-full font-medium font-inter">
                            {project.project_type || "General"}
                          </span>
                          {project.is_confirmed && (
                            <span className="text-[10px] text-[#43A047] font-semibold">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {hasProjectAccess ? (
                          <Button
                            onClick={() => handleGenerateProjectReport(projectId, project.project_name)}
                            disabled={isProjectGenerating}
                            className="h-8 px-3 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
                          >
                            {isProjectGenerating ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <FileText className="size-3" />
                            )}
                            {isProjectGenerating ? "Downloading…" : "Download"}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchaseProjectReport(projectId)}
                            className="h-8 px-3 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
                          >
                            <ShoppingCart className="size-3" />
                            Buy Report (${projectPrice})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedContractors.length > 0 && (
            <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center justify-between mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-xs font-semibold text-[#708090]">
                {selectedContractors.length} {selectedContractors.length === 1 ? 'project' : 'projects'} selected
              </span>
              <Button
                onClick={() => handlePurchaseMultipleProjects(selectedContractors)}
                disabled={isBulkPurchasing}
                className="h-8 px-4 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
              >
                {isBulkPurchasing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShoppingCart className="size-3.5" />
                )}
                Pay Selected (${selectedContractors.reduce((total, id) => {
                  const proj = contractorProjects.find((p) => String(p.id ?? p.project_id ?? p._id) === id);
                  return total + (proj?.project_price ?? 29);
                }, 0)})
              </Button>
            </div>
          )}
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" className="h-10 w-full rounded-xl font-bold uppercase tracking-widest border-2">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 3: Home Owner Projects List */}
      <Dialog open={showHomeOwnerProjectsDialog} onOpenChange={setShowHomeOwnerProjectsDialog}>
        <DialogContent className="sm:max-w-[550px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Project Report – Homeowner
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              A list of homeowner projects on this property. You can purchase or download reports for each project.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {loadingHomeowner ? (
              <div className="py-12 flex justify-center items-center gap-2 text-[#708090] text-sm">
                <Loader2 className="size-5 animate-spin text-[#1CA7A6]" />
                Loading projects...
              </div>
            ) : homeownerProjects.length === 0 ? (
              <div className="py-12 text-center text-[#708090] text-sm">
                No homeowner projects found for this property.
              </div>
            ) : (
              homeownerProjects.map((project: any) => {
                const projectId = project.id ?? project.project_id ?? project._id;
                const isProjectGenerating = !!generatingProjects[projectId];
                const isProjectPurchased = project.project_purchased === true || project.is_purchased === true;
                const dateLabel = project.date_of_install
                  ? new Date(project.date_of_install).toLocaleDateString()
                  : project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : "N/A";
                const isSelected = selectedHomeowners.includes(String(projectId));
                const projectPrice = project.project_price ?? 29;

                const isCreator =
                  project.created_by === user?.id ||
                  (user?.email && project.createdBy?.email && user.email.toLowerCase() === project.createdBy.email.toLowerCase());
                const hasProjectAccess =
                  isProjectPurchased ||
                  isPurchased ||
                  isAdmin ||
                  isCityInspector ||
                  isOwnerOfProperty ||
                  (role === "property_owner" && isCreator);

                return (
                  <div
                    key={projectId}
                    className="flex items-start p-4 rounded-xl border border-[#E8EDF2] bg-white gap-4 hover:shadow-xs transition-shadow"
                  >
                    <div className="pt-1 select-none">
                      <Checkbox
                        checked={isSelected}
                        disabled={hasProjectAccess}
                        onCheckedChange={(checked) => {
                          const pidStr = String(projectId);
                          if (checked) {
                            setSelectedHomeowners((prev) => [...prev, pidStr]);
                          } else {
                            setSelectedHomeowners((prev) => prev.filter((id) => id !== pidStr));
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1F2A44] font-inter">
                          {project.project_name || "Untitled Project"}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-[rgba(28,167,166,0.08)] text-[#1CA7A6] border border-[#1CA7A6]/20 px-2 py-0.5 rounded-full font-medium font-inter">
                            {project.project_type || "General"}
                          </span>
                          <span className="text-[10px] text-[#708090] font-asap">
                            {dateLabel}
                          </span>
                          {project.is_confirmed && (
                            <span className="text-[10px] text-[#43A047] font-semibold">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {hasProjectAccess ? (
                          <Button
                            onClick={() => handleGenerateProjectReport(projectId, project.project_name)}
                            disabled={isProjectGenerating}
                            className="h-8 px-3 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
                          >
                            {isProjectGenerating ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <FileText className="size-3" />
                            )}
                            {isProjectGenerating ? "Downloading…" : "Download"}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchaseProjectReport(projectId)}
                            className="h-8 px-3 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
                          >
                            <ShoppingCart className="size-3" />
                            Buy Report (${projectPrice})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedHomeowners.length > 0 && (
            <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center justify-between mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-xs font-semibold text-[#708090]">
                {selectedHomeowners.length} {selectedHomeowners.length === 1 ? 'project' : 'projects'} selected
              </span>
              <Button
                onClick={() => handlePurchaseMultipleProjects(selectedHomeowners)}
                disabled={isBulkPurchasing}
                className="h-8 px-4 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
              >
                {isBulkPurchasing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShoppingCart className="size-3.5" />
                )}
                Pay Selected (${selectedHomeowners.reduce((total, id) => {
                  const proj = homeownerProjects.find((p) => String(p.id ?? p.project_id ?? p._id) === id);
                  return total + (proj?.project_price ?? 29);
                }, 0)})
              </Button>
            </div>
          )}
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" className="h-10 w-full rounded-xl font-bold uppercase tracking-widest border-2">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back Button */}
      <div className="flex justify-center pt-12 md:pt-[60px] pb-[50px]">
        <button
          onClick={onBack}
          className="flex items-center gap-[21px] group cursor-pointer"
        >
          <div className="w-[32px] h-[32px] rounded-full bg-[rgba(28,167,166,0.25)] flex items-center justify-center text-[#1CA7A6] transition-transform group-hover:-translate-x-1">
            <ChevronLeft className="size-5" />
          </div>
          <span className="text-[14px] md:text-[18px] font-medium text-[#1CA7A6] uppercase tracking-normal font-asap">
            Back
          </span>
        </button>
      </div>

      <PdfGenerationLoader
        isOpen={isGenerating || isBulkPurchasing || isGeneratingAllContractor}
        message={isBulkPurchasing ? "Processing Purchase..." : "Generating Report..."}
      />
    </div>
  );
};
