'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MoreVertical, Edit2, FileText, ShoppingCart, ShieldCheck, Plus, Trash2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { generatePdfReport, purchaseReport, getReportUsage, deleteProperty } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PdfGenerationLoader } from './pdf-generation-loader';
import { PropertyVerifySidebar } from './property-verify-sidebar';
import { downloadPdfFromUrl, getErrorMessage } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PropertyCardProps {
  id: string;
  propertyName?: string;
  address: string;
  address2?: string;
  hasReport?: boolean;
  city: string;
  state: string;
  zip: string;
  propertyId: string;
  isPurchased?: boolean;
  propertyOwnerEmail?: string;
  redirectUrl?: string;
  showActionButtons?: boolean;
  showDetail?: boolean;
  latitude?: number;
  longitude?: number;
  onOpenInMap?: (lat: number, lng: number, id: string) => void;
}

export function PropertyCard({ address, address2, city, state, zip, propertyId, hasReport, isPurchased = false, propertyName, propertyOwnerEmail, redirectUrl, showActionButtons, showDetail, latitude, longitude, onOpenInMap }: PropertyCardProps) {
  const { user, role } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportUsage, setReportUsage] = useState<any>(null);
  const [purchased, setPurchased] = useState(isPurchased);

  const router = useRouter();

  const isAdmin = role === 'admin';
  const isCityInspector = role === 'city_inspector';
  const isContractor = role === 'contractor';
  const isPropertyOwner = role === 'property_owner' || role === 'realtor';
  const isOwnerOfProperty = isPropertyOwner && !!propertyOwnerEmail && user?.email === propertyOwnerEmail;
  const canVerify = isAdmin || isCityInspector || isOwnerOfProperty;


  const canAddNewProject = isContractor || isAdmin || isOwnerOfProperty;

  const [isVerifySidebarOpen, setIsVerifySidebarOpen] = useState(false);

  useEffect(() => {
    if (role === 'insurance_company') {
      fetchReportUsage();
    }
  }, [role]);

  const shouldShowActionButtons =
    showActionButtons &&
    (hasReport || isAdmin || canVerify || canAddNewProject);

  const fetchReportUsage = async () => {
    try {
      const response = await getReportUsage();
      setReportUsage(response.data);
    } catch (error: any) {
      console.error('Failed to fetch report usage:', error);
    }
  };

  const downloadReport = async () => {
    setIsGenerating(true);
    try {
      const url = await generatePdfReport(propertyId, undefined, user?.role);
      await downloadPdfFromUrl(url, `property-report-${propertyId}.pdf`);
      toast.success('Report downloaded successfully');
      setPurchased(true);

      if (user?.role === 'insurance_company') {
        await fetchReportUsage();
      }
    } catch (error: any) {
      console.error('Download report error:', error);
      toast.error(error.message || 'Failed to download report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePurchase = async () => {
    setShowPurchaseDialog(false);
    setIsGenerating(true);
    try {
      const response = await purchaseReport(propertyId);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      if (response.data?.checkoutUrl) {
        localStorage.setItem('pending_report_id', propertyId);
        window.location.href = response.data.checkoutUrl;
      } else {
        toast.success('Report purchased successfully');
        setPurchased(true);
        await downloadReport();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Something went wrong.'));
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setShowDeleteDialog(false);
    setIsGenerating(true);
    try {
      const resposne = await deleteProperty(id);
      if (!resposne.success) {
        toast.error(resposne.message);
        return;
      }
      toast.success('Property deleted successfully');
      setPurchased(true);
      router.refresh();

      if (user?.role === 'insurance_company') {
        await fetchReportUsage();
      }
    } catch (error: any) {
      console.error('Delete property error:', error);
      toast.error(error.message || 'Failed to delete property');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden shadow-none hover:shadow-lg transition-all group rounded-[10px] cursor-pointer bg-white border border-[#1CA7A6] relative h-full flex flex-col"

      >
        {shouldShowActionButtons && (
          <div className="absolute top-3 right-3 z-10 has-data-[state=open]:opacity-100 transition-opacity text-[#1CA7A6]">
            <Link href={`/properties/new?propertyId=${propertyId}`}>
              <Plus className="size-6 mr-2" />
            </Link>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-[#1F2A44] text-gray-500 hover:text-white">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                {hasReport &&
                  <DropdownMenuItem
                    onClick={() => {
                      if (latitude && longitude && onOpenInMap) {
                        onOpenInMap(latitude, longitude, propertyId);
                      }
                    }}
                    className="gap-2 cursor-pointer py-2"
                    disabled={!latitude || !longitude}
                  >
                    <MapPin className="size-3.5" />
                    <span className="text-xs font-bold">Open in Map</span>
                  </DropdownMenuItem>}
                {isAdmin && (
                  <DropdownMenuItem asChild className="gap-2 cursor-pointer py-2">
                    <Link href={`/properties/edit/${propertyId}`}>
                      <Edit2 className="size-3.5" />
                      <span className="text-xs font-bold">Edit</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {canVerify && (
                  <DropdownMenuItem
                    onClick={() => setIsVerifySidebarOpen(true)}
                    className="gap-2 cursor-pointer py-2"
                  >
                    <ShieldCheck className="size-3.5" />
                    <span className="text-xs font-bold">Verify</span>
                  </DropdownMenuItem>
                )}
                {canAddNewProject && (
                  <>
                    <DropdownMenuItem asChild className="gap-2 cursor-pointer py-2">
                      <Link href={`/properties/new?propertyId=${propertyId}`}>
                        <FileText className="size-3.5" />
                        <span className="text-xs font-bold">Create New Project</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2 cursor-pointer py-2 text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="text-xs font-bold">Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>)}

        <CardContent
          onClick={() => { router.push(`${redirectUrl}${propertyId}`) }}
          className="p-4 md:p-8 flex flex-col h-full min-h-[140px] md:min-h-[220px]">
          <div className="space-y-1 flex justify-between">
            <div className='w-[60%] mb-[30px]'>
              <h3 className="text-[15px] md:text-2xl font-black text-[#1e293b] leading-[20px] md:leading-tight tracking-tighter uppercase font-asap">
                {propertyName}
              </h3>
            </div>
            <div className="shrink-0 absolute right-[32px] z-10">
              {canAddNewProject ?
                <>
                  <Link href={`/properties/new?propertyId=${propertyId}`} onClick={(e) => e.stopPropagation()}>
                    <Image
                      src="/assets/home-icon.png"
                      alt="view-property"
                      width={34}
                      height={34}
                      className="md:hidden"
                    />
                  </Link>
                  <Link href={`/properties/new?propertyId=${propertyId}`} onClick={(e) => e.stopPropagation()}>
                    <Image
                      src="/assets/home-icon.png"
                      alt="view-property"
                      width={60}
                      height={60}
                      className="hidden md:block"
                    />
                  </Link>
                </>
                :
                <>
                  <Image
                    src="/assets/home-icon.png"
                    alt="view-property"
                    width={34}
                    height={34}
                    className="md:hidden"
                  />
                  <Image
                    src="/assets/home-icon.png"
                    alt="view-property"
                    width={60}
                    height={60}
                    className="hidden md:block"
                  />
                </>}
            </div>
          </div>

          <div className="space-y-0 mt-2">
            <p className="text-[14px] md:text-lg font-bold text-gray-400">{address}</p>
            {address2 && <p className="text-[14px] md:text-lg font-bold text-gray-400">{address2}</p>}
            <p className="text-[14px] md:text-lg font-bold text-gray-400">{city} {state} {zip}</p>
          </div>
            <div className="mt-auto pt-4 md:pt-6 flex flex-row justify-between items-center">
              <div>
                <Link
                  href={`/property-details/${propertyId}`}
                  className="inline-flex items-center gap-2 text-[#1CA7A6] font-black text-xs md:text-sm uppercase tracking-[0.2em] group/link font-asap"
                >
                  {showDetail ? "Learn More" : "Add Project"}
                  {showDetail ? <ArrowRight className="size-4 md:size-5 transition-transform -rotate-45" /> : <Plus className="size-4 md:size-5 transition-transform" />}
                </Link>
              </div>
              <div>
                {hasReport &&
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (latitude && longitude && onOpenInMap) {
                        onOpenInMap(latitude, longitude, propertyId);
                      }
                    }}
                    disabled={!latitude || !longitude}
                    className="flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <MapPin className="size-5 text-[#1CA7A6] tracking-[0.2em] group/link" />
                  </button>
                }
              </div>
            </div>
        </CardContent>
      </Card>

      <AlertDialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)]">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Purchase Report
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
              {user?.role === 'contractor'
                ? 'This report requires purchase. Would you like to proceed with the payment?'
                : `You have ${reportUsage?.remaining || 0} free reports remaining. Would you like to purchase this report?`
              }
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)]">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Delete Property
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed">
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(propertyId)}
              className="h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfGenerationLoader isOpen={isGenerating} message="Generating Report..." />

      <PropertyVerifySidebar
        propertyId={propertyId}
        isOpen={isVerifySidebarOpen}
        onClose={() => setIsVerifySidebarOpen(false)}
      />
    </>
  );
}
