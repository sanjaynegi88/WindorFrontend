'use client';

import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
}

interface GoogleMapProps {
    markers: MarkerData[];
    loading?: boolean;
    onMarkerClick?: (id: string) => void;
}

export default function GoogleMap({ markers, loading, onMarkerClick }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);



    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current) return;

            setOptions({
                key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            });

            const { Map } = await importLibrary('maps');

            const map = new Map(mapRef.current, {
                center: { lat: 39.8283, lng: -98.5795 },
                zoom: 4,
            });

            mapInstanceRef.current = map;
        };

        initMap();
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || loading) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        if (markers.length === 0) return;

        // Add new markers
        const newMarkers = markers.map(markerData => {
            const marker = new google.maps.Marker({
                position: { lat: markerData.lat, lng: markerData.lng },
                map: mapInstanceRef.current,
                title: markerData.title,
            });

            marker.addListener('click', () => {
                if (onMarkerClick) {
                    onMarkerClick(markerData.id);
                } else if (markerData.description) {
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<div><h3>${markerData.title}</h3><p>${markerData.description}</p></div>`,
                    });
                    infoWindow.open(mapInstanceRef.current, marker);
                }
            });

            return marker;
        });

        markersRef.current = newMarkers;

        // Fit map to markers
        if (markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend({ lat: marker.lat, lng: marker.lng }));
            mapInstanceRef.current.fitBounds(bounds);
        }
    }, [markers, loading, onMarkerClick]);

    return <div ref={mapRef} className="w-full h-full min-h-[600px]" />;
}