"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { getPropertyLocations, getCities, getReportUsage } from "@/lib/actions";
import GoogleMap, {
  MarkerData,
  ViewportBounds,
  CityCommand,
  FocusCommand,
  MIN_PROPERTY_ZOOM,
  INITIAL_CITY_ZOOM,
  PROPERTY_FOCUS_ZOOM,
  DEFAULT_OVERVIEW_ZOOM,
  DEFAULT_MAP_CENTER,
} from "@/components/common/google-map";
import { useUser } from "@/components/providers/user-provider";
import { PropertyMapSidebar } from "@/components/common/property-map-sidebar";

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

function extractCityCoordinates(
  cityRes: any,
): { lat: number; lng: number } | null {
  const rawData = cityRes?.data?.data ?? cityRes?.data ?? cityRes;
  const cityObj = Array.isArray(rawData) ? rawData[0] : rawData;
  if (cityObj?.latitude && cityObj?.longitude) {
    const lat = Number(cityObj.latitude);
    const lng = Number(cityObj.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

function extractPropertyList(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.properties)) return result.properties;
  if (Array.isArray(result.data?.data)) return result.data.data;
  return [];
}

function isPointInViewport(
  lat: number,
  lng: number,
  viewport: ViewportBounds,
): boolean {
  if (isNaN(lat) || isNaN(lng)) return false;
  const isLatInside = lat >= viewport.minLat && lat <= viewport.maxLat;
  const isLngInside =
    viewport.minLng <= viewport.maxLng
      ? lng >= viewport.minLng && lng <= viewport.maxLng
      : lng >= viewport.minLng || lng <= viewport.maxLng;
  return isLatInside && isLngInside;
}

const computeMarkerReportStatus = (
  p: any,
  reportUsage: any,
  currentUser: any,
  currentRole: string | null | undefined,
): "view" | "purchase" | "none" => {
  const hasReport = p.has_report || (p.projects && p.projects.length > 0);
  if (!hasReport) return "none";

  const ownerEmail = p.property_owner?.email || p.owner_email || "";
  const isOwnerOfProperty =
    currentRole === "property_owner" &&
    !!ownerEmail &&
    currentUser?.email?.toLowerCase() === ownerEmail.toLowerCase();
  const isPurchased = p.is_purchased === true;
  const hasLimitAccess = Boolean(reportUsage && reportUsage.remaining > 0);

  const canDownload =
    (currentRole === "property_owner" &&
      (isOwnerOfProperty || isPurchased || hasLimitAccess)) ||
    currentRole === "admin" ||
    currentRole === "city_inspector" ||
    (currentRole === "contractor" && (isPurchased || hasLimitAccess)) ||
    (currentRole === "manufacturer" && (isPurchased || hasLimitAccess)) ||
    (currentRole === "realtor" && (isPurchased || hasLimitAccess)) ||
    (currentRole === "insurance_company" && (isPurchased || hasLimitAccess));

  return canDownload ? "view" : "purchase";
};

export default function MapView({
  searchParams,
  focusCenter,
  focusId,
  onFocusCleared,
}: MapViewProps) {
  const { user, role } = useUser();

  // Core map states
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolvingCity, setIsResolvingCity] = useState(false);
  const [cityCommand, setCityCommand] = useState<CityCommand | null>(null);
  const [focusCommand, setFocusCommand] = useState<FocusCommand | null>(null);

  // Sidebar states
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User report usage state (does NOT trigger property API fetch)
  const [reportUsage, setReportUsage] = useState<any>(null);

  // Request & caching refs
  const activeRequestRef = useRef<number>(0);
  const cityRequestIdRef = useRef<number>(0);
  const rawPropertiesCacheRef = useRef<any[]>([]);
  const currentViewportRef = useRef<ViewportBounds | null>(null);
  const lastFetchedBoundsRef = useRef<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const lastFetchedZoomRef = useRef<number | null>(null);
  const lastFilterKeyRef = useRef<string>("");

  // Starting city viewport and recenter-on-close refs
  const startingCityViewportRef = useRef<ViewportBounds | null>(null);
  const isAwaitingStartingCityViewportRef = useRef<boolean>(false);
  const shouldRecenterOnSidebarCloseRef = useRef<boolean>(false);
  const currentCityCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // 1. Fetch user report usage once for authenticated users
  useEffect(() => {
    if (
      role === "insurance_company" ||
      role === "realtor" ||
      role === "manufacturer" ||
      role === "contractor" ||
      role === "property_owner"
    ) {
      getReportUsage()
        .then((res) => {
          const usage = res?.data?.data ?? res?.data ?? res;
          setReportUsage(usage);
        })
        .catch(() => {});
    }
  }, [role]);

  // Extract active city and state filter IDs
  const activeCityId = useMemo(() => {
    const rawCityId = searchParams?.city_id?.trim();
    const rawCity = searchParams?.city?.trim();

    const isInvalidCity = (val?: string) =>
      !val ||
      val === "all" ||
      val.toLowerCase() === "all" ||
      val.toLowerCase() === "city";

    if (rawCityId && !isInvalidCity(rawCityId)) {
      return rawCityId;
    }
    if (rawCity && !isInvalidCity(rawCity)) {
      return rawCity;
    }
    return undefined;
  }, [searchParams?.city_id, searchParams?.city]);

  const activeStateId = useMemo(() => {
    return searchParams?.state_id && searchParams.state_id !== "all"
      ? searchParams.state_id
      : searchParams?.state && searchParams.state !== "all"
        ? searchParams.state
        : undefined;
  }, [searchParams?.state_id, searchParams?.state]);

  // Search filter key for deduplicating requests
  const filterKey = useMemo(() => {
    return JSON.stringify({
      city_id: activeCityId || "",
      brandName: searchParams?.brandName?.trim() || "",
      style: searchParams?.style?.trim() || "",
      color: searchParams?.color?.trim() || "",
    });
  }, [searchParams, activeCityId]);

  // Helper to map properties to markers without blocking on AWS signed URLs
  const mapProperties = useCallback(
    (list: any[]): MarkerData[] => {
      return list
        .filter((p: any) => p.latitude && p.longitude)
        .map((p: any) => ({
          id: p.id,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          title: p.address || "Property",
          description:
            `${p.city_name || p.city?.name || ""} ${p.state_name || p.state || ""}`.trim(),
          front_image: p.front_image || null,
          street_view_link: p.street_view_link || null,
          reportStatus: computeMarkerReportStatus(p, reportUsage, user, role),
        }));
    },
    [reportUsage, user, role],
  );

  // 2. In-memory update when reportUsage changes (NO location API request)
  useEffect(() => {
    if (rawPropertiesCacheRef.current.length > 0) {
      setMarkers(mapProperties(rawPropertiesCacheRef.current));
    }
  }, [reportUsage, mapProperties]);

  // 3. Resolve city coordinates on city selection and dispatch cityCommand
  useEffect(() => {
    const resolveCity = async () => {
      if (!activeCityId) {
        // Special case: city inspector without activeCityId
        if (role === "city_inspector" && user?.user?.city_id) {
          const requestId = ++cityRequestIdRef.current;
          setIsResolvingCity(true);
          try {
            const res = await getCities(
              undefined,
              undefined,
              user.user.city_id,
            );
            if (requestId !== cityRequestIdRef.current) return;
            const coords = extractCityCoordinates(res);
            if (coords) {
              currentCityCenterRef.current = { lat: coords.lat, lng: coords.lng };
              isAwaitingStartingCityViewportRef.current = true;
              startingCityViewportRef.current = null;
              shouldRecenterOnSidebarCloseRef.current = false;
              lastFetchedBoundsRef.current = null;
              setCityCommand({
                lat: coords.lat,
                lng: coords.lng,
                zoom: INITIAL_CITY_ZOOM,
                id: `inspector-city-${user.user.city_id}`,
              });
            }
          } catch (err) {
            console.error("[MapView] Failed to resolve inspector city:", err);
          } finally {
            if (requestId === cityRequestIdRef.current) {
              setIsResolvingCity(false);
            }
          }
          return;
        }

        startingCityViewportRef.current = null;
        currentCityCenterRef.current = null;
        isAwaitingStartingCityViewportRef.current = false;
        shouldRecenterOnSidebarCloseRef.current = false;
        setCityCommand(null);
        return;
      }

      const requestId = ++cityRequestIdRef.current;
      setIsResolvingCity(true);

      try {
        const isUuidOrNum =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            activeCityId,
          ) || !isNaN(Number(activeCityId));

        const cityRes = isUuidOrNum
          ? await getCities(undefined, undefined, activeCityId)
          : await getCities(1, 1, undefined, activeCityId, activeStateId);

        if (requestId !== cityRequestIdRef.current) return;

        const coords = extractCityCoordinates(cityRes);
        if (coords) {
          // Clear cached bounds so the incoming actual viewport fetch will run
          lastFetchedBoundsRef.current = null;
          currentCityCenterRef.current = { lat: coords.lat, lng: coords.lng };
          isAwaitingStartingCityViewportRef.current = true;
          startingCityViewportRef.current = null;
          shouldRecenterOnSidebarCloseRef.current = false;
          setCityCommand({
            lat: coords.lat,
            lng: coords.lng,
            zoom: INITIAL_CITY_ZOOM,
            id: `city-${activeCityId}-${Date.now()}`,
          });
        } else {
          startingCityViewportRef.current = null;
          currentCityCenterRef.current = null;
          isAwaitingStartingCityViewportRef.current = false;
          shouldRecenterOnSidebarCloseRef.current = false;
        }
      } catch (err) {
        console.error("[MapView] Failed to resolve city coordinates:", err);
      } finally {
        if (requestId === cityRequestIdRef.current) {
          setIsResolvingCity(false);
        }
      }
    };

    resolveCity();
  }, [activeCityId, activeStateId, role, user?.user?.city_id]);

  // 4. Handle external focus command (e.g. from Dashboard "View on map" button)
  useEffect(() => {
    if (focusCenter && !isNaN(focusCenter.lat) && !isNaN(focusCenter.lng)) {
      // Determine whether closing the sidebar should recenter back to the selected city
      if (activeCityId) {
        if (startingCityViewportRef.current) {
          const isInside = isPointInViewport(
            focusCenter.lat,
            focusCenter.lng,
            startingCityViewportRef.current,
          );
          shouldRecenterOnSidebarCloseRef.current = !isInside;
        } else if (currentCityCenterRef.current) {
          // If startingCityViewport has not settled yet, check distance against resolved city center
          const latDiff = Math.abs(focusCenter.lat - currentCityCenterRef.current.lat);
          const lngDiff = Math.abs(focusCenter.lng - currentCityCenterRef.current.lng);
          shouldRecenterOnSidebarCloseRef.current = latDiff > 0.1 || lngDiff > 0.1;
        } else {
          // City ID is selected but city coordinates are still resolving
          shouldRecenterOnSidebarCloseRef.current = true;
        }
      } else {
        shouldRecenterOnSidebarCloseRef.current = false;
      }

      setFocusCommand({
        lat: focusCenter.lat,
        lng: focusCenter.lng,
        id: focusId,
        zoom: PROPERTY_FOCUS_ZOOM,
        commandId: `focus-${focusCenter.lat}-${focusCenter.lng}-${focusId || ""}-${Date.now()}`,
      });
      if (focusId) {
        setSelectedPropertyId(focusId);
        setIsSidebarOpen(true);
      }
    } else {
      setFocusCommand(null);
    }
  }, [focusCenter?.lat, focusCenter?.lng, focusId, activeCityId]);

  // 5. Unified property fetching path: triggered ONLY by actual viewport change
  const fetchProperties = useCallback(
    async (viewport: ViewportBounds) => {
      // Do not fetch properties if zoom is below minimum threshold
      if (viewport.zoom < MIN_PROPERTY_ZOOM) {
        setMarkers([]);
        setLoading(false);
        return;
      }

      // 15% geographic buffer to avoid fetching on small pans
      const latSpan = viewport.maxLat - viewport.minLat;
      const lngSpan = viewport.maxLng - viewport.minLng;
      const bufferLat = latSpan * 0.15;
      const bufferLng = lngSpan * 0.15;

      const bufferedBounds = {
        minLat: viewport.minLat - bufferLat,
        maxLat: viewport.maxLat + bufferLat,
        minLng: viewport.minLng - bufferLng,
        maxLng: viewport.maxLng + bufferLng,
      };

      // Viewport deduplication check: skip if current viewport is inside cached bounds
      const lastBounds = lastFetchedBoundsRef.current;
      const lastZoom = lastFetchedZoomRef.current;
      const lastKey = lastFilterKeyRef.current;

      const isInsideCachedBounds =
        lastBounds &&
        viewport.minLat >= lastBounds.minLat &&
        viewport.maxLat <= lastBounds.maxLat &&
        viewport.minLng >= lastBounds.minLng &&
        viewport.maxLng <= lastBounds.maxLng;

      const isSameZoom =
        lastZoom !== null && Math.abs(viewport.zoom - lastZoom) < 1;
      const isSameFilters = lastKey === filterKey;

      if (isInsideCachedBounds && isSameZoom && isSameFilters) {
        return;
      }

      const requestId = ++activeRequestRef.current;
      setLoading(true);

      try {
        const filterPayload: any = {};
        if (activeCityId) filterPayload.city_id = activeCityId;
        if (searchParams?.brandName?.trim())
          filterPayload.brandName = searchParams.brandName.trim();
        if (searchParams?.color?.trim())
          filterPayload.color = searchParams.color.trim();
        if (searchParams?.style?.trim())
          filterPayload.style = searchParams.style.trim();

        const result = await getPropertyLocations(
          bufferedBounds.minLat,
          bufferedBounds.maxLat,
          bufferedBounds.minLng,
          bufferedBounds.maxLng,
          viewport.zoom,
          filterPayload,
        );

        console.log("api rseponse", result);

        if (requestId !== activeRequestRef.current) return;

        const propertyList = extractPropertyList(result);
        rawPropertiesCacheRef.current = propertyList;
        setMarkers(mapProperties(propertyList));

        lastFetchedBoundsRef.current = bufferedBounds;
        lastFetchedZoomRef.current = viewport.zoom;
        lastFilterKeyRef.current = filterKey;
      } catch (error) {
        console.error(
          "[MapView] Failed to fetch properties for bounds:",
          error,
        );
      } finally {
        if (requestId === activeRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [activeCityId, activeStateId, filterKey, mapProperties, searchParams],
  );

  // 6. Viewport change reported by GoogleMap (owns physical viewport)
  const handleViewportChange = useCallback(
    (viewport: ViewportBounds) => {
      currentViewportRef.current = viewport;
      fetchProperties(viewport);
    },
    [fetchProperties],
  );

  // 7. When search filters change (same viewport + new filters -> fetch; do NOT recenter)
  useEffect(() => {
    if (lastFilterKeyRef.current && lastFilterKeyRef.current !== filterKey) {
      lastFetchedBoundsRef.current = null;
      if (
        currentViewportRef.current &&
        currentViewportRef.current.zoom >= MIN_PROPERTY_ZOOM
      ) {
        fetchProperties(currentViewportRef.current);
      }
    }
  }, [filterKey, fetchProperties]);

  const handleCityViewportSettled = useCallback(
    (viewport: ViewportBounds) => {
      if (activeCityId && viewport.zoom >= MIN_PROPERTY_ZOOM) {
        startingCityViewportRef.current = viewport;
      } else if (!activeCityId) {
        startingCityViewportRef.current = null;
      }
      isAwaitingStartingCityViewportRef.current = false;
    },
    [activeCityId],
  );

  return (
    <Card className="border-border/60 shadow-xl overflow-hidden bg-muted/5 min-h-[600px] flex flex-col pt-0 relative">
      <GoogleMap
        markers={markers}
        loading={loading || isResolvingCity}
        onViewportChange={handleViewportChange}
        onCityViewportSettled={handleCityViewportSettled}
        cityCommand={cityCommand}
        focusCommand={focusCommand}
        initialCenter={
          currentCityCenterRef.current ||
          (cityCommand ? { lat: cityCommand.lat, lng: cityCommand.lng } : DEFAULT_MAP_CENTER)
        }
        initialZoom={
          cityCommand ? (cityCommand.zoom ?? INITIAL_CITY_ZOOM) : DEFAULT_OVERVIEW_ZOOM
        }
        onMarkerClick={(id) => {
          shouldRecenterOnSidebarCloseRef.current = false;
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

          if (
            activeCityId &&
            shouldRecenterOnSidebarCloseRef.current &&
            currentCityCenterRef.current
          ) {
            shouldRecenterOnSidebarCloseRef.current = false;
            setCityCommand({
              lat: currentCityCenterRef.current.lat,
              lng: currentCityCenterRef.current.lng,
              zoom: INITIAL_CITY_ZOOM,
              id: `recenter-city-${activeCityId}-${Date.now()}`,
            });
          }
        }}
      />
    </Card>
  );
}
