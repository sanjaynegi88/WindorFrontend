'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { getPropertyLocations, getStates, getCities, getReportUsage } from '@/lib/actions';
import GoogleMap from '@/components/common/google-map';
import { getWorkingAwsImageUrl } from '@/lib/utils';
import { useUser } from '@/components/providers/user-provider';
import { PropertyMapSidebar } from '@/components/common/property-map-sidebar';

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

export default function MapView({ searchParams, focusCenter, focusId, onFocusCleared }: MapViewProps) {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [shouldFitBounds, setShouldFitBounds] = useState(false);
    const { user, role } = useUser();
    const [centerCityName, setCenterCityName] = useState<string | undefined>(undefined);
    const [reportUsage, setReportUsage] = useState<any>(null);

    // Sidebar State
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const activeRequestRef = useRef<number>(0);

    // Fetch report usage (insurance role)
    useEffect(() => {
        if (role === 'insurance_company') {
            getReportUsage()
                .then((res) => setReportUsage(res.data))
                .catch(() => {});
        }
    }, [role]);

    const getMarkerReportStatus = (p: any): 'view' | 'purchase' | 'none' => {
        const hasReport = p.has_report || (p.projects && p.projects.length > 0);
        if (!hasReport) return 'none';

        const ownerEmail = p.property_owner?.email || p.owner_email || '';
        const isOwnerOfProperty = role === 'property_owner' && !!ownerEmail && user?.email?.toLowerCase() === ownerEmail.toLowerCase();
        const isPurchased = p.is_purchased === true;

        const canDownload =
            (role === 'property_owner' && (isOwnerOfProperty || isPurchased)) ||
            role === 'admin' ||
            role === 'city_inspector' ||
            (role === 'contractor' && isPurchased) ||
            (role === 'manufacturer' && isPurchased) ||
            (role === 'realtor' && isPurchased) ||
            (role === 'insurance_company' &&
                (isPurchased || (reportUsage && reportUsage.remaining > 0)));

        return canDownload ? 'view' : 'purchase';
    };

    const currentBoundsRef = useRef<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);

    const fetchDataForBounds = async (
        bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
        zoomLevel?: number
    ) => {
        const requestId = ++activeRequestRef.current;
        try {
            setLoading(true);
            const result = await getPropertyLocations(
                bounds.minLat,
                bounds.maxLat,
                bounds.minLng,
                bounds.maxLng,
                zoomLevel,
                searchParams
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
                        const frontImage = p.front_image ? await getWorkingAwsImageUrl(p.front_image) : null;
                        return {
                            id: p.id,
                            lat: Number(p.latitude),
                            lng: Number(p.longitude),
                            title: p.address || 'Property',
                            description: `${p.city_name || p.city?.name || ''} ${p.state_name || p.state || ''}`.trim(),
                            front_image: frontImage,
                            street_view_link: p.street_view_link,
                            reportStatus: getMarkerReportStatus(p)
                        };
                    })
            );

            if (requestId !== activeRequestRef.current) return;
            setMarkers(mappedMarkers);
        } catch (error) {
            console.error('Failed to fetch properties for bounds:', error);
        } finally {
            if (requestId === activeRequestRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (focusCenter) {
            setLoading(false);
            return;
        }

        const hasFilters = !!(searchParams && Object.keys(searchParams).length > 0);
        setShouldFitBounds(hasFilters);

        if (currentBoundsRef.current) {
            fetchDataForBounds(currentBoundsRef.current);
        }
    }, [searchParams, reportUsage, focusCenter]);

    useEffect(() => {
        const resolveCenterLocation = async () => {
            if (searchParams?.city_id) {
                try {
                    const res = await getCities(undefined, undefined, searchParams.city_id);
                    const cityData = res?.data?.[0] ?? res?.data ?? res;
                    const resolvedName = Array.isArray(cityData) ? cityData[0]?.name : cityData?.name;
                    if (resolvedName) {
                        setCenterCityName(resolvedName);
                        return;
                    }
                } catch (err) {
                    console.error('[MapView] Failed to resolve selected city name:', err);
                }
            }

            if (searchParams?.state_id) {
                try {
                    const statesRes = await getStates(1, 1000);
                    const statesList = Array.isArray(statesRes) ? statesRes : statesRes?.data || [];
                    const stateObj = statesList.find((s: any) => s.id === searchParams.state_id);
                    if (stateObj) {
                        setCenterCityName(stateObj.state_name || stateObj.name);
                        return;
                    }
                } catch (err) {
                    console.error('[MapView] Failed to resolve selected state name:', err);
                }
            }

            if (role === 'city_inspector' && user?.user?.city_id) {
                try {
                    const res = await getCities(undefined, undefined, user.user.city_id);
                    const cityData = res?.data?.[0] ?? res?.data ?? res;
                    const resolvedName = Array.isArray(cityData) ? cityData[0]?.name : cityData?.name;
                    if (resolvedName) {
                        setCenterCityName(resolvedName);
                        return;
                    }
                } catch (err) {
                    console.error('[MapView] Failed to resolve inspector city name:', err);
                }
            }

            setCenterCityName(undefined);
        };

        resolveCenterLocation();
    }, [searchParams?.city_id, searchParams?.state_id, role, user]);

    const handleViewportChange = async (
        bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
        zoomLevel?: number
    ) => {
        currentBoundsRef.current = bounds;
        setShouldFitBounds(false);
        await fetchDataForBounds(bounds, zoomLevel);
    };

    return (
        <Card className="border-border/60 shadow-xl overflow-hidden bg-muted/5 min-h-[600px] flex flex-col pt-0 relative">
            <GoogleMap
                markers={markers}
                loading={loading}
                onViewportChange={handleViewportChange}
                shouldFitBounds={shouldFitBounds}
                defaultCenter={focusCenter || undefined}
                defaultZoom={focusCenter ? 17.5 : undefined}
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
                }}
            />
        </Card>
    );
}
