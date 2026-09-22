"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, FileText, PlusIcon, MapPin, Map, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { downloadPdfFromUrl, getErrorMessage } from "@/lib/utils";
import { useAwsImage } from "@/hooks/use-aws-image";
import {
  generatePdfReport,
  purchaseReport,
  getReportUsage,
  getprojectTypesInProperty,
  uploadPropertyImages,
} from "@/lib/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageSourcePickerDialog } from "@/components/modals/image-source-picker-dialog";
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
import { PdfGenerationLoader } from "@/components/common/pdf-generation-loader";
import { useUser } from "@/components/providers/user-provider";
import Link from "next/link";

import { ImageTab, PropertyImage, Installation } from "./types";
import { ProjectImagesView } from "./project-images-view";
import { ProjectsListView } from "./projects-list-view";
import { ReportsView } from "./reports-view";
import { ProjectDefaultView } from "./project-default-view";

interface ComponentDetailProps {
  componentId: string;
  componentData?: any;
}

export default function ComponentDetail({
  componentId,
  componentData,
}: ComponentDetailProps) {
  const router = useRouter();
  const { role, user } = useUser();
  const heroImageUrl = useAwsImage(componentData?.front_image);
  const otherImageUrl = useAwsImage(componentData?.other_image);
  const [activeTab, setActiveTab] = useState("PROJECTS");
  const [showImages, setShowImages] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState<ImageTab>("ROOFING");
  const allProjects: any[] = componentData?.projects ?? [];
  const hasReport = componentData?.has_report || allProjects.length > 0;
  const installations: Installation[] = allProjects
    .map((p: any) => p.components)
    .filter(Boolean);
  const isPurchased: boolean = componentData?.is_purchased ?? false;
  const [purchased, setPurchased] = useState(isPurchased);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPurchaseDialogTop, setShowPurchaseDialogTop] = useState(false);
  const [reportUsage, setReportUsage] = useState<any>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoadingTotalCount, setIsLoadingTotalCount] = useState<boolean>(true);

  const isQuotaRole =
    role === "insurance_company" ||
    role === "realtor" ||
    role === "manufacturer" ||
    role === "contractor" ||
    role === "property_owner";
  const [isLoadingReportUsage, setIsLoadingReportUsage] =
    useState<boolean>(true);

  const [heroImageSrc, setHeroImageSrc] = useState(heroImageUrl);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHeroImageSrc(heroImageUrl);
  }, [heroImageUrl]);

  useEffect(() => {
    setPurchased(isPurchased);
  }, [isPurchased]);

  const fetchReportUsage = async () => {
    if (isQuotaRole) {
      setIsLoadingReportUsage(true);
      try {
        const res = await getReportUsage();
        const usageData = res?.data || res;
        setReportUsage(usageData);
        return usageData;
      } catch (err) {
        console.error("Failed to fetch report usage:", err);
      } finally {
        setIsLoadingReportUsage(false);
      }
    } else {
      setIsLoadingReportUsage(false);
    }
  };

  useEffect(() => {
    fetchReportUsage();
  }, [role]);

  useEffect(() => {
    if (!componentId) return;
    setIsLoadingTotalCount(true);
    getprojectTypesInProperty(componentId)
      .then((res) => {
        setTotalCount(res?.totalcount ?? 0);
      })
      .catch((err) => {
        console.error("Failed to fetch project types:", err);
      })
      .finally(() => {
        setIsLoadingTotalCount(false);
      });
  }, [componentId]);

  const isAdmin = role === "admin" || user?.role === "admin";

  const isAssignedPropertyOwner =
    (role === "property_owner" || user?.role === "property_owner") &&
    ((!!componentData?.property_owner?.email &&
      !!user?.email &&
      componentData.property_owner.email.toLowerCase() ===
        user.email.toLowerCase()) ||
      (!!componentData?.property_owner_email &&
        !!user?.email &&
        componentData.property_owner_email.toLowerCase() ===
          user.email.toLowerCase()) ||
      (!!componentData?.property_owner_id &&
        (user?.id === componentData.property_owner_id ||
          (user as any)?.user_id === componentData.property_owner_id)) ||
      (!!componentData?.property_owner?.id &&
        (user?.id === componentData.property_owner.id ||
          (user as any)?.user_id === componentData.property_owner.id)));

  const isContractorWhoAddedProperty =
    (role === "contractor" || user?.role === "contractor") &&
    ((!!componentData?.creator?.email &&
      !!user?.email &&
      componentData.creator.email.toLowerCase() === user.email.toLowerCase()) ||
      (!!componentData?.created_by &&
        (componentData.created_by === user?.id ||
          componentData.created_by === (user as any)?.user_id)) ||
      (!!componentData?.creator?.id &&
        (componentData.creator.id === user?.id ||
          componentData.creator.id === (user as any)?.user_id)));

  const canChangeBanner =
    isAdmin || isAssignedPropertyOwner || isContractorWhoAddedProperty;

  const isOwnerOfProperty = isAssignedPropertyOwner;
  const showAddProject =
    role === "admin" ||
    role === "contractor" ||
    role === "manufacturer" ||
    (role === "property_owner" && isOwnerOfProperty);
  const hasReportApi = !!componentData?.has_report || hasReport;

  const hasLimitAccess = Boolean(reportUsage && reportUsage.remaining > 0);

  const isDeterminingAccess =
    hasReportApi &&
    isQuotaRole &&
    !isOwnerOfProperty &&
    !purchased &&
    isLoadingReportUsage;

  const showGenerateOption =
    !isDeterminingAccess &&
    hasReportApi &&
    ((role === "property_owner" &&
      (isOwnerOfProperty || purchased || hasLimitAccess)) ||
      role === "admin" ||
      role === "city_inspector" ||
      (role === "contractor" && (purchased || hasLimitAccess)) ||
      (role === "manufacturer" && (purchased || hasLimitAccess)) ||
      (role === "realtor" && (purchased || hasLimitAccess)) ||
      (role === "insurance_company" && (purchased || hasLimitAccess)));

  const showBuyOption =
    !isDeterminingAccess &&
    hasReportApi &&
    allProjects.length > 0 &&
    ((role === "property_owner" &&
      !isOwnerOfProperty &&
      !purchased &&
      !hasLimitAccess) ||
      (role === "contractor" && !purchased && !hasLimitAccess) ||
      (role === "manufacturer" && !purchased && !hasLimitAccess) ||
      (role === "realtor" && !purchased && !hasLimitAccess) ||
      (role === "insurance_company" && !purchased && !hasLimitAccess));

  const downloadReport = async () => {
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(componentId, undefined, user?.role);
      await downloadPdfFromUrl(url, `property-report-${componentId}.pdf`);
      toast.success("Report downloaded successfully");
      setPurchased(true);
      await fetchReportUsage();
    } catch (err: any) {
      toast.error(err.message || "Failed to download report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePurchase = async () => {
    setShowPurchaseDialogTop(false);
    setIsGenerating(true);
    try {
      const response = await purchaseReport(componentId);
      if (!response.success) {
        toast.error(response.message);
        setIsGenerating(false);
        return;
      }

      console.log(response, "response");
      const checkoutUrl =
        response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        localStorage.setItem("pending_report_id", componentId);
        localStorage.setItem("pending_report_type", "single");
        window.location.href = checkoutUrl;
      } else {
        toast.success("Report purchased successfully");
        setPurchased(true);
        await downloadReport();
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong."));
      setIsGenerating(false);
    }
  };

  const triggerBannerFileInput = () => {
    if (isUploadingBanner) return;
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (isMobile) {
      setShowImageSourcePicker(true);
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handleSelectCamera = () => {
    setShowImageSourcePicker(false);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  const handleSelectGallery = () => {
    setShowImageSourcePicker(false);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
      galleryInputRef.current.click();
    }
  };

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      toast.error(`Image "${file.name}" exceeds the 7MB size limit`);
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setHeroImageSrc(previewUrl);

    setIsUploadingBanner(true);
    try {
      const propId = componentId || componentData?.id;
      const response = await uploadPropertyImages(propId, file);
      if (!response.success) {
        toast.error(response.message || "Failed to update banner image");
        setHeroImageSrc(heroImageUrl);
        return;
      }
      toast.success("Banner image updated successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to update banner image:", error);
      toast.error(error?.message || "Failed to update banner image");
      setHeroImageSrc(heroImageUrl);
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  const property = {
    propertyId: componentData?.id ?? "",
    propertyName: componentData?.property_name || "",
    address: componentData?.address || "",
    address2: componentData?.address2 || "",
    property_type:
      componentData?.other_property_type ??
      componentData?.other_property_type_name ??
      componentData?.property_type?.type_name ??
      componentData?.property_type?.name ??
      componentData?.property_type_category ??
      componentData?.property_type?.category ??
      (typeof componentData?.property_type === "string"
        ? componentData?.property_type
        : "") ??
      "",
    property_type_category:
      componentData?.other_property_type ??
      componentData?.other_property_type_name ??
      componentData?.property_type_category ??
      componentData?.property_type?.category ??
      componentData?.property_type?.type_name ??
      componentData?.property_type?.name ??
      (typeof componentData?.property_type === "string"
        ? componentData?.property_type
        : "") ??
      "",
    location: [
      componentData?.city_name ??
        componentData?.city?.name ??
        componentData?.city,
      componentData?.state_name ??
        componentData?.state?.name ??
        componentData?.state,
      componentData?.zip,
    ]
      .filter(Boolean)
      .join(", "),
    isVerified: componentData?.verified_status ?? false,

    heroImage: heroImageUrl,
    roofingImages: [
      { src: "/assets/property-detail/decking.png", caption: "Decking" },
      { src: "/assets/property-detail/roofing.png", caption: "Roofing" },
      { src: "/assets/property-detail/ice_water.png", caption: "Ice Water" },
      { src: "/assets/property-detail/kick_out.png", caption: "Kick Out" },
    ] as PropertyImage[],
    doorWindowImages: [
      {
        src: "/assets/property-detail/pan_flashing.png",
        caption: "Pan Flashing",
      },
      { src: "/assets/property-detail/roofing.png", caption: "Side Flashing" },
      { src: "/assets/property-detail/ice_water.png", caption: "Drip Cap" },
      { src: "/assets/property-detail/kick_out.png", caption: "Shim/Foam" },
    ] as PropertyImage[],
    sidingImages: [
      { src: "/assets/property-detail/decking.png", caption: "House Wrap" },
      {
        src: "/assets/property-detail/roofing.png",
        caption: "Window Flashing",
      },
      { src: "/assets/property-detail/ice_water.png", caption: "Drip Cap" },
      { src: "/assets/property-detail/kick_out.png", caption: "Kick Out" },
    ] as PropertyImage[],
  };

  const handleAddProject = () => {
    const prop = (componentData || {}) as any;
    const propertyId = prop.id || componentId || property.propertyId;
    const stateId =
      prop.state_id ||
      prop.stateId ||
      prop.state?.id ||
      prop.state?.state_id ||
      prop.property?.state_id ||
      prop.property?.state?.id ||
      prop.property?.state?.state_id ||
      prop.raw?.state_id ||
      prop.raw?.state?.id ||
      (typeof prop.state === "string" && prop.state.includes("-")
        ? prop.state
        : "") ||
      "";
    const cityId =
      prop.city_id ||
      prop.cityId ||
      prop.city?.id ||
      prop.city?.city_id ||
      prop.property?.city_id ||
      prop.property?.city?.id ||
      prop.raw?.city_id ||
      prop.raw?.city?.id ||
      (typeof prop.city === "string" && prop.city.includes("-")
        ? prop.city
        : "") ||
      "";
    const cityName =
      prop.city_name ||
      prop.raw?.city_name ||
      prop.raw?.city?.name ||
      prop.city?.name ||
      (typeof prop.city === "string" ? prop.city : "") ||
      "";
    const propertyName =
      prop.propertyName ||
      prop.property_name ||
      prop.raw?.property_name ||
      prop.raw?.name ||
      property.propertyName ||
      "";

    const params = new URLSearchParams();
    if (propertyId) params.set("propertyId", String(propertyId));
    if (stateId) {
      params.set("state_id", String(stateId));
    }
    if (cityId) {
      params.set("city_id", String(cityId));
    }
    if (cityName) params.set("cityName", String(cityName));
    if (propertyName) params.set("propertyName", propertyName);

    router.push(`/properties/new?${params.toString()}`);
  };

  const imagesByTab: Record<ImageTab, PropertyImage[]> = {
    ROOFING: property.roofingImages,
    "WINDOWS AND DOORS": property.doorWindowImages,
    SIDING: property.sidingImages,
  };

  const tabs = ["PROJECTS", "DOCS", "PHOTOS", "COMMENTS"];

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] pb-20">
      <div className="max-w-292.5 mx-auto pt-4 md:pt-14 px-4 md:px-0 space-y-4 md:space-y-6.75">
        <div className="flex flex-col">
          {property?.propertyName && (
            <h1 className="text-[20px] sm:text-[28px] md:text-[36px] font-bold text-[#1F2A44] tracking-normal uppercase leading-tight md:leading-[41px] font-asap break-words">
              {property?.propertyName}
            </h1>
          )}

          <div className="flex flex-col mt-4 sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              {property?.address && (
                <h1 className="text-[14px] sm:text-[18px] md:text-[24px] font-normal text-[rgba(112,128,144,0.93)] leading-tight md:leading-[29px] font-inter break-words">
                  {property.address}
                </h1>
              )}
              {property?.address2 && (
                <h1 className="text-[14px] sm:text-[18px] md:text-[24px] font-normal text-[rgba(112,128,144,0.93)] leading-tight md:leading-[29px] font-inter break-words">
                  {property.address2}
                </h1>
              )}
              <p className="text-[14px] sm:text-[18px] md:text-[24px] font-normal text-[rgba(112,128,144,0.93)] leading-tight md:leading-[29px] font-inter">
                {property.location}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {showAddProject && (
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-secondary-new hover:bg-secondary-new/80 text-white font-bold text-[11px] sm:text-[12px] uppercase tracking-wider sm:tracking-widest transition-colors shrink-0 cursor-pointer"
                >
                  <PlusIcon className="size-4" />
                  <span>Add Project</span>
                </button>
              )}
              {isDeterminingAccess ? (
                <Button
                  disabled
                  className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-secondary-new/60 text-white font-bold text-[11px] sm:text-[12px] uppercase tracking-wider sm:tracking-widest transition-colors shrink-0 cursor-not-allowed"
                >
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Loading…</span>
                </Button>
              ) : (
                <>
                  {showGenerateOption && (
                    <Button
                      onClick={downloadReport}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-secondary-new hover:bg-secondary-new/80 text-white font-bold text-[11px] sm:text-[12px] uppercase tracking-wider sm:tracking-widest transition-colors shrink-0"
                    >
                      {isGenerating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <FileText className="size-3.5" />
                      )}
                      {isGenerating ? "Downloading…" : "Download Full Report"}
                    </Button>
                  )}
                  {showBuyOption && (
                    <Button
                      onClick={() => setShowPurchaseDialogTop(true)}
                      className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-secondary-new hover:bg-secondary-new/80 text-white font-bold text-[11px] sm:text-[12px] uppercase tracking-wider sm:tracking-widest transition-colors shrink-0"
                    >
                      Buy Full Report
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1170px] min-h-auto md:min-h-[1061px] rounded-[16px] sm:rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.1)] bg-white overflow-hidden">
          <div className="w-full h-[180px] sm:h-[280px] md:h-[418px] relative overflow-hidden">
            <Image
              src={heroImageSrc || "/assets/prop_placeholder.png"}
              alt={property.address}
              fill
              sizes="(max-width: 768px) 100vw, 1170px"
              priority
              className="w-full h-full object-cover"
              onError={() => {
                setHeroImageSrc("/assets/prop_placeholder.png");
              }}
            />
            {canChangeBanner && (
              <>
                {/* Hidden file input for Gallery */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerFileChange}
                />

                {/* Hidden file input for Camera */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBannerFileChange}
                />

                <button
                  type="button"
                  onClick={triggerBannerFileInput}
                  disabled={isUploadingBanner}
                  title="Change banner image"
                  aria-label="Change banner image"
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center justify-center size-9 sm:size-10 rounded-full bg-white/90 hover:bg-white text-[#1F2A44] hover:text-[#1CA7A6] shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploadingBanner ? (
                    <Loader2 className="size-4 sm:size-5 animate-spin text-[#1CA7A6]" />
                  ) : (
                    <Camera className="size-4 sm:size-5 text-[#1F2A44]" />
                  )}
                </button>
              </>
            )}
            <div className="absolute bottom-3 sm:bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3.5 z-10 flex-wrap justify-center w-full max-w-[95%] px-2">
              {componentData?.street_view_link && (
                <a
                  href={componentData.street_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-3 sm:px-6 rounded-full bg-white hover:bg-gray-100 text-[#1F2A44] font-bold text-[10px] sm:text-[12px] md:text-[14px] uppercase tracking-wider sm:tracking-widest transition-all shadow-lg border border-gray-200/50 hover:scale-105"
                >
                  <MapPin className="size-3.5 sm:size-4 text-[#1CA7A6]" />
                  Property Street View
                </a>
              )}
              {hasReport &&
                componentData?.latitude &&
                componentData?.longitude && (
                  <Link
                    href={`/dashboard?view=map&lat=${componentData.latitude}&lng=${componentData.longitude}&id=${componentId}`}
                    className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-3 sm:px-6 rounded-full bg-white hover:bg-gray-100 text-[#1F2A44] font-bold text-[10px] sm:text-[12px] md:text-[14px] uppercase tracking-wider sm:tracking-widest transition-all shadow-lg border border-gray-200/50 hover:scale-105"
                  >
                    <Map className="size-3.5 sm:size-4 text-[#1CA7A6]" />
                    Open in Map
                  </Link>
                )}
            </div>
          </div>
          <div className="pt-4 sm:pt-6 md:pt-[43px]">
            {showImages ? (
              <ProjectImagesView
                activeTab={activeImageTab}
                setActiveTab={setActiveImageTab}
                images={imagesByTab[activeImageTab]}
                onBack={() => setShowImages(false)}
              />
            ) : showProjects ? (
              <ProjectsListView
                propertyId={componentId}
                currentUserId={user?.id}
                propertyName={property.address}
                propertyType={property.property_type}
                propertyOwnerEmail={componentData?.property_owner?.email}
                hasComponents={
                  Array.isArray(componentData?.components) &&
                  componentData.components.length > 0
                }
                onBack={() => setShowProjects(false)}
              />
            ) : showReports ? (
              <ReportsView
                installations={installations}
                propertyId={componentId}
                isPurchased={purchased}
                components={installations}
                onBack={() => setShowReports(false)}
                componentsData={componentData}
                propertyOwnerEmail={componentData?.property_owner?.email}
                onReportUsageChange={(usage: any) => setReportUsage(usage)}
                onPurchasedChange={(val: boolean) => setPurchased(val)}
              />
            ) : (
              <ProjectDefaultView
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                totalCount={totalCount}
                isLoadingTotalCount={isLoadingTotalCount}
                propertyId={componentId}
                projects={allProjects}
                installations={installations}
                isPurchased={purchased}
                onShowImages={() => {
                  setShowImages(true);
                  setActiveImageTab("ROOFING");
                }}
                onShowProjects={() => setShowProjects(true)}
                onShowReports={() => setShowReports(true)}
                onBack={() => router.back()}
                otherImage={otherImageUrl}
              />
            )}
          </div>
        </div>
      </div>

      {/* Top level Purchase confirmation dialog */}
      <AlertDialog
        open={showPurchaseDialogTop}
        onOpenChange={setShowPurchaseDialogTop}
      >
        <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)]">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Purchase Report
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
              {role === "insurance_company"
                ? `You have ${reportUsage?.remaining || 0} free reports remaining. Would you like to purchase this report?`
                : "This report requires purchase. Would you like to proceed with the payment?"}
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

      <PdfGenerationLoader
        isOpen={isGenerating}
        message="Generating Report..."
      />

      {/* Upload Option Popup Dialog for Mobile */}
      <ImageSourcePickerDialog
        isOpen={showImageSourcePicker}
        onClose={() => setShowImageSourcePicker(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />
    </div>
  );
}
