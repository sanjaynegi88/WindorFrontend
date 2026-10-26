"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Eye,
  MapPin,
  Search,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateOption, CityOption } from "@/lib/location-utils";
import { toast } from "sonner";
import { useUser } from "../providers/user-provider";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  getCities,
  getStates,
  getUserProfile,
  getReportUsage,
  validateAddress,
  searchGooglePlaces,
  getGooglePlaceDetails,
  type GooglePlacePrediction,
  type GooglePlaceDetails,
} from "@/lib/actions";
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
  state_name?: string;
  city_name?: string;
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

export const getStateDisplayName = (
  stateVal?: string,
  stateIdVal?: string,
  stateNameVal?: string,
  statesList: StateOption[] = [],
): string => {
  if (stateNameVal) return stateNameVal;
  const target = stateIdVal || stateVal || "";
  if (!target) return "";
  const matchedState = statesList.find(
    (s) =>
      s.id === target ||
      (s.abbreviation &&
        s.abbreviation.toLowerCase() === target.toLowerCase()) ||
      (s.name && s.name.toLowerCase() === target.toLowerCase()),
  );
  if (matchedState) {
    return matchedState.abbreviation || matchedState.name;
  }
  if (target.includes("-") && target.length > 20) {
    return "";
  }
  return target;
};

export const getCityDisplayName = (
  cityVal?: string,
  cityIdVal?: string,
  cityNameVal?: string,
  otherCityVal?: string,
  citiesList: CityOption[] = [],
): string => {
  if (cityNameVal) return cityNameVal;
  if (otherCityVal) return otherCityVal;
  if (cityVal && (!cityVal.includes("-") || cityVal.length < 20)) {
    return cityVal;
  }
  const target = cityIdVal || cityVal || "";
  if (!target) return "";
  const matchedCity = citiesList.find((c) => c.id === target);
  if (matchedCity) {
    return matchedCity.name;
  }
  if (target.includes("-") && target.length > 20) {
    return "";
  }
  return target;
};

export const formatFullAddress = (
  addressObj: AddressData,
  statesList: StateOption[] = [],
  citiesList: CityOption[] = [],
): string => {
  if (!addressObj?.address) return "";
  const stateStr = getStateDisplayName(
    addressObj.state,
    addressObj.state_id,
    addressObj.state_name,
    statesList,
  );
  const cityStr = getCityDisplayName(
    addressObj.city,
    addressObj.city_id,
    addressObj.city_name,
    addressObj.other_city,
    citiesList,
  );
  const parts = [
    addressObj.address,
    addressObj.address2,
    cityStr,
    stateStr,
    addressObj.zip,
  ].filter(Boolean);
  return parts.join(", ");
};

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

  // Google Places Search State and Refs
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState<string>(() => {
    return formatFullAddress(data, states, cities);
  });
  const [autocompleteError, setAutocompleteError] = useState<string | null>(
    null,
  );
  const [isAddress2Supported, setIsAddress2Supported] = useState<
    boolean | null
  >(null);
  const [address2Message, setAddress2Message] = useState<string | null>(null);
  const isAddressLocked = Boolean(data.address);

  // Predictions and Loading states
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Stable refs for listener callback
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  const citiesRef = useRef(cities);
  useEffect(() => {
    citiesRef.current = cities;
  }, [cities]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync search input if address is loaded or changes externally, or if state/city names become available
  useEffect(() => {
    if (data.address) {
      const isSearchContainingUuid = /[0-9a-f]{8}-[0-9a-f]{4}/i.test(
        searchValue,
      );
      if (!searchValue || isSearchContainingUuid) {
        const full = formatFullAddress(data, states, [
          ...cities,
          ...fetchedCities,
        ]);
        if (full) {
          setSearchValue(full);
        }
      }
    }
  }, [
    data.address,
    data.address2,
    data.city,
    data.city_id,
    data.city_name,
    data.other_city,
    data.state,
    data.state_id,
    data.state_name,
    data.zip,
    states,
    cities,
    fetchedCities,
    searchValue,
  ]);

  // Debounced search for places predictions
  useEffect(() => {
    const trimmed = searchValue.trim();
    if (!trimmed || trimmed.length < 3) {
      setPredictions([]);
      setIsDropdownOpen(false);
      return;
    }

    // If input matches already selected full address, don't trigger search
    const currentFull = formatFullAddress(data, states, [
      ...cities,
      ...fetchedCities,
    ]);
    if (
      data.address &&
      currentFull &&
      trimmed.toLowerCase() === currentFull.toLowerCase()
    ) {
      return;
    }

    let active = true;
    setIsSearchingPlaces(true);

    const timer = setTimeout(async () => {
      console.log("api runned");
      try {
        const res = await searchGooglePlaces(trimmed);
        if (!active) return;
        if (res.success && res.data?.predictions) {
          setPredictions(res.data.predictions);
          setIsDropdownOpen(res.data.predictions.length > 0);
          setHighlightedIndex(-1);
        } else {
          setPredictions([]);
          setIsDropdownOpen(false);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to search places:", err);
          setPredictions([]);
          setIsDropdownOpen(false);
        }
      } finally {
        if (active) {
          setIsSearchingPlaces(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchValue, data.address, states, cities, fetchedCities]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node) &&
        autocompleteInputRef.current &&
        !autocompleteInputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClearSearch = () => {
    setSearchValue("");
    setPredictions([]);
    setIsDropdownOpen(false);
    setAutocompleteError(null);
    setIsAddress2Supported(null);
    setAddress2Message(null);
    clearFieldError("address");
    clearFieldError("address2");
    clearFieldError("city");
    clearFieldError("state");
    clearFieldError("zip");
    onChange({
      ...dataRef.current,
      address: "",
      address2: "",
      state: "",
      state_id: "",
      city_id: "",
      city: "",
      other_city: "",
      zip: "",
      latitude: null,
      longitude: null,
    });
    if (autocompleteInputRef.current) {
      autocompleteInputRef.current.value = "";
      autocompleteInputRef.current.focus();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setAutocompleteError(null);
    if (!val.trim()) {
      handleClearSearch();
    }
  };

  const handleSelectPrediction = async (prediction: GooglePlacePrediction) => {
    try {
      setIsLoadingPlaceDetails(true);
      setAutocompleteError(null);
      setIsDropdownOpen(false);

      const res = await getGooglePlaceDetails(prediction.place_id);
      if (!res.success || !res.data) {
        const msg =
          res.message || "Failed to load details for the selected address.";
        setAutocompleteError(msg);
        toast.error(msg);
        setIsLoadingPlaceDetails(false);
        return;
      }

      const details = res.data;

      // Validate Country (Only US supported)
      if (
        details.country &&
        details.country.toUpperCase() !== "US" &&
        details.country.toLowerCase() !== "united states"
      ) {
        const msg =
          "Only United States properties are supported. Please select a US address.";
        setAutocompleteError(msg);
        toast.error(msg);
        setIsLoadingPlaceDetails(false);
        return;
      }

      const streetAddress = (details.address || "").trim();
      if (!streetAddress) {
        const msg =
          "Please select a specific address with a street number and name.";
        setAutocompleteError(msg);
        toast.error(msg);
        setIsLoadingPlaceDetails(false);
        return;
      }

      const stateShort = (details.state || "").trim();
      const stateLong = (details.state_name || "").trim();
      const googleCityName = (details.city || "").trim();
      const postalCode = (details.zip || "").trim();

      if (!postalCode) {
        const msg =
          "The selected address is missing a ZIP code. Please select a valid property address.";
        setAutocompleteError(msg);
        toast.error(msg);
        setIsLoadingPlaceDetails(false);
        return;
      }

      if (!googleCityName) {
        const msg =
          "Could not determine the city for the selected address. Please select a valid property address.";
        setAutocompleteError(msg);
        toast.error(msg);
        setIsLoadingPlaceDetails(false);
        return;
      }

      // State resolution against existing application states
      let availableStates = statesRef.current;
      if (!availableStates || availableStates.length === 0) {
        try {
          const resStates = await getStates(1, 1000);
          const raw: any[] = Array.isArray(resStates)
            ? resStates
            : (resStates as any)?.data || [];
          availableStates = raw.map((s: any) => ({
            id: String(s.id),
            name: s.state_name || s.name,
            abbreviation: s.abbreviation,
          }));
        } catch (err) {
          console.error("Failed to load states for address search:", err);
        }
      }

      const matchedState = availableStates?.find(
        (s) =>
          Boolean(s) &&
          ((s.abbreviation &&
            stateShort &&
            s.abbreviation.trim().toUpperCase() ===
              stateShort.trim().toUpperCase()) ||
            (s.name &&
              stateLong &&
              s.name.trim().toLowerCase() === stateLong.trim().toLowerCase()) ||
            (s.id &&
              stateShort &&
              s.id.trim().toUpperCase() === stateShort.trim().toUpperCase())),
      );

      if (!matchedState) {
        const msg = `State (${stateShort || stateLong || "unknown"}) is not recognized in the system.`;
        setAutocompleteError(msg);
        toast.error(msg);
        setIsLoadingPlaceDetails(false);
        return;
      }

      const resolvedStateId = matchedState.id;

      // City resolution against existing application cities
      let resolvedCityId = "";
      let resolvedCityName = googleCityName;
      let resolvedOtherCity = "";

      const matchedCityFromProps = citiesRef.current?.find(
        (c) =>
          Boolean(c?.name) &&
          c.name.trim().toLowerCase() === googleCityName.trim().toLowerCase() &&
          (!c.state_id || c.state_id === resolvedStateId),
      );

      if (matchedCityFromProps) {
        resolvedCityId = matchedCityFromProps.id;
        resolvedCityName = matchedCityFromProps.name;
      } else {
        try {
          const apiRes = await getCities(
            1,
            20,
            undefined,
            googleCityName,
            resolvedStateId,
          );
          const rawList: any[] = Array.isArray(apiRes)
            ? apiRes
            : (apiRes as any)?.data || [];
          const matchedCityFromApi = rawList.find(
            (c: any) =>
              (c.city_name || c.name || "").trim().toLowerCase() ===
              googleCityName.trim().toLowerCase(),
          );

          if (matchedCityFromApi) {
            resolvedCityId = String(matchedCityFromApi.id);
            resolvedCityName =
              matchedCityFromApi.city_name || matchedCityFromApi.name;
          } else {
            // Not found in database -> use other_city fallback
            resolvedCityId = "";
            resolvedCityName = googleCityName;
            resolvedOtherCity = googleCityName;
          }
        } catch (err) {
          console.error("Failed to query city from API:", err);
          resolvedCityId = "";
          resolvedCityName = googleCityName;
          resolvedOtherCity = googleCityName;
        }
      }

      if (resolvedCityId && resolvedCityName) {
        setFetchedCities((prev) => {
          if (prev.some((c) => c.id === resolvedCityId)) return prev;
          return [
            ...prev,
            {
              id: resolvedCityId,
              name: resolvedCityName,
              state_id: resolvedStateId,
            },
          ];
        });
      }

      const finalAddress2 = (details.address2 || "").trim();
      const stateAbbr =
        matchedState.abbreviation || stateShort || matchedState.name;

      const finalLat =
        details.latitude != null ? Number(details.latitude) : null;
      const finalLng =
        details.longitude != null ? Number(details.longitude) : null;

      const fullFormatted =
        details.formatted_address ||
        [streetAddress, finalAddress2, resolvedCityName, stateAbbr, postalCode]
          .filter(Boolean)
          .join(", ");
      setSearchValue(fullFormatted);

      clearFieldError("address");
      clearFieldError("address2");
      clearFieldError("city");
      clearFieldError("state");
      clearFieldError("zip");

      onChangeRef.current({
        ...dataRef.current,
        address: streetAddress,
        address2: finalAddress2,
        state: resolvedStateId,
        state_id: resolvedStateId,
        state_name: matchedState.name,
        city_id: resolvedCityId,
        city: resolvedCityName,
        city_name: resolvedCityName,
        other_city: resolvedOtherCity,
        zip: postalCode,
        latitude: finalLat,
        longitude: finalLng,
      });
    } catch (err: any) {
      console.error("Error processing selected place:", err);
      const msg =
        err?.message || "Failed to process selected address. Please try again.";
      setAutocompleteError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };

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
          {isEdit ? "Edit Property" : "Enter a New Property"}
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

        {/* Google Places Address Autocomplete Search */}
        <div className="space-y-1 pb-10 relative">
          <label
            htmlFor="google-address-search"
            className="text-[13px] md:text-[15px] font-semibold text-[#1F2A44] flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-[#1CA7A6]" />
              Search Full Property Address From Google
            </span>
            {isAddressLocked && (
              <span className="text-[11px] md:text-[12px] font-medium text-[#1CA7A6] bg-[#1CA7A6]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                ✓ Google Address Selected (Read-Only)
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <Input
              id="google-address-search"
              ref={autocompleteInputRef}
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => {
                if (predictions.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!isDropdownOpen && predictions.length > 0) {
                    setIsDropdownOpen(true);
                  } else if (predictions.length > 0) {
                    setHighlightedIndex((prev) =>
                      prev < predictions.length - 1 ? prev + 1 : 0,
                    );
                  }
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (predictions.length > 0) {
                    setHighlightedIndex((prev) =>
                      prev > 0 ? prev - 1 : predictions.length - 1,
                    );
                  }
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (
                    isDropdownOpen &&
                    highlightedIndex >= 0 &&
                    predictions[highlightedIndex]
                  ) {
                    handleSelectPrediction(predictions[highlightedIndex]);
                  }
                } else if (e.key === "Escape") {
                  setIsDropdownOpen(false);
                }
              }}
              placeholder="Search property address with Google Places..."
              autoComplete="off"
              className={cn(
                "h-[46px] md:h-[65px] px-[20px] md:px-[29px] pr-[44px] md:pr-[56px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] focus-visible:border-[#1CA7A6] focus-visible:ring-[#1CA7A6]/20",
                autocompleteError &&
                  "!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900",
              )}
            />
            {isLoadingPlaceDetails || isSearchingPlaces ? (
              <div className="absolute right-[14px] md:right-[20px] p-1.5 flex items-center justify-center pointer-events-none">
                <Loader2 className="size-4 md:size-5 text-[#1CA7A6] animate-spin" />
              </div>
            ) : searchValue ? (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear address search"
                className="absolute right-[14px] md:right-[20px] p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="size-4 md:size-5" />
              </button>
            ) : (
              <Search className="absolute right-[18px] md:right-[24px] size-5 md:size-6 text-[#1CA7A6] pointer-events-none" />
            )}
          </div>

          {/* Autocomplete Predictions Dropdown */}
          {isDropdownOpen && predictions.length > 0 && (
            <div
              ref={dropdownContainerRef}
              className="absolute z-50 left-0 right-0 top-[calc(100%-32px)] bg-white rounded-[8px] md:rounded-[10px] border border-[rgba(28,167,166,0.3)] shadow-xl max-h-[300px] md:max-h-[380px] overflow-y-auto divide-y divide-slate-100"
            >
              {predictions.map((p, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <button
                    key={p.place_id || idx}
                    type="button"
                    onClick={() => handleSelectPrediction(p)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3.5 md:px-4 py-2.5 md:py-3 flex items-center gap-2.5 md:gap-3 transition-colors cursor-pointer font-asap",
                      isSelected
                        ? "bg-[#1CA7A6]/10 text-[#1CA7A6]"
                        : "hover:bg-slate-50 text-[#1F2A44]",
                    )}
                  >
                    <MapPin className="size-4 md:size-4.5 text-[#1CA7A6] shrink-0" />
                    <div className="flex-1 min-w-0 truncate text-[14px] md:text-[16px] leading-normal">
                      <span className="font-semibold text-[#1F2A44]">
                        {p.main_text || p.description}
                      </span>
                      {p.secondary_text && (
                        <span className="text-[#708090] font-normal text-[13px] md:text-[15px] ml-2">
                          {p.secondary_text}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <div className="px-3.5 md:px-4 py-2 bg-slate-50/80 flex items-center justify-end">
                <span className="text-[11px] md:text-[12px] text-slate-400 font-medium">
                  powered by{" "}
                  <span className="font-semibold tracking-tight">
                    <span className="text-[#4285F4]">G</span>
                    <span className="text-[#EA4335]">o</span>
                    <span className="text-[#FBBC05]">o</span>
                    <span className="text-[#4285F4]">g</span>
                    <span className="text-[#34A853]">l</span>
                    <span className="text-[#EA4335]">e</span>
                  </span>
                </span>
              </div>
            </div>
          )}

          {autocompleteError && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1 flex items-center gap-1.5">
              <AlertCircle className="size-3.5 md:size-4 shrink-0" />
              {autocompleteError}
            </p>
          )}
        </div>

        <label
          htmlFor="google-address-search"
          className="text-[13px] md:text-[15px] font-semibold text-[#1F2A44] flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-[#1CA7A6]" />
            Property Address
          </span>
        </label>

        {/* Address 1 */}
        <div className="space-y-1">
          <Input
            placeholder={
              isAddressLocked
                ? "Address 1"
                : "Address 1 (Search and select address above)"
            }
            required
            readOnly={isAddressLocked}
            tabIndex={isAddressLocked ? -1 : undefined}
            title={
              isAddressLocked
                ? "Address is populated from Google Places search. Use search above to change."
                : undefined
            }
            onClick={() => {
              if (!data.address) {
                autocompleteInputRef.current?.focus();
              }
            }}
            className={cn(
              "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("address")
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
              isAddressLocked &&
                "!bg-slate-50/80 !text-slate-700 !border-slate-200 !cursor-not-allowed select-none",
            )}
            value={data.address}
            aria-invalid={hasFieldError("address") ? "true" : undefined}
            onChange={(e) => {
              if (isAddressLocked) return;
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
            placeholder={
              isAddress2Supported === false
                ? "Address 2 not required for this property"
                : "Address 2 (e.g., Apt, Suite, Unit - optional)"
            }
            disabled={isAddress2Supported === false}
            title={
              isAddress2Supported === false
                ? "Address 2 is not supported for this property address."
                : undefined
            }
            className={cn(
              "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("address2") && isAddress2Supported !== false
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
              isAddress2Supported === false && "hidden",
            )}
            value={isAddress2Supported === false ? "" : data.address2 || ""}
            aria-invalid={
              hasFieldError("address2") && isAddress2Supported !== false
                ? "true"
                : undefined
            }
            onChange={(e) => {
              if (isAddress2Supported === false) return;
              clearFieldError("address2");
              setAddress2Message(null);
              onChange({ ...data, address2: e.target.value });
            }}
          />
          {hasFieldError("address2") && isAddress2Supported !== false && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              {address2Message || "Please provide a valid address line 2"}
            </p>
          )}
          {isAddress2Supported === false && (
            <p className="text-[12px] md:text-[13px] text-slate-400 font-normal font-asap mt-1 ml-1">
              Address 2 is not required for this property address.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-[10px] md:gap-[19.8px]">
          {/* State */}
          <div className="space-y-1">
            <SearchableSelect
              options={states.map((s) => ({ id: s.id, name: s.name }))}
              value={data.state || data.state_id || ""}
              displayValueFallback={data.state_name}
              placeholder="State"
              searchPlaceholder="Search state..."
              disabled={isAddressLocked}
              triggerClassName={cn(
                triggerClass,
                isAddressLocked &&
                  "!bg-slate-50/80 !text-slate-700 !border-slate-200 !cursor-not-allowed opacity-90",
              )}
              isError={hasFieldError("state")}
              onValueChange={(val) => {
                if (isAddressLocked) return;
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
              disabled={isAddressLocked}
              triggerClassName={cn(
                triggerClass,
                isAddressLocked &&
                  "!bg-slate-50/80 !text-slate-700 !border-slate-200 !cursor-not-allowed opacity-90",
              )}
              isError={hasFieldError("city")}
              onValueChange={(val) => {
                if (isAddressLocked) return;
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
            placeholder={
              isAddressLocked ? "Zip Code" : "Zip Code (Auto-populated)"
            }
            required
            inputMode="numeric"
            readOnly={isAddressLocked}
            tabIndex={isAddressLocked ? -1 : undefined}
            title={
              isAddressLocked
                ? "Zip Code is populated from Google Places search. Use search above to change."
                : undefined
            }
            onClick={() => {
              if (!data.address) {
                autocompleteInputRef.current?.focus();
              }
            }}
            className={cn(
              "h-11.5 md:h-16.25 px-5 md:px-7.25 bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("zip")
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
              isAddressLocked &&
                "!bg-slate-50/80 !text-slate-700 !border-slate-200 !cursor-not-allowed select-none",
            )}
            value={data.zip}
            aria-invalid={hasFieldError("zip") ? "true" : undefined}
            onChange={(e) => {
              if (isAddressLocked) return;
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
        <div className={cn("space-y-3.75 md:space-y-5 ", !isEdit && "hidden")}>
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
            ? formatFullAddress(data, states, [...cities, ...fetchedCities])
            : undefined
        }
        onSave={(lat, lng) =>
          onChange({ ...data, latitude: lat, longitude: lng })
        }
      />
    </div>
  );
}

{
  /* <Input
            placeholder={
              isAddress2Supported === false
                ? "Address 2 not required for this property"
                : "Address 2 (e.g., Apt, Suite, Unit - optional)"
            }
            disabled={isAddress2Supported === false}
            title={
              isAddress2Supported === false
                ? "Address 2 is not supported for this property address."
                : undefined
            }
            className={cn(
              "h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap transition-colors",
              hasFieldError("address2") && isAddress2Supported !== false
                ? "!border-red-500 md:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-red-500/20 bg-red-50/10 text-red-900 border"
                : "border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)]",
              isAddress2Supported === false &&
                "!bg-slate-100 !text-slate-400 !border-slate-200 !cursor-not-allowed select-none",
            )}
            value={isAddress2Supported === false ? "" : data.address2 || ""}
            aria-invalid={
              hasFieldError("address2") && isAddress2Supported !== false
                ? "true"
                : undefined
            }
            onChange={(e) => {
              if (isAddress2Supported === false) return;
              clearFieldError("address2");
              setAddress2Message(null);
              onChange({ ...data, address2: e.target.value });
            }}
          />
          {hasFieldError("address2") && isAddress2Supported !== false && (
            <p className="text-[12px] md:text-[14px] text-red-500 font-medium font-asap mt-1 ml-1">
              {address2Message || "Please provide a valid address line 2"}
            </p>
          )}
          {isAddress2Supported === false && (
            <p className="text-[12px] md:text-[13px] text-slate-400 font-normal font-asap mt-1 ml-1">
              Address 2 is not required for this property address.
            </p>
          )} */
}
