"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  getStates,
  getCities,
  getPropertyListAll,
  deleteProperty,
  getPropertyDetail,
  updateProperties,
  getPropertyOwners,
  getPropertyTypes,
} from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ArrowLeft,
  Building,
  Building2,
  X,
  Sparkles,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AddressForm,
  AddressData,
  PropertyOwnerOption,
  PropertyTypeOption,
} from "@/components/property-wizard/AddressForm";
import { PropertyAddressPhotos } from "@/components/property-wizard/PropertyAddressPhotos";
import { StateOption, CityOption } from "@/lib/location-utils";

type ViewLevel = "state" | "city" | "property";

interface StateItem {
  id: string;
  name: string;
  abbreviation?: string;
  city_count?: number;
  property_count?: number;
}

interface CityItem {
  id: string;
  name: string;
  state_id?: string;
  state_name?: string;
  zip?: string;
  property_count?: number;
}

interface PropertyItem {
  id: string;
  property_name?: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  zip?: string;
  city?: { name?: string };
  state?: { name?: string };
  is_purchased?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   EDIT PROPERTY MODAL (ADDRESS + PHOTOS)
─────────────────────────────────────────────────────────────── */
function EditPropertyModal({
  propertyId,
  open,
  onOpenChange,
  onSuccess,
}: {
  propertyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"address" | "photos">("address");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);

  const [addressData, setAddressData] = useState<AddressData>({
    address: "",
    address2: "",
    property_type_id: "",
    city_id: "",
    city: "",
    state: "",
    zip: "",
    property_name: "",
    property_owner_id: "",
  });

  const initialAddressRef = useRef<AddressData | null>(null);

  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [propertyOwners, setPropertyOwners] = useState<PropertyOwnerOption[]>(
    [],
  );
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);

  useEffect(() => {
    if (!open || !propertyId) return;

    let isMounted = true;
    const loadProperty = async () => {
      setLoading(true);
      setActiveTab("address");
      try {
        const [res, statesRes, citiesRes, ownersRes, typesRes] =
          await Promise.all([
            getPropertyDetail(propertyId).catch(() => null),
            getStates(1, 1000).catch(() => []),
            getCities().catch(() => []),
            getPropertyOwners().catch(() => []),
            getPropertyTypes().catch(() => []),
          ]);

        if (!isMounted) return;

        const prop = res?.data ?? res;
        setProperty(prop);

        const rawStates: any[] = Array.isArray(statesRes)
          ? statesRes
          : (statesRes as any)?.data || [];
        const rawCities: any[] = Array.isArray(citiesRes)
          ? citiesRes
          : (citiesRes as any)?.data || [];
        const rawOwners: any[] = Array.isArray(ownersRes)
          ? ownersRes
          : (ownersRes as any)?.data || [];
        const rawPropertyTypes: any[] = Array.isArray(typesRes)
          ? typesRes
          : Array.isArray((typesRes as any)?.data)
            ? (typesRes as any).data
            : Array.isArray((typesRes as any)?.data?.data)
              ? (typesRes as any).data.data
              : [];

        setStates(
          rawStates.map((s) => ({
            id: String(s.id),
            name: s.state_name || s.name,
            abbreviation: s.abbreviation,
          })),
        );
        setCities(
          rawCities.map((c) => ({
            id: String(c.id),
            name: c.city_name || c.name,
            state_id: c.state_id ? String(c.state_id) : undefined,
          })),
        );
        setPropertyOwners(
          rawOwners.map((o: any) => ({
            id: String(o.id),
            first_name: o.first_name,
            last_name: o.last_name,
            email: o.email,
          })),
        );
        const mappedTypes = rawPropertyTypes.map((pt: any, idx: number) => ({
          id: pt.id ? String(pt.id) : pt.category || `pt-${idx}`,
          category: pt.category || pt.name,
          name: pt.category || pt.name,
        }));

        if (
          !mappedTypes.some(
            (t: any) => t.category === "OTHER" || t.id === "OTHER",
          )
        ) {
          mappedTypes.push({
            id: "OTHER",
            category: "OTHER",
            name: "OTHER",
          });
        }

        setPropertyTypes(mappedTypes);

        const propTypeId =
          prop?.property_type_id || prop?.property_type?.id || "";
        const propTypeCategory =
          prop?.property_type_category || prop?.property_type?.category || "";
        const otherPropType =
          prop?.other_property_type || prop?.other_property_type_name || "";
        const isOtherProp =
          propTypeCategory === "OTHER" ||
          propTypeId === "OTHER" ||
          !!otherPropType;

        const initialData: AddressData = {
          address: prop?.address || "",
          address2: prop?.address2 || "",
          property_type_id: isOtherProp ? propTypeId || "OTHER" : propTypeId,
          property_type_category: isOtherProp ? "OTHER" : propTypeCategory,
          other_property_type: otherPropType,
          initial_other_property_type: otherPropType,
          initial_property_type_id:
            propTypeId && propTypeId !== "OTHER" ? propTypeId : undefined,
          property_name: prop?.property_name || "",
          city_id: prop?.city_id || "",
          city: prop?.city_name || "",
          other_city: prop?.other_city || "",
          state: prop?.state_id || "",
          zip: prop?.zip || "",
          property_owner_id: prop?.property_owner_id || "",
          latitude: prop?.latitude ? Number(prop.latitude) : undefined,
          longitude: prop?.longitude ? Number(prop.longitude) : undefined,
        };

        setAddressData(initialData);
        initialAddressRef.current = initialData;
      } catch (err: any) {
        toast.error(err?.message || "Failed to load property details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProperty();
    return () => {
      isMounted = false;
    };
  }, [open, propertyId]);

  const hasAddressChanged = () => {
    if (!initialAddressRef.current) return false;
    const init = initialAddressRef.current;
    const curr = addressData;

    return (
      (curr.address || "") !== (init.address || "") ||
      (curr.address2 || "") !== (init.address2 || "") ||
      (curr.property_type_id || "") !== (init.property_type_id || "") ||
      (curr.property_type_category || "") !==
        (init.property_type_category || "") ||
      (curr.other_property_type || "") !== (init.other_property_type || "") ||
      (curr.property_name || "") !== (init.property_name || "") ||
      (curr.city_id || "") !== (init.city_id || "") ||
      (curr.other_city || "") !== (init.other_city || "") ||
      (curr.state || "") !== (init.state || "") ||
      (curr.zip || "") !== (init.zip || "") ||
      (curr.property_owner_id || "") !== (init.property_owner_id || "") ||
      curr.latitude !== init.latitude ||
      curr.longitude !== init.longitude
    );
  };

  const handleSaveAddress = async (e?: React.FormEvent, nextStep?: string) => {
    if (e) e.preventDefault();
    if (!propertyId) return false;

    setSaving(true);
    try {
      const isOtherType =
        addressData.property_type_category === "OTHER" ||
        addressData.property_type_id === "OTHER" ||
        addressData.property_type === "OTHER" ||
        !!addressData.other_property_type;

      let finalPropertyTypeId: string | null = null;
      if (isOtherType) {
        const hasChangedOtherText =
          addressData.other_property_type !==
          addressData.initial_other_property_type;
        if (!hasChangedOtherText && addressData.initial_property_type_id) {
          finalPropertyTypeId = addressData.initial_property_type_id;
        } else {
          finalPropertyTypeId = null;
        }
      } else {
        finalPropertyTypeId =
          addressData.property_type_id || addressData.property_type || null;
      }

      const res = await updateProperties(propertyId, {
        address: addressData.address,
        address2: addressData.address2,
        property_type_id: finalPropertyTypeId,
        property_type_category: isOtherType
          ? "OTHER"
          : addressData.property_type_category || null,
        other_property_type: isOtherType
          ? addressData.other_property_type || null
          : null,
        property_name: addressData.property_name,
        city_id: addressData.city_id || null,
        other_city: addressData.other_city || null,
        state_id: addressData.state || addressData.state_id || null,
        zip: addressData.zip,
        property_owner_id: addressData.property_owner_id,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      });

      if (!res?.success) {
        toast.error(res?.message || "Failed to update property address");
        return false;
      }

      initialAddressRef.current = { ...addressData };
      toast.success("Property address updated successfully");
      if (nextStep === "IMAGES") {
        setActiveTab("photos");
      } else if (nextStep === "CLOSE") {
        onSuccess();
        onOpenChange(false);
      }
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Failed to save address");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleTabSwitch = async (targetTab: "address" | "photos") => {
    if (targetTab === activeTab || saving) return;

    if (activeTab === "address" && targetTab === "photos") {
      if (hasAddressChanged()) {
        await handleSaveAddress(undefined, "IMAGES");
      } else {
        setActiveTab("photos");
      }
    } else {
      setActiveTab(targetTab);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-[16px] sm:rounded-[24px] p-4 sm:p-6 border-none shadow-2xl bg-white focus:outline-none">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg sm:text-2xl font-black text-[#1F2A44] uppercase font-asap tracking-tight">
            Edit Property
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-500 font-medium">
            Update address information and property photos
          </DialogDescription>

          {/* Responsive Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 pt-3 w-full sm:w-auto sm:flex sm:items-center sm:gap-3">
            <Button
              type="button"
              disabled={saving}
              variant={activeTab === "address" ? "primary" : "outline"}
              onClick={() => handleTabSwitch("address")}
              className={`h-10 px-3 sm:px-4 rounded-xl font-bold uppercase tracking-wider text-xs w-full sm:w-auto transition-all ${
                activeTab === "address"
                  ? "bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white shadow-sm shadow-[#1CA7A6]/30"
                  : "border-[#1CA7A6]/50 text-[#1CA7A6] hover:bg-[#1CA7A6]/10"
              }`}
            >
              1. Address Details
            </Button>
            <Button
              type="button"
              disabled={saving}
              variant={activeTab === "photos" ? "primary" : "outline"}
              onClick={() => handleTabSwitch("photos")}
              className={`h-10 px-3 sm:px-4 rounded-xl font-bold uppercase tracking-wider text-xs w-full sm:w-auto transition-all ${
                activeTab === "photos"
                  ? "bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white shadow-sm shadow-[#1CA7A6]/30"
                  : "border-[#1CA7A6]/50 text-[#1CA7A6] hover:bg-[#1CA7A6]/10"
              }`}
            >
              {saving && activeTab === "address" ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : null}
              2. Property Photos
            </Button>
          </div>
        </DialogHeader>

        <div className="py-2 sm:py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="size-8 animate-spin text-[#1CA7A6]" />
              <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
                Loading property details...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "address" && (
                <AddressForm
                  data={addressData}
                  onChange={setAddressData}
                  onSubmit={handleSaveAddress}
                  loading={saving}
                  states={states}
                  cities={cities}
                  propertyOwners={propertyOwners}
                  propertyTypes={propertyTypes}
                  isEdit
                  onBack={() => onOpenChange(false)}
                  hasSavedImages={
                    !!property?.front_image || !!property?.other_image
                  }
                />
              )}

              {activeTab === "photos" && propertyId && (
                <PropertyAddressPhotos
                  address={property?.address || addressData.address}
                  propertyId={propertyId}
                  onSave={() => {
                    toast.success("Photos updated successfully");
                    onSuccess();
                    onOpenChange(false);
                  }}
                  onBack={() => setActiveTab("address")}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN ADMIN PROPERTY LISTING PAGE
─────────────────────────────────────────────────────────────── */
export default function PropertyListPage() {
  const [level, setLevel] = useState<ViewLevel>("state");

  // Selection hierarchy
  const [selectedState, setSelectedState] = useState<StateItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination API state
  const [paginationInfo, setPaginationInfo] = useState<{
    total?: number;
    page?: number;
    totalPages?: number;
    total_properties?: number;
  }>({});

  // Data lists
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);

  // Deletion modal
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Computed total property counts for breadcrumbs
  const totalStatesProperties = useMemo(() => {
    if (paginationInfo.total_properties !== undefined && level === "state") {
      return paginationInfo.total_properties;
    }
    return states.reduce((acc, s) => acc + (s.property_count || 0), 0);
  }, [states, paginationInfo, level]);

  const totalSelectedStateProperties = useMemo(() => {
    if (paginationInfo.total_properties !== undefined && level === "city") {
      return paginationInfo.total_properties;
    }
    if (
      selectedState?.property_count !== undefined &&
      selectedState?.property_count !== null
    ) {
      return selectedState.property_count;
    }
    return cities.reduce((acc, c) => acc + (c.property_count || 0), 0);
  }, [selectedState, cities, paginationInfo, level]);

  const totalSelectedCityProperties = useMemo(() => {
    if (paginationInfo.total_properties !== undefined && level === "property") {
      return paginationInfo.total_properties;
    }
    if (paginationInfo.total !== undefined && level === "property") {
      return paginationInfo.total;
    }
    if (
      selectedCity?.property_count !== undefined &&
      selectedCity?.property_count !== null
    ) {
      return selectedCity.property_count;
    }
    return properties.length;
  }, [selectedCity, properties, paginationInfo, level]);

  // Reset pagination & search when level changes
  useEffect(() => {
    setSearchQuery("");
    setAppliedSearch("");
  }, [level]);

  useEffect(() => {
    setPage(1);
    fetchData(1, false);
  }, [level, selectedState?.id, selectedCity?.id, appliedSearch]);

  const fetchData = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const limit = 15;

      if (level === "state") {
        const response = await getStates(
          pageNum,
          limit,
          appliedSearch || undefined,
          true,
        );
        const pagination =
          response?.pagination ||
          response?.data?.pagination ||
          (response?.total !== undefined ? response : undefined);

        if (pagination) {
          setPaginationInfo({
            total:
              pagination.total !== undefined
                ? Number(pagination.total)
                : undefined,
            page:
              pagination.page !== undefined
                ? Number(pagination.page)
                : undefined,
            totalPages:
              pagination.totalPages !== undefined
                ? Number(pagination.totalPages)
                : undefined,
            total_properties:
              pagination.total_properties !== undefined
                ? Number(pagination.total_properties)
                : undefined,
          });
        }

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        const mappedStates: StateItem[] = data.map((item: any) => {
          const rawCityCount =
            item.city_count ??
            item.cities_count ??
            item.cityCount ??
            item.cities_cnt ??
            item._count?.cities ??
            item.total_cities;

          const rawPropertyCount =
            item.property_count ??
            item.properties_count ??
            item.propertyCount ??
            item.properties_cnt ??
            item._count?.properties ??
            item.total_properties;

          return {
            id: String(item.id),
            name: item.state_name || item.name || "Unknown State",
            abbreviation: item.abbreviation || "",
            city_count:
              rawCityCount !== undefined && rawCityCount !== null
                ? Number(rawCityCount)
                : undefined,
            property_count:
              rawPropertyCount !== undefined && rawPropertyCount !== null
                ? Number(rawPropertyCount)
                : undefined,
          };
        });

        if (append) {
          setStates((prev) => [...prev, ...mappedStates]);
        } else {
          setStates(mappedStates);
        }
        setHasMore(
          pagination?.totalPages
            ? pageNum < pagination.totalPages
            : mappedStates.length === limit,
        );
      } else if (level === "city") {
        if (!selectedState?.id) return;
        const response = await getCities(
          pageNum,
          limit,
          undefined,
          appliedSearch || undefined,
          selectedState.id,
          true,
          true,
        );
        const pagination =
          response?.pagination ||
          response?.data?.pagination ||
          (response?.total !== undefined ? response : undefined);

        if (pagination) {
          setPaginationInfo({
            total:
              pagination.total !== undefined
                ? Number(pagination.total)
                : undefined,
            page:
              pagination.page !== undefined
                ? Number(pagination.page)
                : undefined,
            totalPages:
              pagination.totalPages !== undefined
                ? Number(pagination.totalPages)
                : undefined,
            total_properties:
              pagination.total_properties !== undefined
                ? Number(pagination.total_properties)
                : undefined,
          });
        }

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        const mappedCities: CityItem[] = data.map((item: any) => {
          const rawPropertyCount =
            item.property_count ??
            item.properties_count ??
            item.propertyCount ??
            item.properties_cnt ??
            item._count?.properties ??
            item.total_properties;

          return {
            id: String(item.id),
            name: item.city_name || item.name || "Unknown City",
            state_id: String(item.state_id || selectedState.id),
            state_name: selectedState.name,
            zip: item.zip || item.zip_code || "",
            property_count:
              rawPropertyCount !== undefined && rawPropertyCount !== null
                ? Number(rawPropertyCount)
                : undefined,
          };
        });

        if (append) {
          setCities((prev) => [...prev, ...mappedCities]);
        } else {
          setCities(mappedCities);
        }
        setHasMore(
          pagination?.totalPages
            ? pageNum < pagination.totalPages
            : mappedCities.length === limit,
        );
      } else if (level === "property") {
        if (!selectedState?.id || !selectedCity?.id) return;
        const response = await getPropertyListAll({
          state_id: selectedState.id,
          city_id: selectedCity.id,
          search: appliedSearch || undefined,
          page: pageNum,
          limit: limit,
        });
        const pagination =
          response?.pagination ||
          response?.data?.pagination ||
          (response?.total !== undefined ? response : undefined);

        if (pagination) {
          setPaginationInfo({
            total:
              pagination.total !== undefined
                ? Number(pagination.total)
                : undefined,
            page:
              pagination.page !== undefined
                ? Number(pagination.page)
                : undefined,
            totalPages:
              pagination.totalPages !== undefined
                ? Number(pagination.totalPages)
                : undefined,
            total_properties:
              pagination.total_properties !== undefined
                ? Number(pagination.total_properties)
                : undefined,
          });
        }

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        const mappedProps: PropertyItem[] = data.map((item: any) => ({
          id: String(item.id),
          property_name:
            item.property_name || item.address || "Untitled Property",
          address: item.address || item.property_name || "",
          city_name: item.city_name || item.city?.name || selectedCity.name,
          state_name: item.state_name || item.state?.name || selectedState.name,
          zip: item.zip || "",
          is_purchased: item.is_purchased,
        }));

        if (append) {
          setProperties((prev) => [...prev, ...mappedProps]);
        } else {
          setProperties(mappedProps);
        }
        setHasMore(
          pagination?.totalPages
            ? pageNum < pagination.totalPages
            : mappedProps.length === limit,
        );
      }
    } catch (error) {
      console.error(`Failed to fetch ${level} data:`, error);
      toast.error(`Failed to load ${level} listing`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  };

  // Handlers for selection navigation
  const handleSelectState = (state: StateItem) => {
    setSelectedState(state);
    setSelectedCity(null);
    setLevel("city");
  };

  const handleSelectCity = (city: CityItem) => {
    setSelectedCity(city);
    setLevel("property");
  };

  // Handlers for property actions
  const handleOpenEditModal = (propId: string) => {
    setEditPropertyId(propId);
    setIsEditModalOpen(true);
  };

  const handleDeletePropertyConfirm = async () => {
    if (!propertyToDelete) return;
    setIsDeleting(true);
    try {
      const response = await deleteProperty(propertyToDelete.id);
      if (response?.success) {
        toast.success("Property deleted successfully");
        setProperties((prev) =>
          prev.filter((p) => p.id !== propertyToDelete.id),
        );
      } else {
        toast.error(response?.message || "Failed to delete property");
      }
    } catch (error: any) {
      console.error("Delete property error:", error);
      toast.error(error?.message || "Failed to delete property");
    } finally {
      setIsDeleting(false);
      setPropertyToDelete(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1400px] w-full mx-auto pb-12">
      {/* Header & Title */}
      <div className="flex flex-row items-center justify-between gap-3 border-b pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1F2A44] uppercase font-asap tracking-tight truncate">
            Property Listing
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 truncate">
            Browse and manage properties by State and City
          </p>
        </div>

        {level !== "state" && (
          <Button
            variant="outline"
            onClick={() => {
              if (level === "property") setLevel("city");
              else if (level === "city") setLevel("state");
            }}
            className="shrink-0 gap-1.5 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#1CA7A6]/10 font-bold uppercase tracking-wider text-xs h-9 px-3 sm:px-4 rounded-xl transition-all"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </Button>
        )}
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider bg-slate-50/80 backdrop-blur p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setSelectedState(null);
              setSelectedCity(null);
              setLevel("state");
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
              level === "state"
                ? "text-[#1CA7A6] bg-[#1CA7A6]/10 font-black"
                : "text-gray-600 hover:text-[#1CA7A6] hover:bg-white"
            }`}
          >
            <Building className="size-4 shrink-0" />
            <span>States</span>
          </button>
          {level === "state" &&
            (paginationInfo.total_properties !== undefined ||
              totalStatesProperties > 0) && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#1CA7A6]/10 text-[#1CA7A6] border border-[#1CA7A6]/20 shrink-0 font-asap">
                {paginationInfo.total_properties ?? totalStatesProperties}{" "}
                {(paginationInfo.total_properties ?? totalStatesProperties) ===
                1
                  ? "Property"
                  : "Properties"}
              </span>
            )}
        </div>

        {selectedState && (
          <>
            <ChevronRight className="size-4 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setSelectedCity(null);
                  setLevel("city");
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                  level === "city"
                    ? "text-[#1CA7A6] bg-[#1CA7A6]/10 font-black"
                    : "text-gray-600 hover:text-[#1CA7A6] hover:bg-white"
                }`}
              >
                <Building2 className="size-4 shrink-0" />
                <span className="max-w-[120px] sm:max-w-[200px] truncate">
                  {selectedState.name}
                </span>
              </button>
              {level === "city" && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#1CA7A6]/10 text-[#1CA7A6] border border-[#1CA7A6]/20 shrink-0 font-asap">
                  {totalSelectedStateProperties}{" "}
                  {totalSelectedStateProperties === 1
                    ? "Property"
                    : "Properties"}
                </span>
              )}
            </div>
          </>
        )}

        {selectedCity && level === "property" && (
          <>
            <ChevronRight className="size-4 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[#1CA7A6] font-black flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1CA7A6]/10 shrink-0">
                <MapPin className="size-4 shrink-0" />
                <span className="max-w-[120px] sm:max-w-[200px] truncate">
                  {selectedCity.name}
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#1CA7A6]/10 text-[#1CA7A6] border border-[#1CA7A6]/20 shrink-0 font-asap">
                {totalSelectedCityProperties}{" "}
                {totalSelectedCityProperties === 1 ? "Property" : "Properties"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={
              level === "state"
                ? "Search state..."
                : level === "city"
                  ? `Search city in ${selectedState?.name || "state"}...`
                  : `Search properties in ${selectedCity?.name || "city"}...`
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAppliedSearch(searchQuery);
              }
            }}
            className="pl-10 pr-9 h-11 sm:h-12 rounded-xl border-gray-300 focus:border-[#1CA7A6] focus:ring-[#1CA7A6]/20 font-medium text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          onClick={() => setAppliedSearch(searchQuery)}
          className="h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-wider gap-1.5 shrink-0 shadow-sm transition-all active:scale-95"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>

      {/* Content Section */}
      {loading && page === 1 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[76px] sm:h-[68px] rounded-[14px]" />
          ))}
        </div>
      ) : (
        <>
          {/* LEVEL 1: STATES */}
          {level === "state" && (
            <div className="space-y-3">
              {states.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed p-6 space-y-3">
                  <Building className="size-10 text-gray-300 mx-auto" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm sm:text-base">
                    No states found.
                  </p>
                  {appliedSearch && (
                    <Button
                      variant="outline"
                      onClick={handleClearSearch}
                      className="text-xs font-bold border-[#1CA7A6] text-[#1CA7A6]"
                    >
                      Clear Search Filter
                    </Button>
                  )}
                </div>
              ) : (
                states.map((stateItem) => (
                  <div
                    key={stateItem.id}
                    className="group relative bg-white border border-slate-200 hover:border-[#1CA7A6] rounded-[14px] p-3.5 sm:p-4 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 p-2.5 sm:p-3 bg-[#1CA7A6]/10 text-[#1CA7A6] rounded-xl group-hover:bg-[#1CA7A6] group-hover:text-white transition-colors duration-200">
                        <Building className="size-5 sm:size-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-[#1e293b] uppercase tracking-tight font-asap truncate">
                            {stateItem.name}
                          </h3>

                          {stateItem.abbreviation && (
                            <span className="text-xs font-bold text-gray-400 uppercase">
                              ({stateItem.abbreviation})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {stateItem.city_count !== undefined &&
                            stateItem.city_count !== null && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#1CA7A6] border border-[#1CA7A6]/20 font-asap shrink-0">
                                {stateItem.city_count}{" "}
                                {stateItem.city_count === 1 ? "City" : "Cities"}
                              </span>
                            )}

                          {stateItem.property_count !== undefined &&
                            stateItem.property_count !== null && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#1CA7A6] border border-[#1CA7A6]/20 font-asap shrink-0">
                                {stateItem.property_count}{" "}
                                {stateItem.property_count === 1
                                  ? "Property"
                                  : "Properties"}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleSelectState(stateItem)}
                        className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <Eye className="size-3.5" />
                        <span>View Cities</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* LEVEL 2: CITIES */}
          {level === "city" && (
            <div className="space-y-3">
              {cities.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed p-6 space-y-3">
                  <MapPin className="size-10 text-gray-300 mx-auto" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm sm:text-base">
                    No cities found for {selectedState?.name}.
                  </p>
                  {appliedSearch && (
                    <Button
                      variant="outline"
                      onClick={handleClearSearch}
                      className="text-xs font-bold border-[#1CA7A6] text-[#1CA7A6]"
                    >
                      Clear Search Filter
                    </Button>
                  )}
                </div>
              ) : (
                cities.map((cityItem) => (
                  <div
                    key={cityItem.id}
                    className="group relative bg-white border border-slate-200 hover:border-[#1CA7A6] rounded-[14px] p-3.5 sm:p-4 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 p-2.5 sm:p-3 bg-[#1CA7A6]/10 text-[#1CA7A6] rounded-xl group-hover:bg-[#1CA7A6] group-hover:text-white transition-colors duration-200">
                        <MapPin className="size-5 sm:size-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-[#1e293b] uppercase tracking-tight font-asap truncate">
                            {cityItem.name}
                          </h3>

                          {cityItem.property_count !== undefined &&
                            cityItem.property_count !== null && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#1CA7A6] border border-[#1CA7A6]/20 font-asap shrink-0">
                                {cityItem.property_count}{" "}
                                {cityItem.property_count === 1
                                  ? "Property"
                                  : "Properties"}
                              </span>
                            )}
                        </div>

                        <p className="text-xs font-semibold text-gray-400 mt-0.5">
                          State: {selectedState?.name}{" "}
                          {cityItem.zip ? `| Zip: ${cityItem.zip}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleSelectCity(cityItem)}
                        className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <Eye className="size-3.5" />
                        <span>View Properties</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* LEVEL 3: PROPERTIES */}
          {level === "property" && (
            <div className="space-y-3">
              {properties.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed p-6 space-y-3">
                  <Building2 className="size-10 text-gray-300 mx-auto" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm sm:text-base">
                    No properties found in {selectedCity?.name},{" "}
                    {selectedState?.name}.
                  </p>
                  {appliedSearch && (
                    <Button
                      variant="outline"
                      onClick={handleClearSearch}
                      className="text-xs font-bold border-[#1CA7A6] text-[#1CA7A6]"
                    >
                      Clear Search Filter
                    </Button>
                  )}
                </div>
              ) : (
                properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="group relative bg-white border border-slate-200 hover:border-[#1CA7A6] rounded-[14px] p-3.5 sm:p-4 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                        <Image
                          src="/assets/home-icon.png"
                          alt="property"
                          width={36}
                          height={36}
                          className="sm:w-[40px] sm:h-[40px] object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-[#1e293b] uppercase tracking-tight font-asap truncate">
                          {prop.address}
                        </h3>
                        <p className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-500 mt-0.5 flex-wrap">
                          <MapPin className="size-3.5 text-[#1CA7A6] shrink-0" />
                          <span className="truncate">
                            {prop.city_name}
                            {prop.city_name && prop.state_name ? ", " : ""}
                            {prop.state_name} {prop.zip}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleOpenEditModal(prop.id)}
                        className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Edit className="size-3.5" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setPropertyToDelete(prop)}
                        className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2 font-black uppercase tracking-widest text-[#1CA7A6] hover:bg-[#1CA7A6]/10 h-10 px-6 rounded-xl transition-all"
              >
                {loadingMore && <Loader2 className="size-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Property Edit Modal Dialog */}
      <EditPropertyModal
        propertyId={editPropertyId}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={() => {
          fetchData(1, false);
        }}
      />

      {/* Delete Property Confirmation Dialog */}
      <AlertDialog
        open={!!propertyToDelete}
        onOpenChange={(open) => !open && setPropertyToDelete(null)}
      >
        <AlertDialogContent className="w-[95vw] max-w-[425px] rounded-[20px] border-none shadow-2xl p-5 sm:p-6 bg-white">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl sm:text-2xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Delete Property
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-[#1F2A44]">
                "{propertyToDelete?.address}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-11 w-full sm:w-auto rounded-xl font-bold uppercase tracking-wider border-2 hover:bg-gray-50 text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePropertyConfirm}
              disabled={isDeleting}
              className="h-11 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-wider gap-2 text-xs"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
