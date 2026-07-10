'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getPropertyListAll } from '@/lib/actions';
import GoogleMap from '@/components/common/google-map';
import { PropertyDetailDialog } from '@/components/common/property-detail-dialog';

interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
}

interface MapViewProps {
    searchParams?: {
        search?: string;
        brandName?: string;
        style?: string;
        color?: string;
    };
}

export default function MapView({ searchParams }: MapViewProps) {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                const result = await getPropertyListAll(searchParams);

                if (result && result.data && Array.isArray(result.data)) {
                    setProperties(result.data);
                    const mappedMarkers: MarkerData[] = result.data
                        .filter((p: any) => p.latitude && p.longitude)
                        .map((p: any) => ({
                            id: p.id,
                            lat: Number(p.latitude),
                            lng: Number(p.longitude),
                            title: p.address || 'Property',
                            description: `${p.city_name || p.city?.name || ''} ${p.state_name || p.state || ''}`.trim()
                        }));
                    setMarkers(mappedMarkers);
                }
            } catch (error) {
                console.error('Failed to fetch properties for map:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [searchParams]);

    const handleMarkerClick = (id: string) => {
        const property = properties.find(p => p.id === id);
        if (property) {
            setSelectedProperty(property);
            setIsDialogOpen(true);
        }
    };

    return (
        <>
            <Card className="border-border/60 shadow-xl overflow-hidden bg-muted/5 min-h-[600px] flex flex-col pt-0 relative">
                <GoogleMap
                    markers={markers}
                    loading={loading}
                    onMarkerClick={handleMarkerClick}
                />
            </Card>

            <PropertyDetailDialog
                property={selectedProperty}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </>
    );
}
