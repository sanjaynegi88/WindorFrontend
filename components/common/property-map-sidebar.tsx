'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  MapPin,
  Loader2,
  Grid3X3,
  ShoppingCart,
  Check,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Eye,
  Info,
  Download,
  Calendar,
  X
} from 'lucide-react';
import { cn, downloadPdfFromUrl, getErrorMessage, getWorkingAwsImageUrl } from '@/lib/utils';
import {
  getPropertyListAll,
  generatePdfReport,
  generateOwnerProjectPdfReport,
  purchaseReport,
  purchaseProject,
  getReportUsage,
  getprojectListingOfProperty,
  purchaseAllContractorReports,
  generateAllContractorPdfReport,
  generateContractorProjectPdfReport,
} from '@/lib/actions';
import { toast } from 'sonner';
import Image from 'next/image';
import { useUser } from '@/components/providers/user-provider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { PdfGenerationLoader } from './pdf-generation-loader';

interface PropertyMapSidebarProps {
  propertyId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyMapSidebar({ propertyId, isOpen, onClose }: PropertyMapSidebarProps) {
  const { user, role } = useUser();
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUsage, setReportUsage] = useState<any>(null);

  // local purchase states
  const [purchased, setPurchased] = useState(false);
  const [allContractorPurchased, setAllContractorPurchased] = useState(false);
  const [isGeneratingAllContractor, setIsGeneratingAllContractor] = useState(false);
  const [isBulkPurchasing, setIsBulkPurchasing] = useState(false);

  // project lists
  const [contractorProjects, setContractorProjects] = useState<any[]>([]);
  const [homeownerProjects, setHomeownerProjects] = useState<any[]>([]);
  const [loadingContractor, setLoadingContractor] = useState(false);
  const [loadingHomeowner, setLoadingHomeowner] = useState(false);

  // selections
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [selectedHomeowners, setSelectedHomeowners] = useState<string[]>([]);
  const [generatingProjects, setGeneratingProjects] = useState<Record<string, boolean>>({});

  // Sub-dialog states
  const [showAllContractorDialog, setShowAllContractorDialog] = useState(false);
  const [showContractorListDialog, setShowContractorListDialog] = useState(false);
  const [showHomeownerListDialog, setShowHomeownerListDialog] = useState(false);

  // Fetch report usage (insurance role)
  useEffect(() => {
    if (role === 'insurance_company' && isOpen) {
      getReportUsage()
        .then((res) => setReportUsage(res.data))
        .catch(() => { });
    }
  }, [role, isOpen]);

  // Load property details when propertyId opens
  useEffect(() => {
    if (!propertyId || !isOpen) return;

    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const result = await getPropertyListAll({ id: propertyId });
        const data = Array.isArray(result) ? result[0] : (result?.data ? (Array.isArray(result.data) ? result.data[0] : result.data) : result);
        setProperty(data?.data || data);
        setPurchased(data?.data?.is_purchased ?? data?.is_purchased ?? false);
        setAllContractorPurchased(
          data?.data?.all_contractor_purchased === true ||
          data?.data?.is_all_contractor_purchased === true ||
          data?.data?.all_contractors_purchased === true ||
          data?.all_contractor_purchased === true ||
          data?.is_all_contractor_purchased === true ||
          data?.all_contractors_purchased === true ||
          false
        );
        setActiveTab('overview');
      } catch (err) {
        console.error('Error fetching property details:', err);
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, isOpen]);

  // Load projects list when needed
  const loadContractorProjects = async () => {
    if (!propertyId) return;
    setLoadingContractor(true);
    try {
      const res = await getprojectListingOfProperty(propertyId);
      console.log("res", res)
      const allProjects = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const projects = allProjects.filter((p: any) => {
        const ownerId = p.property?.property_owner_id || p.property_owner_id || p.property?.property_owner?.id;
        const ownerEmail = p.property?.property_owner_email || p.property_owner_email || p.property?.property_owner?.email;
        const isOwner =
          p.created_by_type === 'PROPERTY_OWNER' ||
          p.added_by === 'PROPERTY_OWNER' ||
          (p.created_by && ownerId && p.created_by === ownerId) ||
          (p.created_by_email && ownerEmail && p.created_by_email.toLowerCase() === ownerEmail.toLowerCase());
        return !isOwner;
      });
      setContractorProjects(projects);
    } catch (err) {
      console.error('Failed to load contractor projects:', err);
      toast.error('Failed to load contractor projects');
    } finally {
      setLoadingContractor(false);
    }
  };

  const loadHomeownerProjects = async () => {
    if (!propertyId) return;
    setLoadingHomeowner(true);
    try {
      const res = await getprojectListingOfProperty(propertyId);
      const allProjects = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const projects = allProjects.filter((p: any) => {
        const ownerId = p.property?.property_owner_id || p.property_owner_id || p.property?.property_owner?.id;
        const ownerEmail = p.property?.property_owner_email || p.property_owner_email || p.property?.property_owner?.email;
        const isOwner =
          p.created_by_type === 'PROPERTY_OWNER' ||
          p.added_by === 'PROPERTY_OWNER' ||
          (p.created_by && ownerId && p.created_by === ownerId) ||
          (p.created_by_email && ownerEmail && p.created_by_email.toLowerCase() === ownerEmail.toLowerCase());
        return isOwner;
      });
      setHomeownerProjects(projects);
    } catch (err) {
      console.error('Failed to load homeowner projects:', err);
      toast.error('Failed to load homeowner projects');
    } finally {
      setLoadingHomeowner(false);
    }
  };

  // Trigger loading projects when list dialogs are opened
  useEffect(() => {
    if (showContractorListDialog) {
      loadContractorProjects();
    } else {
      setSelectedContractors([]);
    }
  }, [showContractorListDialog]);

  useEffect(() => {
    if (showHomeownerListDialog) {
      loadHomeownerProjects();
    } else {
      setSelectedHomeowners([]);
    }
  }, [showHomeownerListDialog]);

  if (!isOpen) return null;

  const propertyOwnerEmail = property?.property_owner?.email || property?.owner_email || '';
  const totalProjectsCount = (property?.projects ?? []).length;
  const isOwnerOfProperty = role === 'property_owner' && !!propertyOwnerEmail && user?.email?.toLowerCase() === propertyOwnerEmail.toLowerCase();
  const isAdmin = role === 'admin';
  const isCityInspector = role === 'city_inspector';

  const showGenerateOption =
    (role === "property_owner" && (isOwnerOfProperty || purchased)) ||
    role === "admin" ||
    role === "city_inspector" ||
    (role === "contractor" && purchased) ||
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

  const hasAllContractorAccess = allContractorPurchased || purchased || isAdmin || isCityInspector || isOwnerOfProperty;

  // Actions
  const handleDownloadFullReport = async () => {
    if (!propertyId) return;
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(propertyId, undefined, user?.role);
      await downloadPdfFromUrl(url, `property-report-${propertyId}.pdf`);
      toast.success('Report downloaded successfully');
      setPurchased(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePurchaseFullReport = async () => {
    if (!propertyId) return;
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
        localStorage.setItem('pending_report_id', propertyId);
        localStorage.setItem('pending_report_type', 'single');
        window.location.href = checkoutUrl;
      } else {
        setPurchased(true);
        await handleDownloadFullReport();
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Something went wrong.'));
      setIsGenerating(false);
    }
  };

  const handleDownloadAllContractorReport = async () => {
    if (!propertyId) return;
    setIsGeneratingAllContractor(true);
    try {
      const url = await generateAllContractorPdfReport(propertyId);
      await downloadPdfFromUrl(url, `all-contractor-projects-report-${propertyId}.pdf`);
      toast.success('Report downloaded successfully');
      setAllContractorPurchased(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download report');
    } finally {
      setIsGeneratingAllContractor(false);
    }
  };

  const handleAllContractorPurchase = async () => {
    if (!propertyId) return;
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
        localStorage.setItem('pending_report_id', propertyId);
        localStorage.setItem('pending_report_type', 'all-contractor');
        window.location.href = checkoutUrl;
      } else {
        setAllContractorPurchased(true);
        await handleDownloadAllContractorReport();
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Something went wrong.'));
      setIsGeneratingAllContractor(false);
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
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      console.error('Download project report error:', error);
      toast.error(getErrorMessage(error, 'Failed to download report'));
    } finally {
      setGeneratingProjects((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handlePurchaseProjectReport = async (projectId: string) => {
    if (!propertyId) return;
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
        localStorage.setItem('pending_report_id', projectId);
        localStorage.setItem('pending_report_type', isContractor ? 'contractor-project' : 'project');
        localStorage.setItem('pending_report_property_id', propertyId);
        window.location.href = checkoutUrl;
      } else {
        toast.success('Report purchased successfully');
        loadContractorProjects();
        loadHomeownerProjects();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong.'));
    }
  };

  const handlePurchaseMultipleProjects = async (projectIds: string[], listType: 'contractor' | 'homeowner') => {
    if (!propertyId || projectIds.length === 0) return;
    setIsBulkPurchasing(true);
    try {
      const response = await purchaseProject(projectIds, propertyId);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        localStorage.setItem('pending_report_id', projectIds.join(','));
        localStorage.setItem('pending_report_type', listType === 'contractor' ? 'contractor-project' : 'project');
        localStorage.setItem('pending_report_property_id', propertyId);
        window.location.href = checkoutUrl;
      } else {
        toast.success('Reports purchased successfully');
        if (listType === 'contractor') {
          setSelectedContractors([]);
          await loadContractorProjects();
        } else {
          setSelectedHomeowners([]);
          await loadHomeownerProjects();
        }
        for (const pid of projectIds) {
          await handleGenerateProjectReport(pid, 'Project Report');
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setIsBulkPurchasing(false);
    }
  };

  // Get unique images from projects
  const allImages = (property?.projects ?? [])
    .map((p: any) => p.components)
    .filter(Boolean)
    .flatMap((comp: any) =>
      (comp.images ?? []).flatMap((img: any) => [
        img.image_url ? `${img.image_url}` : null,
        img.property_owner_files ? `${img.property_owner_files}` : null
      ].filter(Boolean))
    );
  const uniqueImages = Array.from(new Set(allImages)) as string[];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-s-0 shadow-2xl bg-white transition-all duration-300 ease-in-out"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0 bg-[#F8FAFC]">
            <SheetTitle className="text-lg font-bold text-[#1F2A44] font-asap uppercase tracking-wide">
              Property Details
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#1CA7A6]" />
              <span className="text-sm font-semibold text-[#708090] font-asap">Loading details...</span>
            </div>
          ) : !property ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <h3 className="text-md font-bold text-[#1F2A44] font-asap">Property Not Found</h3>
              <p className="text-xs text-gray-500 font-medium">Failed to retrieve property details.</p>
            </div>
          ) : (
            <>
              {/* Image Banner */}
              <div className="w-full h-44 relative bg-gray-100 overflow-hidden shrink-0">
                <Image
                  src={property.front_image ? property.front_image : '/assets/prop_placeholder.png'}
                  alt={property.address}
                  fill
                  className="object-cover transition-all duration-500"
                  unoptimized
                  onError={(e) => {
                    (e.target as any).src = '/assets/prop_placeholder.png';
                  }}
                />
                {property.street_view_link && (
                  <a
                    href={property.street_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 left-4 flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/95 text-[#1F2A44] hover:bg-white font-bold text-[10px] uppercase tracking-wider transition-all shadow-md border border-gray-200/50 hover:scale-105 z-10"
                  >
                    <MapPin className="w-3 h-3 text-[#1CA7A6]" />
                    Street View
                  </a>
                )}
                {purchased && (
                  <span className="absolute top-3 left-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                    Purchased
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-[#F8FAFC] shrink-0 font-asap">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold uppercase tracking-widest text-center border-b-2 transition-all',
                    activeTab === 'overview'
                      ? 'border-[#1CA7A6] text-[#1CA7A6]'
                      : 'border-transparent text-[#708090] hover:text-[#1F2A44]'
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold uppercase tracking-widest text-center border-b-2 transition-all',
                    activeTab === 'reports'
                      ? 'border-[#1CA7A6] text-[#1CA7A6]'
                      : 'border-transparent text-[#708090] hover:text-[#1F2A44]'
                  )}
                >
                  Reports ({totalProjectsCount})
                </button>
              </div>

              {/* Body Content */}
              <SheetBody className="flex-1 overflow-y-auto p-5 space-y-6">
                {activeTab === 'overview' ? (
                  <div className="space-y-6 font-asap">
                    {/* Header Info */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h2 className="text-xl font-black text-[#1F2A44] leading-snug uppercase tracking-tight">
                          {property.property_name || property.address}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#708090]" />
                          <span>
                            {[property.city_name || property.city?.name, property.state_name || property.state, property.zip]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      </div>
                      {property.street_view_link && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg font-bold uppercase tracking-wider text-[10px] border border-gray-200 bg-white hover:bg-gray-50 text-[#1CA7A6] gap-1.5 w-fit"
                        >
                          <a href={property.street_view_link} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-3.5 h-3.5" />
                            Street View
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Metadata list */}
                    <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 space-y-3.5">
                      <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-100">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Owner Email</span>
                        <span className="font-bold text-[#1F2A44]">{propertyOwnerEmail || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-100">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Total Projects</span>
                        <span className="font-bold text-[#1F2A44]">{totalProjectsCount}</span>
                      </div>
                      <div className={cn(
                        "flex items-center justify-between text-xs",
                        property.street_view_link && "pb-2.5 border-b border-gray-100"
                      )}>
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Verification Status</span>
                        {property.verified_status ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-md">
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-md">
                            Pending
                          </Badge>
                        )}
                      </div>
                      {property.street_view_link && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-400 uppercase tracking-widest">Street View</span>
                          <a
                            href={property.street_view_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#1CA7A6] hover:underline font-bold"
                          >
                            <span>Open Street View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Install Details */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Installations List</h3>
                      {totalProjectsCount > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(property.projects ?? [])
                            .map((p: any) => p.components?.component_type)
                            .filter(Boolean)
                            .filter((value: any, index: number, self: any[]) => self.indexOf(value) === index) // Unique values
                            .map((type: string) => (
                              <Badge
                                key={type}
                                variant="outline"
                                className="bg-white text-gray-700 border-gray-200 font-semibold text-[10px] capitalize px-2.5 py-1"
                              >
                                {type.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-red-500">No installations listed yet</p>
                      )}
                    </div>

                    {/* Photos grid summary */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Property Images ({uniqueImages.length})</h3>
                      {uniqueImages.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {uniqueImages.slice(0, 4).map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                              <Image
                                src={src}
                                alt={`property-${idx}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 font-medium">No property photos uploaded.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 font-asap">
                    {totalProjectsCount === 0 ? (
                      <div className="p-5 text-center rounded-xl border border-dashed border-gray-200 bg-slate-50/50">
                        <p className="text-xs font-semibold text-red-500">No reports available for this property.</p>
                      </div>
                    ) : (
                      <>
                        {/* Report description */}
                        <div className="text-xs text-gray-500 font-medium leading-relaxed">
                          Download or purchase full comprehensive report or select specific project reports below.
                        </div>

                        {/* Full Report Option */}
                        {(showGenerateOption || showBuyOption) && (
                          <div className="rounded-xl border border-[#E8EDF2] bg-[#F8FAFC]/50 p-4 space-y-3.5 shadow-sm">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#1CA7A6]/10 flex items-center justify-center text-[#1CA7A6]">
                                <FileText className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-[#1F2A44] uppercase tracking-wider">
                                  Full Property Report
                                </h4>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-normal">
                                  Includes all contractor and homeowner projects.
                                </p>
                              </div>
                            </div>
                            {showGenerateOption ? (
                              <Button
                                onClick={handleDownloadFullReport}
                                disabled={isGenerating}
                                className="w-full h-10 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-widest shadow-none gap-1.5"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                {isGenerating ? 'Downloading…' : 'Download Full Report'}
                              </Button>
                            ) : (
                              <Button
                                onClick={handlePurchaseFullReport}
                                disabled={isGenerating}
                                className="w-full h-10 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-widest shadow-none gap-1.5"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                )}
                                {isGenerating ? 'Processing…' : 'Buy Full Report'}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* List Actions */}
                        <div className="space-y-3.5 pt-1">
                          {/* Option 1: All Contractor Reports */}
                          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
                                Complete ALL Report
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                Access all contractor projects reports.
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                if (hasAllContractorAccess) {
                                  handleDownloadAllContractorReport();
                                } else {
                                  setShowAllContractorDialog(true);
                                }
                              }}
                              disabled={isGeneratingAllContractor}
                              className="h-8 px-3 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[10px] uppercase tracking-widest gap-1 shadow-none"
                            >
                              {isGeneratingAllContractor ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : hasAllContractorAccess ? (
                                'Download'
                              ) : (
                                'Access'
                              )}
                            </Button>
                          </div>

                          {/* Option 2: Contractor Projects List */}
                          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
                                Contractor Projects
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                View & buy individual contractor reports.
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowContractorListDialog(true)}
                              className="h-8 px-3 rounded-lg bg-white border border-[#1CA7A6] hover:bg-[#1CA7A6]/5 text-[#1CA7A6] font-bold text-[10px] uppercase tracking-widest gap-1 shadow-none"
                            >
                              View
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Option 3: Home Owner Projects List */}
                          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
                                Homeowner Projects
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                View & buy individual homeowner reports.
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowHomeownerListDialog(true)}
                              className="h-8 px-3 rounded-lg bg-white border border-[#1CA7A6] hover:bg-[#1CA7A6]/5 text-[#1CA7A6] font-bold text-[10px] uppercase tracking-widest gap-1 shadow-none"
                            >
                              View
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </SheetBody>
            </>
          )}

          {/* Footer */}
          <SheetFooter className="p-4 border-t bg-[#F8FAFC] shrink-0 font-asap">
            <Button
              variant="outline"
              className="w-full h-11 rounded-lg font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs"
              onClick={onClose}
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* dialog 1: All Contractor Reports purchase prompt */}
      <Dialog open={showAllContractorDialog} onOpenChange={setShowAllContractorDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6 font-asap bg-white">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-black text-[#1F2A44] uppercase tracking-tight">
              Purchase All Contractor Reports
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium leading-relaxed">
              This feature allows you to purchase access to all contractor reports associated with this property at once. Would you like to proceed to payment?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4 flex flex-row">
            <Button
              variant="outline"
              onClick={() => setShowAllContractorDialog(false)}
              className="flex-1 h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAllContractorPurchase}
              disabled={isGeneratingAllContractor}
              className="flex-1 h-10 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-none gap-1"
            >
              {isGeneratingAllContractor ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </>
              ) : (
                'Purchase'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 2: Contractor Projects List */}
      <Dialog open={showContractorListDialog} onOpenChange={setShowContractorListDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-6 max-h-[80vh] flex flex-col font-asap bg-white">
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-md font-black text-[#1F2A44] uppercase tracking-tight">
                Contractor Project Reports
              </DialogTitle>
              <DialogDescription className="text-[11px] text-gray-400 font-medium mt-0.5">
                Download or buy reports for individual contractor projects.
              </DialogDescription>
            </div>
            {/* <DialogClose asChild>
              <button className="h-6 w-6 rounded-full hover:bg-red-700 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </DialogClose> */}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {loadingContractor ? (
              <div className="py-8 flex justify-center items-center gap-2 text-gray-400 text-xs font-semibold">
                <Loader2 className="w-4.5 h-4.5 animate-spin text-[#1CA7A6]" />
                Loading projects...
              </div>
            ) : contractorProjects.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                No contractor projects found.
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
                  purchased ||
                  isAdmin ||
                  isCityInspector ||
                  isOwnerOfProperty;

                return (
                  <div
                    key={projectId}
                    className="flex items-start p-3.5 rounded-xl border border-gray-100 bg-slate-50/30 gap-3.5"
                  >
                    <div className="pt-0.5 select-none">
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
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#1F2A44]">
                          {project.project_name || 'Untitled Project'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-[#1CA7A6]/10 text-[#1CA7A6] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {project.project_type || 'General'}
                          </span>
                          {project.is_confirmed && (
                            <span className="text-[9px] text-[#43A047] font-bold">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasProjectAccess ? (
                          <Button
                            onClick={() => handleGenerateProjectReport(projectId, project.project_name)}
                            disabled={isProjectGenerating}
                            className="h-8 px-2.5 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[9px] uppercase tracking-widest gap-1 shadow-none"
                          >
                            {isProjectGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {isProjectGenerating ? 'Downloading…' : 'Download'}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchaseProjectReport(projectId)}
                            className="h-8 px-2.5 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[9px] uppercase tracking-widest gap-1 shadow-none"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Buy (${projectPrice})
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
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-gray-100 flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-400">
                {selectedContractors.length} selected
              </span>
              <Button
                onClick={() => handlePurchaseMultipleProjects(selectedContractors, 'contractor')}
                disabled={isBulkPurchasing}
                className="h-8 px-3 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[9px] uppercase tracking-widest gap-1 shadow-none"
              >
                {isBulkPurchasing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ShoppingCart className="w-3 h-3" />
                )}
                Pay Selected (${selectedContractors.reduce((total, id) => {
                  const proj = contractorProjects.find((p) => String(p.id ?? p.project_id ?? p._id) === id);
                  return total + (proj?.project_price ?? 29);
                }, 0)})
              </Button>
            </div>
          )}
          <DialogFooter className="pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setShowContractorListDialog(false)}
              className="h-9 w-full rounded-xl font-bold uppercase tracking-widest text-[10px] border border-gray-200 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 3: Homeowner Projects List */}
      <Dialog open={showHomeownerListDialog} onOpenChange={setShowHomeownerListDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-6 max-h-[80vh] flex flex-col font-asap bg-white">
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-md font-black text-[#1F2A44] uppercase tracking-tight">
                Homeowner Project Reports
              </DialogTitle>
              <DialogDescription className="text-[11px] text-gray-400 font-medium mt-0.5">
                Download or buy reports for individual homeowner projects.
              </DialogDescription>
            </div>
            {/* <DialogClose asChild>
              <button className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </DialogClose> */}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {loadingHomeowner ? (
              <div className="py-8 flex justify-center items-center gap-2 text-gray-400 text-xs font-semibold">
                <Loader2 className="w-4.5 h-4.5 animate-spin text-[#1CA7A6]" />
                Loading projects...
              </div>
            ) : homeownerProjects.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                No homeowner projects found.
              </div>
            ) : (
              homeownerProjects.map((project: any) => {
                const projectId = project.id ?? project.project_id ?? project._id;
                const isProjectGenerating = !!generatingProjects[projectId];
                const isProjectPurchased = project.project_purchased === true || project.is_purchased === true;
                const isSelected = selectedHomeowners.includes(String(projectId));
                const projectPrice = project.project_price ?? 29;

                const isCreator =
                  project.created_by === user?.id ||
                  (user?.email && project.createdBy?.email && user.email.toLowerCase() === project.createdBy.email.toLowerCase());

                const hasProjectAccess =
                  isProjectPurchased ||
                  purchased ||
                  isAdmin ||
                  isCityInspector ||
                  isOwnerOfProperty ||
                  (role === 'property_owner' && isCreator);

                const dateLabel = project.date_of_install
                  ? new Date(project.date_of_install).toLocaleDateString()
                  : project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : 'N/A';

                return (
                  <div
                    key={projectId}
                    className="flex items-start p-3.5 rounded-xl border border-gray-100 bg-slate-50/30 gap-3.5"
                  >
                    <div className="pt-0.5 select-none">
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
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#1F2A44]">
                          {project.project_name || 'Untitled Project'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-[#1CA7A6]/10 text-[#1CA7A6] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {project.project_type || 'General'}
                          </span>
                          <span className="text-[9px] text-[#708090] font-semibold flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {dateLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasProjectAccess ? (
                          <Button
                            onClick={() => handleGenerateProjectReport(projectId, project.project_name)}
                            disabled={isProjectGenerating}
                            className="h-8 px-2.5 rounded-lg bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[9px] uppercase tracking-widest gap-1 shadow-none"
                          >
                            {isProjectGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {isProjectGenerating ? 'Downloading…' : 'Download'}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchaseProjectReport(projectId)}
                            className="h-8 px-2.5 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[9px] uppercase tracking-widest gap-1 shadow-none"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Buy (${projectPrice})
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
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-gray-100 flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-400">
                {selectedHomeowners.length} selected
              </span>
              <Button
                onClick={() => handlePurchaseMultipleProjects(selectedHomeowners, 'homeowner')}
                disabled={isBulkPurchasing}
                className="h-8 px-3 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44]/90 text-white font-bold text-[9px] uppercase tracking-widest gap-1 shadow-none"
              >
                {isBulkPurchasing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ShoppingCart className="w-3 h-3" />
                )}
                Pay Selected (${selectedHomeowners.reduce((total, id) => {
                  const proj = homeownerProjects.find((p) => String(p.id ?? p.project_id ?? p._id) === id);
                  return total + (proj?.project_price ?? 29);
                }, 0)})
              </Button>
            </div>
          )}
          <DialogFooter className="pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setShowHomeownerListDialog(false)}
              className="h-9 w-full rounded-xl font-bold uppercase tracking-widest text-[10px] border border-gray-200 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfGenerationLoader
        isOpen={isGenerating || isBulkPurchasing || isGeneratingAllContractor}
        message={isBulkPurchasing ? 'Processing Purchase...' : 'Generating Report...'}
      />
    </>
  );
}
