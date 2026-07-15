'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/components/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Search, ShieldCheck, Clock, Ban, ChevronLeft, MapPin, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getAddedPropertiesListing, updatePropertyApproval } from '@/lib/actions';
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

interface MockProperty {
    id: string;
    propertyName: string;
    address: string;
    cityStateZip: string;
    contractorName: string;
    contractorEmail: string;
    dateAdded: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    raw: any;
}

export default function AddedPropertiesPage() {
    const { user, role } = useUser();
    const router = useRouter();
    const [properties, setProperties] = useState<MockProperty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

    // States for Modals
    const [selectedProperty, setSelectedProperty] = useState<MockProperty | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'APPROVE' | 'REJECT';
        propertyId: string;
        propertyName: string;
    } | null>(null);

    const isAdmin = role === 'admin';

    const fetchProperties = async () => {
        setIsLoading(true);
        try {
            const res = await getAddedPropertiesListing({
                search: searchQuery,
            });

            if (res.success) {
                const items = Array.isArray(res.data)
                    ? res.data
                    : (Array.isArray(res.data?.data) ? res.data.data : []);

                const mapped = items.map((item: any) => {
                    const firstName = item.creator?.first_name || item.contractor?.first_name || '';
                    const lastName = item.creator?.last_name || item.contractor?.last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim() || 'N/A';
                    const email = item.creator?.email || item.contractor?.email || 'N/A';

                    const cityName = item.city_name || item.city?.name || '';
                    const stateName = item.state_name || item.state?.state_name || '';
                    const zipCode = item.zip || '';
                    const location = [cityName, stateName, zipCode].filter(Boolean).join(', ') || 'N/A';

                    // API status values: 'PENDING', 'APPROVED', 'REJECTED'
                    let apiStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
                    if (item.approval_status === 'APPROVE') {
                        apiStatus = 'APPROVED';
                    } else if (item.approval_status === 'REJECT') {
                        apiStatus = 'REJECTED';
                    }

                    return {
                        id: item.id,
                        propertyName: item.property_name || 'Unnamed Property',
                        address: item.address || 'N/A',
                        cityStateZip: location,
                        contractorName: fullName,
                        contractorEmail: email,
                        dateAdded: item.created_at || '',
                        status: apiStatus,
                        raw: item
                    };
                });
                setProperties(mapped);
            } else {
                toast.error(res.message || 'Failed to load properties');
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Error fetching properties');
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search input
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProperties();
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleApproveClick = (property: MockProperty) => {
        setConfirmAction({
            type: 'APPROVE',
            propertyId: property.id,
            propertyName: property.propertyName,
        });
    };

    const handleRejectClick = (property: MockProperty) => {
        setConfirmAction({
            type: 'REJECT',
            propertyId: property.id,
            propertyName: property.propertyName,
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        const { type, propertyId } = confirmAction;

        try {
            const apiStatus = type === 'APPROVE' ? 'APPROVE' : 'REJECT';
            const res = await updatePropertyApproval(propertyId, apiStatus);
            console.log(res)

            if (res.success) {
                const uiStatus = type === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                setProperties(prev =>
                    prev.map(p => (p.id === propertyId ? { ...p, status: uiStatus, raw: { ...p.raw, approval_status: uiStatus } } : p))
                );
                toast.success(`Property request has been ${type.toLowerCase()}d successfully!`);
            } else {
                toast.error(res.message || `Failed to update property status`);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(`Error updating property status`);
        } finally {
            setConfirmAction(null);
        }
    };

    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            return activeFilter === 'ALL' || p.status === activeFilter;
        });
    }, [properties, activeFilter]);

    return (
        <div className="min-h-screen bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] pb-20 font-asap">
            <div className="max-w-[1170px] mx-auto pt-7 md:pt-14 px-5 md:px-0 space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-[26px] md:text-[36px] font-bold text-[#1F2A44] uppercase tracking-normal leading-tight font-asap">
                            Added Properties
                        </h1>
                        <p className="text-[14px] md:text-[16px] font-normal text-[#708090] font-inter">
                            Manage and review property additions submitted by contractors.
                        </p>
                    </div>

                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider text-[#1CA7A6] hover:opacity-80 transition-opacity"
                    >
                        <ChevronLeft className="size-4" />
                        Back to Dashboard
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.06)] p-5 md:p-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-6 border border-slate-100">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer",
                                    activeFilter === tab
                                        ? "bg-[#1CA7A6] text-white shadow-[0px_4px_12px_rgba(28,167,166,0.2)]"
                                        : "bg-slate-50 hover:bg-slate-100 text-[#708090] border border-slate-200/60"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                        <Input
                            placeholder="Search by name or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-[42px] rounded-lg border-slate-200/80 focus:border-[#1CA7A6] focus:ring-[#1CA7A6]/10 font-medium"
                        />
                    </div>
                </div>

                {/* Listing Container */}
                <div className="bg-white rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.08)] overflow-hidden border border-slate-100/60">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-100 text-[#708090] text-xs font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6">Property Details</th>
                                    <th className="py-4 px-6">Submitted By</th>
                                    <th className="py-4 px-6">Date Added</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-[#708090]">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="size-8 animate-spin text-[#1CA7A6]" />
                                                <p className="text-sm font-semibold uppercase tracking-wider">Loading properties...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProperties.length > 0 ? (
                                    filteredProperties.map(property => (
                                        <tr key={property.id} className="hover:bg-slate-50/40 transition-colors group">
                                            {/* Property Info */}
                                            <td className="py-5 px-6">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-[#1F2A44] text-[15px] md:text-[17px] group-hover:text-[#1CA7A6] transition-colors leading-tight">
                                                        {property.propertyName}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-[13px] font-medium text-[#708090]">
                                                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                                                        <span>{property.address}, {property.cityStateZip}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Submitter */}
                                            <td className="py-5 px-6">
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-sm text-[#1F2A44]">{property.contractorName}</p>
                                                    <p className="text-[12px] text-[#708090] font-normal">{property.contractorEmail}</p>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="py-5 px-6 text-sm font-semibold text-[#708090]">
                                                {property.dateAdded ? new Date(property.dateAdded).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : 'N/A'}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-5 px-6">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                                    property.status === 'APPROVED' && "bg-emerald-50 text-emerald-600 border-emerald-200/50",
                                                    property.status === 'PENDING' && "bg-amber-50 text-amber-600 border-amber-200/50 animate-pulse",
                                                    property.status === 'REJECTED' && "bg-rose-50 text-rose-600 border-rose-200/50"
                                                )}>
                                                    {property.status === 'APPROVED' && <ShieldCheck className="size-3.5" />}
                                                    {property.status === 'PENDING' && <Clock className="size-3.5" />}
                                                    {property.status === 'REJECTED' && <Ban className="size-3.5" />}
                                                    {property.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedProperty(property)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/40 transition-all cursor-pointer hover:scale-105"
                                                        title="View Details"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>
                                                    {isAdmin && property.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveClick(property)}
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/40 transition-all cursor-pointer hover:scale-105"
                                                                title="Approve Property"
                                                            >
                                                                <Check className="size-4 font-extrabold" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectClick(property)}
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/40 transition-all cursor-pointer hover:scale-105"
                                                                title="Reject Property"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-[#708090]">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <MapPin className="size-8 opacity-40" />
                                                <p className="text-[16px] font-bold uppercase tracking-wider">No properties found</p>
                                                <p className="text-xs font-medium">Try adjusting your filters or search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirm Action Dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent className="sm:max-w-[425px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] font-asap">
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight">
                            {confirmAction?.type === 'APPROVE' ? 'Approve Property' : 'Reject Property'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-600 font-medium leading-relaxed font-inter">
                            Are you sure you want to {confirmAction?.type === 'APPROVE' ? 'approve' : 'reject'} the property addition request for <strong className="text-[#1F2A44]">{confirmAction?.propertyName}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
                        <AlertDialogCancel className="h-11 rounded-xl font-bold uppercase tracking-widest border-2 hover:bg-slate-50 cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={cn(
                                "h-11 text-white rounded-xl font-black uppercase tracking-widest cursor-pointer",
                                confirmAction?.type === 'APPROVE'
                                    ? "bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 shadow-none border-none"
                                    : "bg-rose-600 hover:bg-rose-700 shadow-none border-none"
                            )}
                        >
                            {confirmAction?.type === 'APPROVE' ? 'Approve' : 'Reject'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Property Detail Modal */}
            <AlertDialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
                <AlertDialogContent className="sm:max-w-[500px] rounded-[20px] border-none shadow-[0px_4px_34px_rgba(31,42,68,0.1)] font-asap overflow-y-auto max-h-[90vh]">
                    <AlertDialogHeader className="space-y-3 pb-3 border-b border-slate-100">
                        <AlertDialogTitle className="text-xl md:text-2xl font-black text-[#1F2A44] uppercase tracking-tight">
                            Property Details
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#708090] font-medium font-inter">
                            Overview of the submitted property information.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Front Image Preview */}
                    {selectedProperty?.raw?.front_image && (
                        <div className="w-full h-48 relative rounded-xl overflow-hidden mt-3 bg-slate-100 border border-slate-200">
                            <img
                                src={selectedProperty.raw.front_image}
                                alt="Property Front"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="space-y-4 py-4 text-[#1F2A44]">
                        <div className="grid grid-cols-3 gap-2 items-start">
                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Name</span>
                            <span className="col-span-2 text-sm font-semibold">{selectedProperty?.propertyName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-start">
                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Address</span>
                            <span className="col-span-2 text-sm font-semibold">
                                {selectedProperty?.address}
                                {selectedProperty?.raw?.address2 && (
                                    <span className="block text-xs font-normal text-[#708090]">
                                        Unit/Suite: {selectedProperty.raw.address2}
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-start">
                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">City/State/Zip</span>
                            <span className="col-span-2 text-sm font-semibold">{selectedProperty?.cityStateZip}</span>
                        </div>
                        {selectedProperty?.raw?.parcel_id && (
                            <div className="grid grid-cols-3 gap-2 items-start">
                                <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Parcel ID</span>
                                <span className="col-span-2 text-sm font-mono font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50 w-fit">
                                    {selectedProperty.raw.parcel_id}
                                </span>
                            </div>
                        )}
                        {selectedProperty?.raw?.property_type?.type_name && (
                            <div className="grid grid-cols-3 gap-2 items-start">
                                <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Prop Type</span>
                                <span className="col-span-2 text-sm font-semibold">{selectedProperty.raw.property_type.type_name}</span>
                            </div>
                        )}
                        {selectedProperty?.raw?.yearbuilt && (
                            <div className="grid grid-cols-3 gap-2 items-start">
                                <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Year Built</span>
                                <span className="col-span-2 text-sm font-semibold">{selectedProperty.raw.yearbuilt}</span>
                            </div>
                        )}
                        {selectedProperty?.raw?.square_foot && (
                            <div className="grid grid-cols-3 gap-2 items-start">
                                <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Sq Footage</span>
                                <span className="col-span-2 text-sm font-semibold">{selectedProperty.raw.square_foot} sq ft</span>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 items-start">
                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Contractor</span>
                            <div className="col-span-2 text-sm">
                                <p className="font-semibold">{selectedProperty?.contractorName}</p>
                                <p className="text-[12px] text-[#708090]">{selectedProperty?.contractorEmail}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-start">
                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Date Added</span>
                            <span className="col-span-2 text-sm font-semibold">
                                {selectedProperty?.dateAdded ? new Date(selectedProperty.dateAdded).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-start">
                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#708090]">Status</span>
                            <span className="col-span-2">
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                    selectedProperty?.status === 'APPROVED' && "bg-emerald-50 text-emerald-600 border-emerald-200/50",
                                    selectedProperty?.status === 'PENDING' && "bg-amber-50 text-amber-600 border-amber-200/50",
                                    selectedProperty?.status === 'REJECTED' && "bg-rose-50 text-rose-600 border-rose-200/50"
                                )}>
                                    {selectedProperty?.status}
                                </span>
                            </span>
                        </div>
                    </div>

                    <AlertDialogFooter className="pt-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full h-11 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest border-none cursor-pointer flex items-center justify-center">
                            Close
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
