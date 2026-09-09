"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer, Renderer } from "@googlemaps/markerclusterer";
import { MapPin, RotateCcw } from "lucide-react";

export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  front_image?: string | null;
  street_view_link?: string | null;
  reportStatus?: "view" | "purchase" | "none";
}

export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  zoom: number;
}

export interface CityCommand {
  lat: number;
  lng: number;
  zoom?: number;
  id: string;
}

export interface FocusCommand {
  lat: number;
  lng: number;
  id?: string;
  zoom?: number;
  commandId: string;
}

export const MIN_PROPERTY_ZOOM = 12;
export const INITIAL_CITY_ZOOM = 14;
export const PROPERTY_FOCUS_ZOOM = 17.5;
export const DEFAULT_OVERVIEW_ZOOM = 4.5;
export const DEFAULT_MAP_CENTER = { lat: 39.8283, lng: -98.5795 };

interface GoogleMapProps {
  markers: MarkerData[];
  loading?: boolean;
  onMarkerClick?: (id: string) => void;
  onViewportChange?: (viewport: ViewportBounds) => void;
  onCityViewportSettled?: (viewport: ViewportBounds) => void;
  cityCommand?: CityCommand | null;
  focusCommand?: FocusCommand | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onRecenter?: () => void;
}

const customClusterRenderer: Renderer = {
  render: (cluster: any) => {
    const count = cluster.count;
    const position = cluster.position;

    const div = document.createElement("div");
    div.style.backgroundColor = "#1CA7A6";
    div.style.color = "#FFFFFF";
    div.style.borderRadius = "50%";
    div.style.width = "42px";
    div.style.height = "42px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontWeight = "700";
    div.style.fontSize = "14px";
    div.style.border = "3px solid #ffffff";
    div.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
    div.style.fontFamily = "system-ui, -apple-system, sans-serif";
    div.style.cursor = "pointer";
    div.style.transition = "transform 0.15s ease-in-out";
    div.innerText = String(count);

    div.addEventListener("mouseenter", () => {
      div.style.transform = "scale(1.15)";
    });
    div.addEventListener("mouseleave", () => {
      div.style.transform = "scale(1)";
    });

    const AdvancedMarkerElement =
      google.maps.marker && google.maps.marker.AdvancedMarkerElement
        ? google.maps.marker.AdvancedMarkerElement
        : (window as any).google?.maps?.marker?.AdvancedMarkerElement;

    return new AdvancedMarkerElement({
      position,
      content: div,
      zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
    });
  },
};

export default function GoogleMap({
  markers,
  loading = false,
  onMarkerClick,
  onViewportChange,
  onCityViewportSettled,
  cityCommand,
  focusCommand,
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_OVERVIEW_ZOOM,
  onRecenter,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);

  // Marker management refs
  const markersMapRef = useRef<
    Map<
      string,
      {
        marker: google.maps.marker.AdvancedMarkerElement;
        reportStatus: string;
      }
    >
  >(new Map());
  const markerClusterRef = useRef<MarkerClusterer | null>(null);

  // Command & timer refs
  const handledCityCommandRef = useRef<string | null>(null);
  const pendingCityCommandRef = useRef<string | null>(null);
  const handledFocusCommandRef = useRef<string | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const lastReportedViewportRef = useRef<ViewportBounds | null>(null);

  // Stable callback refs
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  const cityCommandRef = useRef(cityCommand);
  useEffect(() => {
    cityCommandRef.current = cityCommand;
  }, [cityCommand]);

  const onCityViewportSettledRef = useRef(onCityViewportSettled);
  useEffect(() => {
    onCityViewportSettledRef.current = onCityViewportSettled;
  }, [onCityViewportSettled]);

  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // 1. Initialize Google Map instance and idle listener safely
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapRef.current) return;

      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      });

      const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
      if (!isMounted || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        const startCenter = cityCommandRef.current
          ? { lat: cityCommandRef.current.lat, lng: cityCommandRef.current.lng }
          : initialCenter || DEFAULT_MAP_CENTER;
        const startZoom = cityCommandRef.current
          ? (cityCommandRef.current.zoom ?? INITIAL_CITY_ZOOM)
          : initialZoom || DEFAULT_OVERVIEW_ZOOM;

        const map = new Map(mapRef.current, {
          center: startCenter,
          zoom: startZoom,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          clickableIcons: false,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      setMapReady(true);

      if (idleListenerRef.current) {
        idleListenerRef.current.remove();
      }

      // Single idle listener: debounce and capture bounds + center + zoom together
      idleListenerRef.current = map.addListener("idle", () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
          if (!mapInstanceRef.current) return;
          const currentBounds = map.getBounds();
          const zoomLevel = map.getZoom();
          const center = map.getCenter();

          if (!currentBounds || zoomLevel === undefined || !center) return;

          setCurrentZoom(zoomLevel);

          const sw = currentBounds.getSouthWest();
          const ne = currentBounds.getNorthEast();
          const viewport: ViewportBounds = {
            minLat: sw.lat(),
            maxLat: ne.lat(),
            minLng: sw.lng(),
            maxLng: ne.lng(),
            zoom: zoomLevel,
          };

          if (
            pendingCityCommandRef.current &&
            zoomLevel >= MIN_PROPERTY_ZOOM &&
            cityCommandRef.current &&
            Math.abs(center.lat() - cityCommandRef.current.lat) < 0.05 &&
            Math.abs(center.lng() - cityCommandRef.current.lng) < 0.05
          ) {
            pendingCityCommandRef.current = null;
            onCityViewportSettledRef.current?.(viewport);
          }

          const last = lastReportedViewportRef.current;
          if (
            last &&
            Math.abs(last.minLat - viewport.minLat) < 0.00001 &&
            Math.abs(last.maxLat - viewport.maxLat) < 0.00001 &&
            Math.abs(last.minLng - viewport.minLng) < 0.00001 &&
            Math.abs(last.maxLng - viewport.maxLng) < 0.00001 &&
            last.zoom === viewport.zoom
          ) {
            return;
          }

          lastReportedViewportRef.current = viewport;
          onViewportChangeRef.current?.(viewport);
        }, 350);
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (idleListenerRef.current) {
        idleListenerRef.current.remove();
        idleListenerRef.current = null;
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
      if (markerClusterRef.current) {
        markerClusterRef.current.clearMarkers();
        markerClusterRef.current = null;
      }
      markersMapRef.current.forEach((entry) => {
        entry.marker.map = null;
      });
      markersMapRef.current.clear();
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, []);

  // 2. Explicit city center command
  useEffect(() => {
    cityCommandRef.current = cityCommand;
    if (!mapReady || !cityCommand || !mapInstanceRef.current) return;
    if (handledCityCommandRef.current === cityCommand.id) return;
    handledCityCommandRef.current = cityCommand.id;
    pendingCityCommandRef.current = cityCommand.id;
    lastReportedViewportRef.current = null;

    const targetZoom = cityCommand.zoom ?? INITIAL_CITY_ZOOM;
    mapInstanceRef.current.setCenter({ lat: cityCommand.lat, lng: cityCommand.lng });
    mapInstanceRef.current.setZoom(targetZoom);
    setCurrentZoom(targetZoom);
  }, [cityCommand, mapReady]);

  // 3. Explicit property focus command (cancellable timer)
  useEffect(() => {
    if (!mapReady || !focusCommand || !mapInstanceRef.current) return;
    if (handledFocusCommandRef.current === focusCommand.commandId) return;
    handledFocusCommandRef.current = focusCommand.commandId;

    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    const targetZoom = focusCommand.zoom ?? PROPERTY_FOCUS_ZOOM;
    focusTimeoutRef.current = setTimeout(() => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.panTo({
        lat: focusCommand.lat,
        lng: focusCommand.lng,
      });
      const zoom = mapInstanceRef.current.getZoom() ?? 0;
      if (zoom < targetZoom) {
        mapInstanceRef.current.setZoom(targetZoom);
        setCurrentZoom(targetZoom);
      }
    }, 100);
  }, [focusCommand, mapReady]);

  // 4. Marker lifecycle: diff-based updates using AdvancedMarkerElement
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || loading) return;

    let isCancelled = false;

    const syncMarkers = async () => {
      const { AdvancedMarkerElement } = (await importLibrary(
        "marker",
      )) as google.maps.MarkerLibrary;
      if (isCancelled || !mapInstanceRef.current) return;

      if (!markerClusterRef.current) {
        markerClusterRef.current = new MarkerClusterer({
          map: mapInstanceRef.current,
          markers: [],
          renderer: customClusterRenderer,
          onClusterClick: (_event: any, cluster: any, map: any) => {
            if (cluster.bounds) {
              map.fitBounds(cluster.bounds);
            }
          },
        });
      }

      const clusterer = markerClusterRef.current;
      const currentMarkersMap = markersMapRef.current;

      const validMarkers = markers.filter(
        (m) => m.reportStatus !== "none" && !isNaN(m.lat) && !isNaN(m.lng),
      );
      const newMarkerIds = new Set(validMarkers.map((m) => m.id));

      // Remove stale markers
      const removedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
      currentMarkersMap.forEach((entry, id) => {
        if (!newMarkerIds.has(id)) {
          entry.marker.map = null;
          removedMarkers.push(entry.marker);
          currentMarkersMap.delete(id);
        }
      });
      if (removedMarkers.length > 0) {
        clusterer.removeMarkers(removedMarkers);
      }

      // Add new or update existing
      const addedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
      for (const markerData of validMarkers) {
        const existing = currentMarkersMap.get(markerData.id);
        if (existing) {
          if (existing.reportStatus !== markerData.reportStatus) {
            existing.reportStatus = markerData.reportStatus || "none";
          }
        } else {
          const container = document.createElement("div");
          container.style.position = "relative";
          container.style.width = "36px";
          container.style.height = "36px";
          container.style.cursor = "pointer";
          container.style.transition = "transform 0.15s ease-in-out";

          container.addEventListener("mouseenter", () => {
            container.style.transform = "scale(1.15) translateY(-2px)";
          });
          container.addEventListener("mouseleave", () => {
            container.style.transform = "scale(1)";
          });

          const img = document.createElement("img");
          img.src = "/assets/map/map_marker.png";
          img.alt = markerData.title || "Property";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "contain";
          container.appendChild(img);

          const marker = new AdvancedMarkerElement({
            position: { lat: markerData.lat, lng: markerData.lng },
            title: markerData.title,
            content: container,
          });

          marker.addListener("click", () => {
            if (mapInstanceRef.current) {
              const zoom =
                mapInstanceRef.current.getZoom() || PROPERTY_FOCUS_ZOOM;
              mapInstanceRef.current.panTo({
                lat: markerData.lat,
                lng: markerData.lng,
              });
              if (zoom < PROPERTY_FOCUS_ZOOM) {
                mapInstanceRef.current.setZoom(PROPERTY_FOCUS_ZOOM);
                setCurrentZoom(PROPERTY_FOCUS_ZOOM);
              }
            }
            onMarkerClickRef.current?.(markerData.id);
          });

          currentMarkersMap.set(markerData.id, {
            marker,
            reportStatus: markerData.reportStatus || "none",
          });
          addedMarkers.push(marker);
        }
      }

      if (addedMarkers.length > 0) {
        clusterer.addMarkers(addedMarkers);
      }
    };

    syncMarkers();

    return () => {
      isCancelled = true;
    };
  }, [markers, loading, mapReady]);

  // Recenter button handler
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;

    if (cityCommand) {
      mapInstanceRef.current.panTo({
        lat: cityCommand.lat,
        lng: cityCommand.lng,
      });
      const zoomToUse = cityCommand.zoom ?? INITIAL_CITY_ZOOM;
      mapInstanceRef.current.setZoom(zoomToUse);
      setCurrentZoom(zoomToUse);
    } else if (markers.length > 0) {
      if (markers.length === 1) {
        mapInstanceRef.current.panTo({
          lat: markers[0].lat,
          lng: markers[0].lng,
        });
        mapInstanceRef.current.setZoom(PROPERTY_FOCUS_ZOOM);
        setCurrentZoom(PROPERTY_FOCUS_ZOOM);
      } else {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((m) => {
          if (!isNaN(m.lat) && !isNaN(m.lng)) {
            bounds.extend({ lat: m.lat, lng: m.lng });
          }
        });
        mapInstanceRef.current.fitBounds(bounds);
      }
    } else if (initialCenter) {
      mapInstanceRef.current.panTo(initialCenter);
      mapInstanceRef.current.setZoom(initialZoom);
      setCurrentZoom(initialZoom);
    }

    onRecenter?.();
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col">
      <div ref={mapRef} className="w-full h-full min-h-[600px]" />

      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur border border-border px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2.5 text-xs font-semibold text-foreground animate-in fade-in slide-in-from-top-2">
          <svg
            className="animate-spin h-3.5 w-3.5 text-primary"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Centering map & loading properties...</span>
        </div>
      )}

      {!loading && markers.length === 0 && currentZoom >= MIN_PROPERTY_ZOOM && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur border border-border px-4 py-2 rounded-full shadow-lg z-10 flex items-center gap-2 text-xs font-semibold text-muted-foreground animate-in fade-in slide-in-from-top-2">
          <MapPin className="size-4 text-[#1CA7A6] shrink-0" />
          <span>No properties found in this area or search.</span>
        </div>
      )}

      {markers.length > 0 && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute bottom-6 right-6 bg-[#1F2A44] hover:bg-[#1a212c] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-xl transition-all flex items-center gap-2 z-10 cursor-pointer border border-white/10"
        >
          <RotateCcw className="size-3.5 text-[#1CA7A6]" />
          Recenter Map ({markers.length})
        </button>
      )}

      {currentZoom < MIN_PROPERTY_ZOOM && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur border border-amber-200 dark:border-amber-900 px-3.5 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 animate-in fade-in slide-in-from-bottom-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Zoom in closer to load and view properties.</span>
        </div>
      )}
    </div>
  );
}
