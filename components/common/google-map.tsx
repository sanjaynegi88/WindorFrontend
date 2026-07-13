'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MarkerClusterer, Renderer } from '@googlemaps/markerclusterer';


interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
    front_image?: string | null;
    street_view_link?: string | null;
    reportStatus?: 'view' | 'purchase' | 'none';
}

interface GoogleMapProps {
    markers: MarkerData[];
    loading?: boolean;
    onMarkerClick?: (id: string) => void;
    onViewportChange?: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, zoomLevel: number) => void;
    shouldFitBounds?: boolean;
    defaultCenter?: { lat: number; lng: number };
    defaultZoom?: number;
    defaultCityName?: string;
    focusedMarkerId?: string;
    onFocusCleared?: () => void;
}

const getDistanceInKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const getViewportRadiusKm = (map: google.maps.Map): number => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    if (!bounds || !center) return 10;

    const ne = bounds.getNorthEast();

    const R = 6371;
    const lat1 = center.lat() * Math.PI / 180;
    const lat2 = ne.lat() * Math.PI / 180;
    const deltaLat = (ne.lat() - center.lat()) * Math.PI / 180;
    const deltaLng = (ne.lng() - center.lng()) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.max(0.1, Math.min(distance * 1.3, 50));
};

const fetchNominatimGeocode = (address: string, callback: (lat: number, lng: number) => void) => {
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                if (!isNaN(lat) && !isNaN(lng)) {
                    callback(lat, lng);
                }
            }
        })
        .catch(err => {
            console.error('[GoogleMap] Nominatim geocoding failed:', err);
        });
};

const customClusterRenderer: Renderer = {
    render: (cluster: any, stats: any, map: any) => {
        const count = cluster.count;
        const position = cluster.position;

        const div = document.createElement('div');
        div.style.backgroundColor = '#1CA7A6';
        div.style.color = '#FFFFFF';
        div.style.borderRadius = '50%';
        div.style.width = '42px';
        div.style.height = '42px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontWeight = '700';
        div.style.fontSize = '14px';
        div.style.border = '3px solid #ffffff';
        div.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.25)';
        div.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        div.innerText = String(count);

        const AdvancedMarkerElement = (google.maps.marker && google.maps.marker.AdvancedMarkerElement)
            ? google.maps.marker.AdvancedMarkerElement
            : (window as any).google?.maps?.marker?.AdvancedMarkerElement;

        return new AdvancedMarkerElement({
            position,
            content: div,
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });
    }
};

export default function GoogleMap({
    markers,
    loading,
    onMarkerClick,
    onViewportChange,
    shouldFitBounds = true,
    defaultCenter,
    defaultZoom = 14,
    defaultCityName,
    focusedMarkerId,
    onFocusCleared,
}: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<any[]>([]);
    const markerClusterRef = useRef<MarkerClusterer | null>(null);
    const [zoom, setZoom] = useState<number>(defaultZoom);

    const onViewportChangeRef = useRef(onViewportChange);
    useEffect(() => {
        onViewportChangeRef.current = onViewportChange;
    }, [onViewportChange]);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchedRef = useRef<{ lat: number; lng: number; radius: number; zoom: number } | null>(null);
    const onFocusClearedRef = useRef(onFocusCleared);
    const skipNextViewportFetchRef = useRef<boolean>(false);

    useEffect(() => {
        onFocusClearedRef.current = onFocusCleared;
    }, [onFocusCleared]);

    useEffect(() => {
        if (shouldFitBounds) {
            lastFetchedRef.current = null;
        }
    }, [shouldFitBounds]);

    useEffect(() => {
        if (mapInstanceRef.current && defaultCenter) {
            skipNextViewportFetchRef.current = true;
            mapInstanceRef.current.panTo(defaultCenter);
            if (defaultZoom !== undefined) {
                mapInstanceRef.current.setZoom(defaultZoom);
                setZoom(defaultZoom);
            }
        }
    }, [defaultCenter, defaultZoom]);

    useEffect(() => {
        if (mapInstanceRef.current && defaultCityName && !defaultCenter && markers.length === 0) {
            const centerMap = (lat: number, lng: number) => {
                if (mapInstanceRef.current) {
                    skipNextViewportFetchRef.current = true;
                    mapInstanceRef.current.panTo({ lat, lng });
                    mapInstanceRef.current.setZoom(12);
                }
            };

            if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: defaultCityName }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const location = results[0].geometry.location;
                        centerMap(location.lat(), location.lng());
                        return;
                    }
                    console.warn('[GoogleMap] Google Geocoder failed or denied. Falling back to Nominatim.', status);
                    fetchNominatimGeocode(defaultCityName, centerMap);
                });
            } else {
                fetchNominatimGeocode(defaultCityName, centerMap);
            }
        }
    }, [defaultCityName, defaultCenter, markers.length]);

    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current) return;

            setOptions({
                key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            });

            const { Map } = await importLibrary('maps');

            const map = new Map(mapRef.current, {
                center: defaultCenter || { lat: 44.90201523983981, lng: -93.51909931477276 },
                zoom: defaultZoom,
                mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
            });

            mapInstanceRef.current = map;

            map.addListener('idle', () => {
                const currentZoom = map.getZoom();
                const center = map.getCenter();
                if (currentZoom !== undefined) {
                    setZoom(currentZoom);
                }

                if (skipNextViewportFetchRef.current) {
                    console.log('[GoogleMap] Skipping viewport fetch due to programmatic fitBounds/search centering.');
                    skipNextViewportFetchRef.current = false;
                    if (center && currentZoom !== undefined) {
                        const radius = getViewportRadiusKm(map);
                        lastFetchedRef.current = {
                            lat: center.lat(),
                            lng: center.lng(),
                            radius,
                            zoom: currentZoom
                        };
                    }
                    return;
                }

                if (currentZoom !== undefined && currentZoom >= 12 && center && onViewportChangeRef.current) {
                    if (debounceTimeoutRef.current) {
                        clearTimeout(debounceTimeoutRef.current);
                    }

                    debounceTimeoutRef.current = setTimeout(() => {
                        const bounds = map.getBounds();
                        if (!bounds) return;

                        const radius = getViewportRadiusKm(map);
                        const lat = center.lat();
                        const lng = center.lng();

                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();
                        const minLat = sw.lat();
                        const maxLat = ne.lat();
                        const minLng = sw.lng();
                        const maxLng = ne.lng();

                        console.log(`[GoogleMap Idle] Map Zoom: ${currentZoom}, Bounds: minLat=${minLat.toFixed(6)}, maxLat=${maxLat.toFixed(6)}, minLng=${minLng.toFixed(6)}, maxLng=${maxLng.toFixed(6)}`);

                        if (lastFetchedRef.current) {
                            const { lat: lastLat, lng: lastLng, radius: lastRadius, zoom: lastZoom } = lastFetchedRef.current;
                            const distance = getDistanceInKm(lat, lng, lastLat, lastLng);

                            const crossedZoomThreshold = (lastZoom >= 17.5) !== (currentZoom >= 17.5);
                            const zoomChanged = lastZoom !== currentZoom;

                            if (!crossedZoomThreshold && !zoomChanged && (distance + radius / 1.3 <= lastRadius)) {
                                return;
                            }
                        }

                        lastFetchedRef.current = { lat, lng, radius, zoom: currentZoom };
                        onViewportChangeRef.current?.({ minLat, maxLat, minLng, maxLng }, currentZoom);
                    }, 400);
                }
            });
        };

        initMap();

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (markerClusterRef.current) {
                markerClusterRef.current.clearMarkers();
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || loading) return;

        const updateMarkers = async () => {
            const { AdvancedMarkerElement } = await importLibrary('marker') as google.maps.MarkerLibrary;

            // Clear existing markers and clusterer
            if (markerClusterRef.current) {
                markerClusterRef.current.clearMarkers();
            }
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            if (markers.length === 0) return;

            // Add new markers using custom HTML elements to reflect status
            const newMarkers = markers.map(markerData => {
                const container = document.createElement('div');
                container.style.position = 'relative';
                container.style.width = '36px';
                container.style.height = '36px';
                container.style.cursor = 'pointer';
                container.style.transition = 'transform 0.15s ease-in-out';

                container.addEventListener('mouseenter', () => {
                    container.style.transform = 'scale(1.15) translateY(-2px)';
                });
                container.addEventListener('mouseleave', () => {
                    container.style.transform = 'scale(1)';
                });

                const img = document.createElement('img');
                img.src = '/assets/map/map_marker.png';
                img.alt = markerData.title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';

                // if (markerData.reportStatus === 'none') {
                //     img.style.filter = 'grayscale(100%)';
                //     img.style.opacity = '0.6';
                // } else if (markerData.reportStatus === 'purchase') {
                //     const badge = document.createElement('div');
                //     badge.style.position = 'absolute';
                //     badge.style.top = '-6px';
                //     badge.style.right = '-6px';
                //     badge.style.width = '18px';
                //     badge.style.height = '18px';
                //     badge.style.borderRadius = '50%';
                //     badge.style.backgroundColor = '#F59E0B'; // Amber for Purchase
                //     badge.style.border = '1.5px solid #ffffff';
                //     badge.style.display = 'flex';
                //     badge.style.alignItems = 'center';
                //     badge.style.justifyContent = 'center';
                //     badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

                //     badge.innerHTML = `
                //         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                //             <circle cx="9" cy="21" r="1"/>
                //             <circle cx="20" cy="21" r="1"/>
                //             <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                //         </svg>
                //     `;
                //     container.appendChild(badge);
                // }

                container.appendChild(img);

                const marker = new AdvancedMarkerElement({
                    position: { lat: markerData.lat, lng: markerData.lng },
                    title: markerData.title,
                    content: container,
                });

                marker.addListener('click', () => {
                    if (mapInstanceRef.current) {
                        const currentZoom = mapInstanceRef.current.getZoom() || 17.5;
                        mapInstanceRef.current.panTo({ lat: markerData.lat, lng: markerData.lng });
                        if (currentZoom < 17.5) {
                            mapInstanceRef.current.setZoom(17.5);
                        }
                    }
                    if (onMarkerClick) {
                        onMarkerClick(markerData.id);
                    }
                    if (onFocusClearedRef.current) {
                        onFocusClearedRef.current();
                    }
                });

                return marker;
            });

            markersRef.current = newMarkers;

            // Initialize or add markers to MarkerClusterer
            if (!markerClusterRef.current) {
                markerClusterRef.current = new MarkerClusterer({
                    map: mapInstanceRef.current,
                    markers: newMarkers,
                    renderer: customClusterRenderer,
                });
            } else {
                markerClusterRef.current.addMarkers(newMarkers);
            }

            // Fit map to markers if requested
            if (shouldFitBounds && markers.length > 0 && mapInstanceRef.current) {
                skipNextViewportFetchRef.current = true;
                if (markers.length === 1) {
                    const singleMarker = markers[0];
                    mapInstanceRef.current.panTo({ lat: singleMarker.lat, lng: singleMarker.lng });
                    mapInstanceRef.current.setZoom(17.5);
                } else {
                    const bounds = new google.maps.LatLngBounds();
                    markers.forEach(marker => bounds.extend({ lat: marker.lat, lng: marker.lng }));
                    mapInstanceRef.current.fitBounds(bounds);
                }
            }

            // Automatically select/focus marker if specified
            if (focusedMarkerId && mapInstanceRef.current) {
                const focusedIndex = markers.findIndex(m => m.id === focusedMarkerId);
                if (focusedIndex !== -1) {
                    const markerData = markers[focusedIndex];
                    setTimeout(() => {
                        if (mapInstanceRef.current) {
                            mapInstanceRef.current.panTo({ lat: markerData.lat, lng: markerData.lng });
                            mapInstanceRef.current.setZoom(17.5);
                        }
                        if (onMarkerClick) {
                            onMarkerClick(markerData.id);
                        }
                        if (onFocusClearedRef.current) {
                            onFocusClearedRef.current();
                        }
                    }, 300);
                }
            }
        };

        updateMarkers();
    }, [markers, loading, onMarkerClick, shouldFitBounds]);

    return (
        <div className="relative w-full h-full min-h-[600px] flex flex-col">
            <div ref={mapRef} className="w-full h-full min-h-[600px]" />

            {loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur border border-border px-3 py-1.5 rounded-full shadow-md z-10 flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                    <svg className="animate-spin h-3 w-3 text-primary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Updating properties...</span>
                </div>
            )}

            {zoom < 12 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur border border-amber-200 dark:border-amber-900 px-3.5 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 animate-in fade-in slide-in-from-bottom-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Zoom in closer to load and view properties.</span>
                </div>
            )}
        </div>
    );
}