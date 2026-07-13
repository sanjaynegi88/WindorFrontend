"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, FileText, PlusIcon, MapPin, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { downloadPdfFromUrl, getErrorMessage } from "@/lib/utils";
import { useAwsImage } from "@/hooks/use-aws-image";
import {
  generatePdfReport,
  purchaseReport,
  getReportUsage,
  getprojectTypesInProperty,
} from "@/lib/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  console.log('purchased', purchased)
  console.log('isPurchased', isPurchased)
  console.log("api data", componentData)

  const [heroImageSrc, setHeroImageSrc] = useState(heroImageUrl);

  useEffect(() => {
    setHeroImageSrc(heroImageUrl);
  }, [heroImageUrl]);

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

  useEffect(() => {
    if (!componentId) return;
    getprojectTypesInProperty(componentId)
      .then((res) => {
        setTotalCount(res?.totalcount ?? 0);
      })
      .catch((err) => {
        console.error("Failed to fetch project types:", err);
      });
  }, [componentId]);

  const isOwnerOfProperty = role === "property_owner" && !!componentData?.property_owner?.email && user?.email === componentData.property_owner.email;
  const showAddProject = role === "admin" || role === "contractor" || role === "manufacturer" || (role === 'property_owner' && isOwnerOfProperty);
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
    allProjects.length > 0 &&
    ((role === "property_owner" && !isOwnerOfProperty && !purchased) ||
      (role === "contractor" && !purchased) ||
      (role === "manufacturer" && !purchased) ||
      (role === "realtor" && !purchased) ||
      (role === "insurance_company" &&
        !purchased &&
        (!reportUsage || reportUsage.remaining === 0)));

  const downloadReport = async () => {
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(
        componentId,
        undefined,
        user?.role,
      );
      await downloadPdfFromUrl(
        url,
        `property-report-${componentId}.pdf`
      );
      toast.success("Report downloaded successfully");
      setPurchased(true);
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
      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
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

  const property = {
    propertyId: componentData?.id ?? "",
    address: componentData?.address ?? "N/A",
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

  const imagesByTab: Record<ImageTab, PropertyImage[]> = {
    ROOFING: property.roofingImages,
    "WINDOWS AND DOORS": property.doorWindowImages,
    SIDING: property.sidingImages,
  };

  const tabs = ["PROJECTS", "DOCS", "PHOTOS", "COMMENTS"];

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] pb-20">
      <div className="max-w-292.5 mx-auto pt-7 md:pt-14 px-5 md:px-0 space-y-4 md:space-y-6.75">
        <div className="flex flex-col gap-1 md:gap-1.75">
          <h1 className="text-[24px] md:text-[36px] font-bold text-[#1F2A44] tracking-normal uppercase leading-tight md:leading-[41px] font-asap">
            {componentData?.property_name || property?.address}
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-[16px] md:text-[24px] font-normal text-[rgba(112,128,144,0.93)] leading-tight md:leading-[29px] font-inter">
              {property.location}
            </p>
            <div className="flex gap-4">
              {showAddProject && (
                <Link
                  href={`/properties/new?propertyId=${property.propertyId}`}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg bg-secondary-new hover:bg-secondary-new/80 text-white font-bold text-[12px] uppercase tracking-widest transition-colors"
                >
                  <PlusIcon />
                  <h1>Add Project</h1>
                </Link>
              )}
              {showGenerateOption && (
                <Button
                  onClick={downloadReport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg bg-secondary-new hover:bg-secondary-new/80 text-white font-bold text-[12px] uppercase tracking-widest transition-colors"
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
                  className="flex items-center gap-2 h-10 px-4 rounded-lg bg-secondary-new hover:bg-secondary-new/80 text-white font-bold text-[12px] uppercase tracking-widest transition-colors"
                >
                  Buy Full Report
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1170px] min-h-[500px] md:min-h-[1061px] rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.1)] bg-white overflow-hidden">
          <div className="w-full h-[213px] md:h-[418px] relative overflow-hidden">
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
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-10 flex-wrap justify-center w-full max-w-[90%]">
              {componentData?.street_view_link && (
                <a
                  href={componentData.street_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-10 px-6 rounded-full bg-white hover:bg-gray-100 text-[#1F2A44] font-bold text-[12px] md:text-[14px] uppercase tracking-widest transition-all shadow-lg border border-gray-200/50 hover:scale-105"
                >
                  <MapPin className="size-4 text-[#1CA7A6]" />
                  Property Street View
                </a>
              )}
              {hasReport && componentData?.latitude && componentData?.longitude && (
                <Link
                  href={`/dashboard?view=map&lat=${componentData.latitude}&lng=${componentData.longitude}&id=${componentId}`}
                  className="flex items-center gap-2 h-10 px-6 rounded-full bg-white hover:bg-gray-100 text-[#1F2A44] font-bold text-[12px] md:text-[14px] uppercase tracking-widest transition-all shadow-lg border border-gray-200/50 hover:scale-105"
                >
                  <Map className="size-4 text-[#1CA7A6]" />
                  Open in Map
                </Link>
              )}
            </div>
          </div>
          <div className="pt-6 md:pt-[43px]">
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
                propertyOwnerEmail={componentData?.property_owner?.email}
                hasComponents={Array.isArray(componentData?.components) && componentData.components.length > 0}
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
              />
            ) : (
              <ProjectDefaultView
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                totalCount={totalCount}
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
    </div>
  );
}
