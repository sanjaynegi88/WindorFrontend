'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface MapDialogProps {
    isOpen: boolean;
    onClose: () => void;
    latitude?: number;
    longitude?: number;
    addressString?: string;
    onSave: (lat: number, lng: number) => void;
}

export function MapDialog({ isOpen, onClose, latitude, longitude, addressString, onSave }: MapDialogProps) {
    const [tempLat, setTempLat] = useState<number | null>(latitude ?? null);
    const [tempLng, setTempLng] = useState<number | null>(longitude ?? null);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    // Synchronize state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setTempLat(latitude ?? null);
            setTempLng(longitude ?? null);
        } else {
            setMapContainer(null);
        }
    }, [isOpen, latitude, longitude]);

    useEffect(() => {
        if (!isOpen || !mapContainer) return;

        let active = true;

        const loadMap = async () => {
            try {
                setOptions({
                    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
                });

                const { Map } = await importLibrary('maps') as any;
                const { AdvancedMarkerElement } = await importLibrary('marker') as any;

                if (!active) return;

                let centerLat = tempLat || 44.90201523983981;
                let centerLng = tempLng || -93.51909931477276;

                // Geocode address string if no lat/lng provided
                if (!tempLat && !tempLng && addressString) {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`);
                        const data = await response.json();
                        if (active && data && data.length > 0) {
                            const geocodedLat = parseFloat(data[0].lat);
                            const geocodedLng = parseFloat(data[0].lon);
                            if (!isNaN(geocodedLat) && !isNaN(geocodedLng)) {
                                centerLat = geocodedLat;
                                centerLng = geocodedLng;
                                setTempLat(geocodedLat);
                                setTempLng(geocodedLng);
                            }
                        }
                    } catch (err) {
                        console.error('Nominatim geocoding failed:', err);
                    }
                } else if (!tempLat && !tempLng) {
                    setTempLat(centerLat);
                    setTempLng(centerLng);
                }

                const map = new Map(mapContainer, {
                    center: { lat: centerLat, lng: centerLng },
                    zoom: 15,
                    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
                });
                mapInstanceRef.current = map;

                const markerContainer = document.createElement('div');
                markerContainer.style.width = '36px';
                markerContainer.style.height = '36px';
                const img = document.createElement('img');
                img.src = '/assets/map/map_marker.png';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                markerContainer.appendChild(img);

                const marker = new AdvancedMarkerElement({
                    map,
                    position: { lat: centerLat, lng: centerLng },
                    gmpDraggable: true,
                    content: markerContainer,
                });
                markerRef.current = marker;

                marker.addListener('dragend', () => {
                    const position = marker.position;
                    if (position) {
                        const latVal = typeof position.lat === 'function' ? (position.lat as any)() : position.lat;
                        const lngVal = typeof position.lng === 'function' ? (position.lng as any)() : position.lng;
                        setTempLat(Number(latVal));
                        setTempLng(Number(lngVal));
                    }
                });

                map.addListener('click', (event: any) => {
                    if (event.latLng) {
                        const latVal = event.latLng.lat();
                        const lngVal = event.latLng.lng();
                        setTempLat(latVal);
                        setTempLng(lngVal);
                        marker.position = { lat: latVal, lng: lngVal };
                    }
                });

            } catch (error) {
                console.error('Failed to initialize map in dialog:', error);
            }
        };

        loadMap();

        return () => {
            active = false;
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
            mapInstanceRef.current = null;
        };
    }, [isOpen, mapContainer]);

    const handleSave = () => {
        if (tempLat !== null && tempLng !== null) {
            onSave(tempLat, tempLng);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] md:max-w-[700px] rounded-xl bg-white p-6 font-asap">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#1F2A44] uppercase">Select Map Location</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 my-4">
                    <p className="text-sm text-[#708090]">
                        Click on the map or drag the pin to set the exact latitude and longitude coordinates.
                    </p>
                    <div 
                        ref={setMapContainer} 
                        className="w-full h-[350px] md:h-[450px] rounded-lg border border-slate-200 overflow-hidden" 
                    />
                    <div className="grid grid-cols-2 gap-4 text-sm font-medium text-[#1F2A44]">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-[#708090] text-xs block mb-1">SELECTED LATITUDE</span>
                            <span className="font-mono text-sm">{tempLat !== null ? tempLat.toFixed(8) : 'Not selected'}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-[#708090] text-xs block mb-1">SELECTED LONGITUDE</span>
                            <span className="font-mono text-sm">{tempLng !== null ? tempLng.toFixed(8) : 'Not selected'}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="border-slate-200 text-[#708090] hover:bg-slate-50 font-bold"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleSave}
                        className="bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold"
                    >
                        Save Location
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
