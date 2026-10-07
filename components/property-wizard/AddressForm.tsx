"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateOption, CityOption } from "@/lib/location-utils";
import { toast } from "sonner";
import { useUser } from "../providers/user-provider";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCities, getUserProfile, getReportUsage } from "@/lib/actions";
import { MapDialog } from "./MapDialog";
import { toTitleCase, cn } from "@/lib/utils";

export interface AddressData {
  address: string;
  address2?: string;
  property_type_id?: string;
  property_type_category?: string;
  other_property_type?: string;
  initial_other_property_type?: string;
  initial_property_type_id?: string;
  property_type?: string;
  city_id: string;
  city: string;
  state: string;
  zip: string;
  property_name: string;
  property_owner_id: string | null;
  latitude?: number | null;
  longitude?: number | null;
  other_city?: string;
  state_id?: string;
}

export interface PropertyOwnerOption {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

export interface PropertyTypeOption {
  id?: string;
  category?: string;
  name?: string;
}

interface AddressFormProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
  onSubmit: (e: React.FormEvent, nextStep?: string) => void | Promise<any>;
  loading: boolean;
  states?: StateOption[];
  cities?: CityOption[];
  propertyOwners?: PropertyOwnerOption[];
  propertyTypes?: PropertyTypeOption[];
  alreadySaved?: boolean;
  isEdit?: boolean;
  onBack?: () => void;
  hasSavedImages?: boolean;
  errorFields?: string[];
  onErrorFieldsChange?: (fields: string[]) => void;
  apiErrorMessage?: string | null;
}

const triggerClass =
  "w-full h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] data-placeholder:text-[#708090]/50 focus:ring-[#1CA7A6]/20 font-asap gap-2 justify-start text-left [&>span]:flex-1 [&>span]:truncate [&>span]:text-left";

export function AddressForm({
  data,
  onChange,
  onSubmit,
  loading,
  states = [],
  cities = [],
  propertyOwners = [],
  propertyTypes = [],
  alreadySaved = false,
  isEdit = false,
  onBack,
  hasSavedImages = false,
  errorFields = [],
  onErrorFieldsChange,
  apiErrorMessage,
}: AddressFormProps) {
  const user = useUser();
  const [internalErrorFields, setInternalErrorFields] = useState<string[]>(
    errorFields || [],
  );

  useEffect(() => {
    if (errorFields !== undefined) {
      setInternalErrorFields(errorFields);
    }
  }, [errorFields]);

  const updateErrorFields = (newFields: string[]) => {
    setInternalErrorFields(newFields);
    onErrorFieldsChange?.(newFields);
  };

  const hasFieldError = (fieldName: string): boolean => {
    if (!internalErrorFields || internalErrorFields.length === 0) return false;
    const lowerName = fieldName.toLowerCase();
    return internalErrorFields.some((f) => {
      const lowerF = f.toLowerCase();
      if (lowerName === "address") {
        return lowerF === "address";
      }
      if (lowerName === "address2") {
        return lowerF === "address2";
      }
      if (lowerName === "city") {
        return (
          lowerF === "city" || lowerF === "city_id" || lowerF === "other_city"
        );
      }
      if (lowerName === "state") {
        return lowerF === "state" || lowerF === "state_id";
      }
      if (lowerName === "zip") {
        return (
          lowerF === "zip" ||
          lowerF === "zip_code" ||
          lowerF === "zipcode" ||
          lowerF === "postal_code"
        );
      }
      if (lowerName === "property_name") {
        return lowerF === "property_name" || lowerF === "propertyname";
      }
      if (lowerName === "property_type") {
        return (
          lowerF === "property_type" ||
          lowerF === "property_type_id" ||
          lowerF === "property_type_category" ||
          lowerF === "other_property_type"
        );
      }
      if (lowerName === "property_owner") {
        return (
          lowerF === "property_owner" ||
          lowerF === "property_owner_id" ||
          lowerF === "propertyowner"
        );
      }
      return lowerF === lowerName;
    });
  };

  const clearFieldError = (fieldName: string) => {
    if (!internalErrorFields || internalErrorFields.length === 0) return;
    const lowerName = fieldName.toLowerCase();
    const updated = internalErrorFields.filter((f) => {
      const lowerF = f.toLowerCase();
      if (lowerName === "address") {
        return (
          lowerF !== "address" && lowerF !== "address1" && lowerF !== "street"
        );
      }
      if (lowerName === "address2") {
        return lowerF !== "address2";
      }
      if (lowerName === "city") {
        return (
          lowerF !== "city" && lowerF !== "city_id" && lowerF !== "other_city"
        );
      }
      if (lowerName === "state") {
        return lowerF !== "state" && lowerF !== "state_id";
      }
      if (lowerName === "zip") {
        return (
          lowerF !== "zip" &&
          lowerF !== "zip_code" &&
          lowerF !== "zipcode" &&
          lowerF !== "postal_code"
        );
      }
      if (lowerName === "property_name") {
        return lowerF !== "property_name" && lowerF !== "propertyname";
      }
      if (lowerName === "property_type") {
        return (
          lowerF !== "property_type" &&
          lowerF !== "property_type_id" &&
          lowerF !== "property_type_category" &&
          lowerF !== "other_property_type"
        );
      }
      if (lowerName === "property_owner") {
        return (
          lowerF !== "property_owner" &&
          lowerF !== "property_owner_id" &&
          lowerF !== "propertyowner"
        );
      }
      return lowerF !== lowerName;
    });
    if (updated.length !== internalErrorFields.length) {
      updateErrorFields(updated);
    }
  };
  const [citySearch, setCitySearch] = useState("");
  const [fetchedCities, setFetchedCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);

  const [usageLimitInfo, setUsageLimitInfo] = useState<{
    isLimitReached: boolean;
    errorMessage: string | null;
    loading: boolean;
  }>({
    isLimitReached: false,
    errorMessage: null,
    loading: false,
  });

  useEffect(() => {
    const currentRole = user.role?.toLowerCase();
    const isContractorOrManufacturer =
      currentRole === "contractor" || currentRole === "manufacturer";

    if (!isContractorOrManufacturer || alreadySaved) return;

    let active = true;
    const fetchLimits = async () => {
      setUsageLimitInfo((prev) => ({ ...prev, loading: true }));
      try {
        const [profile, usage] = await Promise.all([
          getUserProfile(),
          getReportUsage(),
        ]);

        if (!active) return;

        const profilePayload = profile?.data ?? profile;
        const usagePayload = usage?.data ?? usage;

        const level = (profilePayload as any)?.level;
        const subscriptionLevel =
          (profilePayload as any)?.current_subscription?.status === "ACTIVE"
            ? (profilePayload as any)?.current_subscription?.plan?.level
            : undefined;
        const effectivelevel = (level || subscriptionLevel || "").toUpperCase();

        const propertiesUsed = usagePayload?.propertiesUsed ?? 0;
        const propertiesProvided = usagePayload?.propertiesProvided ?? 0;
        const propertiesUnlimited =
          usagePayload?.propertiesUnlimited === true ||
          usagePayload?.propertiesUnlimited === "true";

        const remainingLimit = propertiesUnlimited
          ? 999999
          : propertiesProvided - propertiesUsed;
        const isLimitReached = !propertiesUnlimited && remainingLimit <= 0;

        let errorMessage = null;
        if (isLimitReached) {
          errorMessage =
            "You have reached your monthly limit of new property submissions for your current membership plan. Your limit will reset on the first day of next month, or you may upgrade your membership to continue submitting properties.";
        }

        setUsageLimitInfo({
          isLimitReached,
          errorMessage,
          loading: false,
        });
      } catch (err) {
        console.error("Failed to fetch limit info:", err);
        if (active) {
          setUsageLimitInfo((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchLimits();

    return () => {
      active = false;
    };
  }, [user.role, alreadySaved]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!data.state && !citySearch) {
        setFetchedCities([]);
        return;
      }
      setLoadingCities(true);
      try {
        const citiesData = await getCities(
          undefined,
          undefined,
          undefined,
          citySearch || undefined,
          data.state || undefined,
        );
        const rawCities = Array.isArray(citiesData)
          ? citiesData
          : citiesData?.data || [];
        const formatted = rawCities.map((c: any) => ({
          id: String(c.id),
          name: c.city_name || c.name,
          state_id: c.state_id ? String(c.state_id) : undefined,
          latitude: c.latitude ? String(c.latitude) : undefined,
          longitude: c.longitude ? String(c.longitude) : undefined,
        }));
        if (active) {
          setFetchedCities(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoadingCities(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [citySearch, data.state]);

  const cityOptions = useMemo(() => {
    if (!citySearch && fetchedCities.length === 0) {
      return cities.filter((c) => !data.state || c.state_id === data.state);
    }
    return fetchedCities;
  }, [cities, fetchedCities, citySearch, data.state]);

  const selectedCity = useMemo(() => {
    if (!data.city_id) return null;
    return (
      cityOptions.find((c) => c.id === data.city_id) ||
      cities.find((c) => c.id === data.city_id) ||
      null
    );
  }, [data.city_id, cityOptions, cities]);

  const propertyTypeOptions = useMemo(() => {
    if (!propertyTypes || propertyTypes.length === 0) return [];
    return propertyTypes.map((pt: any, index: number) => {
      const id = pt.id || pt.category || pt.name || `pt-${index}`;
      const rawLabel = pt.category || pt.name || pt.id || "";
      const name =
        rawLabel === "OTHER"
          ? "Other"
          : rawLabel
              .replace(/_/g, " ")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c: any) => c.toUpperCase());
      return { id, name };
    });
  }, [propertyTypes]);

  const isOtherSelected =
    data.property_type_category === "OTHER" ||
    data.property_type_id === "OTHER" ||
    data.property_type === "OTHER" ||
    !!data.other_property_type;

  const handleFormSubmit = async (e: React.FormEvent, nextStep?: string) => {
    e.preventDefault();

    if (isOtherSelected) {
      if (!data.other_property_type?.trim()) {
        toast.error("Specify other property type");
        return;
      }
    } else if (!data.property_type_id && !data.property_type) {
      toast.error("Property type is required");
      return;
    }

    if (!data.address.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!data.state) {
      toast.error("State is required");
      return;
    }
    if (!data.city_id && !data.other_city) {
      toast.error("City is required");
      return;
    }

    const res = (await onSubmit(e, nextStep)) as any;
    if (res) {
      const fields = res.errorFields || res?.data?.errorFields;
      if (Array.isArray(fields) && fields.length > 0) {
        updateErrorFields(fields);
      }
    }
  };

  return (
    <div className="w-full max-w-[1170px] mx-auto space-y-[20px] md:space-y-[26px] animate-in fade-in zoom-in-95 duration-500 font-asap">
      <div className="text-center pb-[10px] md:pb-[20px]">
        <h2 className="text-[22px] md:text-[36px] font-bold text-[#1F2A44] uppercase leading-tight md:leading-[41px]">
          Enter a New Property
        </h2>
      </div>

      {/* Validation Error Banner */}
      {internalErrorFields.length > 0 && (
        <div className="flex items-start gap-3 p-4 md:p-5 rounded-[6px] md:rounded-[10px] border border-red-200 bg-red-50/90 text-red-800 text-[14px] md:text-[16px] font-medium leading-relaxed font-asap shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <svg
            className="size-5 md:size-6 text-red-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            {apiErrorMessage ||
              `The provided ${internalErrorFields.join(", ")} are invalid. Please check the highlighted fields.`}
          </div>
        </div>
      )}

      <div className="space-y-[15px] md:space-y-[28px]">
        {/* Property Type */}
        <div className="space-y-1">
          <SearchableSelect
            options={propertyTypeOptions}
            value={
              isOtherSelected
                ? "OTHER"
                : (data.property_type_id ?? data.property_type ?? "")
            }
            placeholder="Property Type"
            searchPlaceholder="Search property type..."
            emptyMessage={
              propertyTypes.length === 0
                ? "Loading..."
                : "No property type found"
            }
            isError={hasFieldError("property_type")}
            onValueChange={(val) => {
              clearFieldError("property_type");
              if (val === "OTHER") {
                onChange({
                  ...data,
                  property_type_id: "OTHER",
                  property_type_category: "OTHER",
                  property_type: "OTHER",
                  other_property_type: data.other_property_type || "",
                });
              } else {
                const selected = propertyTypes.find(
                  (pt: any) =>
                    pt.id === val ||
                    pt.category === val ||
                    pt.name === val ||
                    (pt.id || pt.category || pt.name) === val,
                );
                const categoryName =
                  selected?.category || selected?.name || val;
                onChange({
                  ...data,
                  property_type_id: selected?.id || val,
                  property_type_category: categoryName,
                  property_type: selected?.id || val,
                  other_property_type: "",
                });
              }
            }}
            keyboardSelectHighlighted
          />
          {hasFieldError("property_type") && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              Please select a valid property type
            </p>
          )}
        </div>

        {/* Other Property Type Input (Shown when Other is selected) */}
        {isOtherSelected && (
          <div className="space-y-1">
            <Input
              placeholder="Specify Other Property Type"
              required
              className={cn(
                "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
                hasFieldError("property_type")
                  ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                  : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
              )}
              value={data.other_property_type || ""}
              aria-invalid={hasFieldError("property_type") ? "true" : undefined}
              onChange={(e) => {
                clearFieldError("property_type");
                onChange({ ...data, other_property_type: e.target.value });
              }}
            />
          </div>
        )}

        {/* Property Name */}
        <div className="space-y-1 hidden">
          <Input
            placeholder="Property Name"
            required
            className={cn(
              "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("property_name")
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
            )}
            value={data.property_name}
            aria-invalid={hasFieldError("property_name") ? "true" : undefined}
            onChange={(e) => {
              clearFieldError("property_name");
              onChange({ ...data, property_name: e.target.value });
            }}
          />
          {hasFieldError("property_name") && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              Please enter a valid property name
            </p>
          )}
        </div>

        {/* Address 1 */}
        <div className="space-y-1">
          <Input
            placeholder="Address 1"
            required
            className={cn(
              "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("address")
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
            )}
            value={data.address}
            aria-invalid={hasFieldError("address") ? "true" : undefined}
            onChange={(e) => {
              clearFieldError("address");
              onChange({ ...data, address: e.target.value });
            }}
          />
          {hasFieldError("address") && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              Please provide a valid address
            </p>
          )}
        </div>

        {/* Address 2 */}
        <div className="space-y-1">
          <Input
            placeholder="Address 2"
            className={cn(
              "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("address2")
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
            )}
            value={data.address2 || ""}
            aria-invalid={hasFieldError("address2") ? "true" : undefined}
            onChange={(e) => {
              clearFieldError("address2");
              onChange({ ...data, address2: e.target.value });
            }}
          />
          {hasFieldError("address2") && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              Please provide a valid address line 2
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-[10px] md:gap-[19.8px]">
          {/* State */}
          <div className="space-y-1">
            <SearchableSelect
              options={states.map((s) => ({ id: s.id, name: s.name }))}
              value={data.state || data.state_id || ""}
              placeholder="State"
              searchPlaceholder="Search state..."
              isError={hasFieldError("state")}
              onValueChange={(val) => {
                clearFieldError("state");
                setCitySearch("");
                setFetchedCities([]);
                onChange({
                  ...data,
                  state: val,
                  state_id: val,
                  city_id: "",
                  city: "",
                  other_city: "",
                });
              }}
            />
            {hasFieldError("state") && (
              <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
                Please select a valid state
              </p>
            )}
          </div>

          {/* City */}
          <div className="space-y-1">
            <SearchableSelect
              options={cityOptions.map((c) => ({ id: c.id, name: c.name }))}
              value={
                data.other_city
                  ? `__custom__:${data.other_city}`
                  : data.city_id || ""
              }
              displayValueFallback={data.city}
              isError={hasFieldError("city")}
              onValueChange={(val) => {
                clearFieldError("city");
                if (val.startsWith("__custom__:")) {
                  const customName = val.slice("__custom__:".length);
                  onChange({
                    ...data,
                    city_id: "",
                    other_city: customName,
                    city: customName,
                    state_id: data.state || "",
                  });
                } else {
                  const selectedCity =
                    cities.find((c) => c.id === val) ||
                    fetchedCities.find((c) => c.id === val);
                  onChange({
                    ...data,
                    city_id: val,
                    other_city: "",
                    city: selectedCity?.name || "",
                    state: selectedCity?.state_id || data.state || "",
                    state_id: selectedCity?.state_id || data.state || "",
                  });
                }
              }}
              placeholder="City"
              searchPlaceholder={
                !data.state && !data.state_id
                  ? "Select state first..."
                  : "Search city..."
              }
              emptyMessage={
                !data.state && !data.state_id
                  ? "Please select a state first"
                  : "No cities found"
              }
              loading={loadingCities}
              allowCustom
              searchValue={citySearch}
              onSearchValueChange={setCitySearch}
            />
            {hasFieldError("city") && (
              <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
                Please select a valid city
              </p>
            )}
          </div>
        </div>

        {/* Zip Code */}
        <div className="space-y-1">
          <Input
            placeholder="Zip Code"
            required
            inputMode="numeric"
            className={cn(
              "h-11.5 md:h-16.25 px-5 md:px-7.25 bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("zip")
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
            )}
            value={data.zip}
            aria-invalid={hasFieldError("zip") ? "true" : undefined}
            onChange={(e) => {
              clearFieldError("zip");
              const val = e.target.value;
              onChange({ ...data, zip: val });
            }}
          />
          {hasFieldError("zip") && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              Please enter a valid zip code
            </p>
          )}
        </div>

        {/* Property Owner */}
        <div className="w-full space-y-1">
          <SearchableSelect
            options={[
              { id: "__none__", name: "None" },
              ...propertyOwners.map((owner) => ({
                id: owner.id,
                name:
                  owner.email ||
                  `${owner.first_name || ""} ${owner.last_name || ""}`.trim() ||
                  owner.id,
              })),
            ]}
            value={data.property_owner_id || ""}
            isError={
              hasFieldError("property_owner_id") ||
              hasFieldError("property_owner")
            }
            onValueChange={(val) => {
              clearFieldError("property_owner_id");
              clearFieldError("property_owner");
              onChange({
                ...data,
                property_owner_id: !val || val === "__none__" ? null : val,
              });
            }}
            placeholder="Property Owner"
            searchPlaceholder="Search property owner..."
            triggerClassName={triggerClass}
            keyboardSelectHighlighted
          />
          {(hasFieldError("property_owner_id") ||
            hasFieldError("property_owner")) && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              Please select a valid property owner
            </p>
          )}
        </div>
        <div
          className={cn(
            "space-y-3.75 md:space-y-5 p-5 border border-dashed border-[rgba(28,167,166,0.3)] rounded-[10px] bg-slate-50/50",
            !isEdit && "hidden",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-[12px] md:text-[14px] font-mono text-[#708090] bg-white px-4 py-2 rounded-[6px] border border-slate-200/60 shadow-sm flex items-center gap-2">
              <MapPin className="size-[16px] md:size-[18px] text-[#1CA7A6]" />
              Pin Coordinates:{" "}
              {data.latitude != null && data.longitude != null
                ? `${data.latitude}, ${data.longitude}`
                : "Not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-[15px] md:space-y-[17px] pt-[15px] md:pt-[23px]">
        {usageLimitInfo.errorMessage && !alreadySaved && (
          <div className="flex items-start gap-3 p-4 md:p-5 rounded-[6px] md:rounded-[10px] border border-red-100 bg-red-50/80 text-red-800 text-[14px] md:text-[16px] font-medium leading-relaxed font-asap shadow-sm">
            <svg
              className="size-5 md:size-6 text-red-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>{usageLimitInfo.errorMessage}</div>
          </div>
        )}

        <Button
          type="button"
          disabled={
            loading ||
            usageLimitInfo.loading ||
            (!!usageLimitInfo.errorMessage && !alreadySaved)
          }
          onClick={(e) => handleFormSubmit(e, "SAVE")}
          className="w-full h-[52px] md:h-[77px] border border-[#1CA7A6] bg-white text-[#1CA7A6] hover:bg-[#1CA7A6]/5 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-[10px] text-[20px] md:text-[30px] font-asap shadow-none"
        >
          {loading ? "Saving..." : alreadySaved ? "Saved ✓" : "Save"}
        </Button>

        <Button
          type="button"
          disabled={
            loading ||
            usageLimitInfo.loading ||
            (!!usageLimitInfo.errorMessage && !alreadySaved)
          }
          onClick={(e) => handleFormSubmit(e, "IMAGES")}
          className="w-full h-[52px] md:h-[77px] border border-[#1F2A44] bg-white text-[#1F2A44] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-[6px] text-[20px] md:text-[30px] flex items-center justify-center gap-4 font-asap shadow-none"
        >
          {hasSavedImages && !isEdit ? (
            <>
              <Eye className="size-[20px] md:size-[28px] text-[#1F2A44]" />
              View Images
            </>
          ) : (
            <>
              <div className="size-[20px] md:size-[28px] rounded-full border border-[#1F2A44] flex items-center justify-center">
                <span className="text-[14px] md:text-[20px] mt-[-2px]">+</span>
              </div>
              Upload Images
            </>
          )}
        </Button>
      </div>

      <div className="hidden md:flex justify-center pt-8 md:pt-[100px]">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-[21px] text-[14px] md:text-[18px] font-bold text-[#1CA7A6] uppercase tracking-normal hover:opacity-80 transition-opacity font-asap"
        >
          <div className="size-[26px] md:size-[32px] rounded-full bg-[rgba(28,167,166,0.25)] flex items-center justify-center">
            <ChevronLeft className="size-4 md:size-5" />
          </div>
          Back
        </button>
      </div>

      <MapDialog
        isOpen={isMapPopupOpen}
        onClose={() => setIsMapPopupOpen(false)}
        latitude={data.latitude}
        longitude={data.longitude}
        cityId={data.city_id}
        stateId={data.state || data.state_id}
        cityLat={selectedCity?.latitude ? Number(selectedCity.latitude) : null}
        cityLng={
          selectedCity?.longitude ? Number(selectedCity.longitude) : null
        }
        addressString={
          data.address
            ? `${data.address}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`
            : undefined
        }
        onSave={(lat, lng) =>
          onChange({ ...data, latitude: lat, longitude: lng })
        }
      />
    </div>
  );
}
