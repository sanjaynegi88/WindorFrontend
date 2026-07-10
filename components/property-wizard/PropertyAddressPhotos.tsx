'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadPropertyImages, getPropertyById } from '@/lib/actions';
import { toast } from 'sonner';

interface PropertyAddressPhotosProps {
    address: string;
    propertyId: string;
    onSave: () => void;
    onBack: () => void;
}

interface PhotoState {
    file: File | null;
    preview: string | null;
}

export function PropertyAddressPhotos({ address, propertyId, onSave, onBack }: PropertyAddressPhotosProps) {
    const [photos, setPhotos] = useState<Record<string, PhotoState>>({
        front: { file: null, preview: null },
        other: { file: null, preview: null },
    });
    const [uploading, setUploading] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (!propertyId || propertyId === '') return;

        let isMounted = true;
        const fetchExistingImages = async () => {
            setLoadingExisting(true);
            try {
                const res = await getPropertyById(propertyId);
                const propertyPayload = res?.data ?? res;
                if (propertyPayload && isMounted) {
                    setPhotos({
                        front: { file: null, preview: propertyPayload.front_image || null },
                        other: { file: null, preview: propertyPayload.other_image || null },
                    });
                }
            } catch (err) {
                console.error('Failed to fetch existing property images:', err);
            } finally {
                if (isMounted) {
                    setLoadingExisting(false);
                }
            }
        };

        fetchExistingImages();

        return () => {
            isMounted = false;
        };
    }, [propertyId]);

    const hasNewFiles = !!photos.front.file || !!photos.other.file;
    const isAnyImageSaved = (!!photos.front.preview && !photos.front.file) || (!!photos.other.preview && !photos.other.file);

    let buttonText = 'Save';
    if (uploading) {
        buttonText = 'Uploading…';
    } else if (!hasNewFiles && isAnyImageSaved) {
        buttonText = 'Next';
    }

    const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error(`Image "${file.name}" exceeds the 2MB size limit`);
            e.target.value = '';
            return;
        }

        const preview = URL.createObjectURL(file);
        setPhotos((prev) => ({ ...prev, [id]: { file, preview } }));
    };

    const handleRemove = (id: string) => {
        const prev = photos[id];
        if (prev.preview) URL.revokeObjectURL(prev.preview);
        setPhotos((p) => ({ ...p, [id]: { file: null, preview: null } }));
        if (inputRefs.current[id]) inputRefs.current[id]!.value = '';
    };

    const handleSave = async () => {
        const frontFile = photos.front.file ?? undefined;
        const otherFile = photos.other.file ?? undefined;

        // If neither image is selected, skip upload and proceed
        if (!frontFile && !otherFile) {
            onSave();
            return;
        }

        setUploading(true);
        try {
            const response = await uploadPropertyImages(propertyId, frontFile, otherFile);
            if (!response.success) {
                toast.error(response.message);
                return;
            }
            toast.success('Property photos uploaded successfully');
            onSave();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload property photos');
        } finally {
            setUploading(false);
        }
    };

    if (loadingExisting) {
        return (
            <div className="w-full max-w-[1170px] mx-auto flex flex-col items-center justify-center py-20 gap-4 font-asap">
                <Loader2 className="size-12 animate-spin text-[#1CA7A6]" />
                <p className="text-sm font-medium text-[#708090]">Loading saved images...</p>
            </div>
        );
    }

    const items = [
        { id: 'front', label: 'Front' },
        { id: 'other', label: 'Other' },
    ];

    return (
        <div className="w-full max-w-[1170px] mx-auto space-y-[20px] md:space-y-[45px] animate-in fade-in slide-in-from-bottom-4 duration-500 font-asap px-[20px] md:px-0">
            <div className="text-center space-y-[10px] md:space-y-[15px]">
                <h2 className="text-[24px] md:text-[36px] font-bold text-[#1F2A44] uppercase leading-tight md:leading-[41px]">
                    {address || '8175 RIVERDALE DR NW'}
                </h2>
                <p className="text-[#1CA7A6] font-medium text-[20px] md:text-[30px] leading-tight md:leading-[34px]">Enter New Photos</p>
                <p className="text-sm font-semibold text-amber-600">Acceptable size: Max 2MB per image</p>
            </div>

            <div className="space-y-[10px] md:space-y-[18px]">
                {items.map((item) => {
                    const photo = photos[item.id];
                    return (
                        <div key={item.id} className="flex items-center gap-2 md:gap-[23px] w-full">
                            <span className="text-[16px] md:text-[24px] font-bold text-[#708090] min-w-[100px] md:min-w-[200px]">
                                {item.label}
                            </span>

                            {/* Hidden file input */}
                            <input
                                ref={(el) => { inputRefs.current[item.id] = el; }}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handleFileChange(item.id, e)}
                            />

                            {photo.preview ? (
                                <div className="flex-1 flex items-center gap-3 h-[46px] md:h-[70px] bg-[rgba(28,167,166,0.08)] border border-[rgba(28,167,166,0.3)] rounded-[6px] px-4">
                                    <img
                                        src={photo.preview}
                                        alt={item.label}
                                        className="h-[34px] md:h-[52px] w-[50px] md:w-[76px] object-cover rounded-[4px]"
                                    />
                                    <span className="flex-1 text-[13px] md:text-[16px] font-medium text-[#1F2A44] max-w-[700px] truncate">
                                        {photo.file ? photo.file.name : 'Saved Image'}
                                    </span>
                                    {photo.file ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(item.id)}
                                                className="text-[#708090] hover:text-red-500 transition-colors shrink-0"
                                                aria-label={`Remove ${item.label} photo`}
                                            >
                                                <X className="size-4 md:size-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => inputRefs.current[item.id]?.click()}
                                                className="text-[#1CA7A6] text-[12px] md:text-[14px] font-bold hover:opacity-80 transition-opacity shrink-0"
                                            >
                                                Change
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (photo.preview) {
                                                        window.open(photo.preview, '_blank');
                                                    }
                                                }}
                                                className="text-[#1CA7A6] text-[12px] md:text-[14px] font-bold hover:opacity-80 transition-opacity font-asap"
                                            >
                                                View Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => inputRefs.current[item.id]?.click()}
                                                className="text-[#1CA7A6] text-[12px] md:text-[14px] font-bold hover:opacity-80 transition-opacity"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="flex-1 h-[46px] md:h-[70px] bg-[rgba(112,128,144,0.2)] hover:bg-[rgba(112,128,144,0.3)] transition-colors rounded-[6px] flex items-center justify-center gap-2 text-[16px] md:text-[24px] font-bold text-[#1F2A44] font-asap shadow-none"
                                    onClick={() => inputRefs.current[item.id]?.click()}
                                >
                                    <ImageIcon className="size-5 md:size-6 opacity-60" />
                                    Take & Upload
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-[20px] md:pt-[40px]">
                <Button
                    onClick={handleSave}
                    disabled={uploading}
                    className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold rounded-[10px] text-[20px] md:text-[30px] shadow-none font-asap gap-3"
                >
                    {uploading && <Loader2 className="size-5 md:size-6 animate-spin" />}
                    {buttonText}
                </Button>
            </div>

            <div className="hidden md:flex justify-center pt-8 md:pt-[100px]">
                <button
                    onClick={onBack}
                    className="flex items-center cursor-pointer gap-[21px] text-[14px] md:text-[18px] font-medium text-[#1CA7A6] uppercase tracking-normal hover:opacity-80 transition-opacity font-asap"
                >
                    <div className="size-[26px] md:size-[32px] rounded-full bg-[rgba(28,167,166,0.25)] flex items-center justify-center">
                        <ChevronLeft className="size-4 md:size-5" />
                    </div>
                    Back
                </button>
            </div>
        </div>
    );
}
