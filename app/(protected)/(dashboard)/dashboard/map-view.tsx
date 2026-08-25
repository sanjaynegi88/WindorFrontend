"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  getPropertyLocations,
  getPropertyListAll,
  getCities,
  getReportUsage,
} from "@/lib/actions";
import GoogleMap from "@/components/common/google-map";
import { getWorkingAwsImageUrl } from "@/lib/utils";
import { useUser } from "@/components/providers/user-provider";
import { PropertyMapSidebar } from "@/components/common/property-map-sidebar";

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  front_image?: string | null;
  street_view_link?: string | null;
  reportStatus?: "view" | "purchase" | "none";
}

interface MapViewProps {
  searchParams?: {
    search?: string;
    brandName?: string;
    style?: string;
    color?: string;
    state?: string;
    city?: string;
    state_id?: string;
    city_id?: string;
  };
  focusCenter?: { lat: number; lng: number };
  focusId?: string;
  onFocusCleared?: () => void;
}

export default function MapView({
  searchParams,
  focusCenter,
  focusId,
  onFocusCleared,
}: MapViewProps) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  const [searchFocusCenter, setSearchFocusCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { user, role } = useUser();
  const [centerCityName, setCenterCityName] = useState<string | undefined>(
    undefined,
  );
  const [reportUsage, setReportUsage] = useState<any>(null);

  // Sidebar State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeRequestRef = useRef<number>(0);

  // Fetch report usage
  useEffect(() => {
    if (
      role === "insurance_company" ||
      role === "realtor" ||
      role === "manufacturer" ||
      role === "contractor" ||
      role === "property_owner"
    ) {
      getReportUsage()
        .then((res) => setReportUsage(res.data))
        .catch(() => {});
    }
  }, [role]);

  const searchParamsString = JSON.stringify(searchParams);

  const [isResolvingCenter, setIsResolvingCenter] = useState<boolean>(false);

  // Resolve search map center coordinates from dashboard listing search API
  useEffect(() => {
    const resolveSearchCenter = async () => {
      const activeStateId =
        searchParams?.state_id && searchParams.state_id !== "all"
          ? searchParams.state_id
          : searchParams?.state && searchParams.state !== "all"
            ? searchParams.state
            : undefined;
      const activeCityId =
        searchParams?.city_id && searchParams.city_id !== "all"
          ? searchParams.city_id
          : searchParams?.city && searchParams.city !== "all"
            ? searchParams.city
            : undefined;

      const hasSearchFilters = Boolean(
        searchParams?.search?.trim() ||
          searchParams?.brandName?.trim() ||
          searchParams?.color?.trim() ||
          searchParams?.style?.trim() ||
          activeStateId ||
          activeCityId,
      );

      if (!hasSearchFilters) {
        setSearchFocusCenter(null);
        setIsResolvingCenter(false);
        return;
      }

      setIsResolvingCenter(true);
      try {
        const cleanFilterParams: any = {
          ...searchParams,
          page: 1,
          limit: 1,
        };
        const searchResult = await getPropertyListAll(cleanFilterParams);
        const dataList = searchResult?.data || searchResult || [];
        const firstMatch = Array.isArray(dataList) ? dataList[0] : null;

        let targetLat: number | null = null;
        let targetLng: number | null = null;

        if (firstMatch && firstMatch.latitude && firstMatch.longitude) {
          targetLat = Number(firstMatch.latitude);
          targetLng = Number(firstMatch.longitude);
        } else if (activeStateId || activeCityId) {
          // Fallback: If no search result found, call with only selected state/city params (limit 1)
          const fallbackParams: any = {
            page: 1,
            limit: 1,
            ...(activeStateId ? { state_id: activeStateId } : {}),
            ...(activeCityId ? { city_id: activeCityId } : {}),
          };
          const fallbackResult = await getPropertyListAll(fallbackParams);
          const fallbackData = fallbackResult?.data || fallbackResult || [];
          const firstFallback = Array.isArray(fallbackData) ? fallbackData[0] : null;

          if (
            firstFallback &&
            firstFallback.latitude &&
            firstFallback.longitude
          ) {
            targetLat = Number(firstFallback.latitude);
            targetLng = Number(firstFallback.longitude);
          }
        }

        if (targetLat !== null && targetLng !== null) {
          const newCenter = { lat: targetLat, lng: targetLng };
          setSearchFocusCenter(newCenter);

          // Fetch data for bounds around the resolved search center immediately
          const focusBounds = {
            minLat: targetLat - 0.05,
            maxLat: targetLat + 0.05,
            minLng: targetLng - 0.05,
            maxLng: targetLng + 0.05,
          };
          await fetchDataForBounds(focusBounds);
        } else {
          setSearchFocusCenter(null);
        }
      } catch (err) {
        console.error("Failed to resolve search center:", err);
        setSearchFocusCenter(null);
      } finally {
        setIsResolvingCenter(false);
      }
    };

    resolveSearchCenter();
  }, [searchParamsString]);

  const getMarkerReportStatus = (p: any): "view" | "purchase" | "none" => {
    const hasReport = p.has_report || (p.projects && p.projects.length > 0);
    if (!hasReport) return "none";

    const ownerEmail = p.property_owner?.email || p.owner_email || "";
    const isOwnerOfProperty =
      role === "property_owner" &&
      !!ownerEmail &&
      user?.email?.toLowerCase() === ownerEmail.toLowerCase();
    const isPurchased = p.is_purchased === true;
    const hasLimitAccess = Boolean(reportUsage && reportUsage.remaining > 0);

    const canDownload =
      (role === "property_owner" && (isOwnerOfProperty || isPurchased || hasLimitAccess)) ||
      role === "admin" ||
      role === "city_inspector" ||
      (role === "contractor" && (isPurchased || hasLimitAccess)) ||
      (role === "manufacturer" && (isPurchased || hasLimitAccess)) ||
      (role === "realtor" && (isPurchased || hasLimitAccess)) ||
      (role === "insurance_company" && (isPurchased || hasLimitAccess));

    return canDownload ? "view" : "purchase";
  };

  const currentBoundsRef = useRef<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);

  const fetchDataForBounds = async (
    bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    zoomLevel?: number,
  ) => {
    const requestId = ++activeRequestRef.current;
    setLoading(true);
    try {
      const { city, ...restParams } = searchParams || {};
      const activeCityId =
        searchParams?.city_id || (city && city !== "all" ? city : undefined);
      const activeStateId =
        searchParams?.state_id && searchParams.state_id !== "all"
          ? searchParams.state_id
          : undefined;

      // Note: getPropertyLocations is only passed viewport bounds and location IDs (no text search query)
      const result = await getPropertyLocations(
        bounds?.minLat,
        bounds?.maxLat,
        bounds?.minLng,
        bounds?.maxLng,
        zoomLevel,
        {
          ...(activeCityId ? { city_id: activeCityId } : {}),
          ...(activeStateId ? { state_id: activeStateId } : {}),
        },
      );

      if (requestId !== activeRequestRef.current) return;

      let dataList: any[] = [];
      if (result) {
        if (Array.isArray(result)) {
          dataList = result;
        } else if (result.data && Array.isArray(result.data)) {
          dataList = result.data;
        } else if (result.properties && Array.isArray(result.properties)) {
          dataList = result.properties;
        }
      }

      const mappedMarkers: MarkerData[] = await Promise.all(
        dataList
          .filter((p: any) => p.latitude && p.longitude)
          .map(async (p: any) => {
            const frontImage = p.front_image
              ? await getWorkingAwsImageUrl(p.front_image)
              : null;
            return {
              id: p.id,
              lat: Number(p.latitude),
              lng: Number(p.longitude),
              title: p.address || "Property",
              description:
                `${p.city_name || p.city?.name || ""} ${p.state_name || p.state || ""}`.trim(),
              front_image: frontImage,
              street_view_link: p.street_view_link,
              reportStatus: getMarkerReportStatus(p),
            };
          }),
      );

      if (requestId !== activeRequestRef.current) return;
      setMarkers(mappedMarkers);
    } catch (error) {
      console.error("Failed to fetch properties for bounds:", error);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const focusCenterKey = focusCenter
    ? `${focusCenter.lat},${focusCenter.lng}`
    : "";

  useEffect(() => {
    if (focusCenter) {
      const delta = 0.05;
      const focusBounds = {
        minLat: focusCenter.lat - delta,
        maxLat: focusCenter.lat + delta,
        minLng: focusCenter.lng - delta,
        maxLng: focusCenter.lng + delta,
      };
      fetchDataForBounds(focusBounds);
      return;
    }

    fetchDataForBounds(currentBoundsRef.current || undefined);
  }, [searchParamsString, reportUsage, focusCenterKey]);

  useEffect(() => {
    const resolveCenterLocation = async () => {
      if (role === "city_inspector" && user?.user?.city_id) {
        try {
          const res = await getCities(undefined, undefined, user.user.city_id);
          const cityData = res?.data?.[0] ?? res?.data ?? res;
          const resolvedName = Array.isArray(cityData)
            ? cityData[0]?.name
            : cityData?.name;
          if (resolvedName) {
            setCenterCityName(resolvedName);
            return;
          }
        } catch (err) {
          console.error(
            "[MapView] Failed to resolve inspector city name:",
            err,
          );
        }
      }

      setCenterCityName(undefined);
    };

    resolveCenterLocation();
  }, [role, user]);

  const handleViewportChange = async (
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    zoomLevel?: number,
  ) => {
    currentBoundsRef.current = bounds;
    setShouldFitBounds(false);
    await fetchDataForBounds(bounds, zoomLevel);
  };

  return (
    <Card className="border-border/60 shadow-xl overflow-hidden bg-muted/5 min-h-[600px] flex flex-col pt-0 relative">
      <GoogleMap
        markers={markers}
        loading={loading || isResolvingCenter}
        onViewportChange={handleViewportChange}
        shouldFitBounds={shouldFitBounds}
        defaultCenter={focusCenter || searchFocusCenter || undefined}
        defaultZoom={
          focusCenter ? 17.5 : searchFocusCenter ? 14 : undefined
        }
        defaultCityName={centerCityName}
        focusedMarkerId={focusId}
        onFocusCleared={onFocusCleared}
        onMarkerClick={(id) => {
          setSelectedPropertyId(id);
          setIsSidebarOpen(true);
        }}
      />

      <PropertyMapSidebar
        propertyId={selectedPropertyId}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedPropertyId(null);
          if (onFocusCleared) {
            onFocusCleared();
          }
        }}
      />
    </Card>
  );
}
