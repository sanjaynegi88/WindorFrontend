'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageCategory } from '@/lib/actions';

interface CategoryImageUploadProps {
    address: string;
    initialCategory?: string;
    onSave: (photos: Record<string, File | null>) => void;
    onBack: () => void;
}

interface PhotoState {
    file: File | null;
    preview: string | null;
}

export function CategoryImageUpload({ address, initialCategory = 'roofing', onSave, onBack }: CategoryImageUploadProps) {
    const [photos, setPhotos] = useState<Record<string, PhotoState>>({});
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [loading, setLoading] = useState(false);
    const [componentImageCategories, setComponentImageCategories] = useState<any[]>([]);
    const categoryLabel = initialCategory
        ? initialCategory === 'windows-doors' || initialCategory === 'window_door'
            ? 'Windows & Doors'
            : initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1).toLowerCase()
        : 'Roofing';

    const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPhotos((prev) => ({ ...prev, [id]: { file, preview } }));
    };

    useEffect(() => {
        const getComponentImageCategories = async (component_type: string) => {
            try {
                setLoading(true);
                const res = await getImageCategory(1, 100, undefined, component_type.toUpperCase());
                const categories = res?.data || res || [];
                setComponentImageCategories(categories);

                setPhotos(prev => {
                    const newPhotos = { ...prev };
                    categories.forEach((cat: any) => {
                        const fieldName = cat.category_name;
                        if (fieldName && !newPhotos[fieldName]) {
                            newPhotos[fieldName] = { file: null, preview: null };
                        }
                    });
                    return newPhotos;
                });

                setLoading(false);
            } catch (error) {
                setLoading(false);
                console.error('Failed to load component image categories:', error);
            }
        };
        getComponentImageCategories(initialCategory);
    }, [initialCategory]);

    const handleRemove = (id: string) => {
        setPhotos((p) => {
            const prev = p[id];
            if (prev?.preview) URL.revokeObjectURL(prev.preview);
            return { ...p, [id]: { file: null, preview: null } };
        });
        if (inputRefs.current[id]) inputRefs.current[id]!.value = '';
    };

    const formatLabel = (name: string) => {
        if (!name) return '';
        return name
            .split(/[_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="w-full max-w-[1170px] mx-auto space-y-[20px] md:space-y-[45px] animate-in fade-in slide-in-from-bottom-4 duration-500 font-asap px-[20px] md:px-0">
            <div className="text-center space-y-[10px] md:space-y-[15px]">
                <h2 className="text-[24px] md:text-[36px] font-bold text-[#1F2A44] uppercase leading-tight md:leading-[41px]">
                    {address || '8175 RIVERDALE DR NW'}
                </h2>
                <div className="space-y-1 md:space-y-[10px]">
                    <p className="text-[#1CA7A6] font-medium text-[20px] md:text-[30px] leading-tight md:leading-[34px]">Enter New Photos</p>
                    <h3 className="text-[20px] md:text-[30px] font-bold text-[#1F2A44] leading-tight md:leading-[34px]">{categoryLabel}</h3>
                </div>
            </div>

            <div className="space-y-[10px] md:space-y-[18px]">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-6 w-32 bg-gray-200 rounded" />
                                <div className="flex-1 h-[46px] md:h-[70px] bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    componentImageCategories.map((item) => {
                        const id = item.id;
                        const label = formatLabel(item.category_name);
                        const fieldName = item.category_name;
                        const photo = photos[fieldName];
                        return (
                            <div key={id} className="flex items-center gap-2 md:gap-[23px] w-full">
                                <span className="text-[16px] md:text-[24px] font-bold text-[#708090] w-[100px] md:w-[200px] wrap-break-word">
                                    {label}
                                </span>

                                <input
                                    ref={(el) => { inputRefs.current[fieldName] = el; }}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(fieldName, e)}
                                />

                                {photo?.preview ? (
                                    <div className="flex-1 flex items-center gap-3 h-[46px] md:h-[70px] bg-[rgba(28,167,166,0.08)] border border-[rgba(28,167,166,0.3)] rounded-[6px] px-4">
                                        <Image
                                            src={photo.preview}
                                            alt={label}
                                            width={76}
                                            height={52}
                                            unoptimized
                                            className="h-[34px] md:h-[52px] w-[50px] md:w-[76px] object-cover rounded-[4px]"
                                        />
                                        <span className="flex-1 text-[13px] md:text-[16px] font-medium text-[#1F2A44] max-w-[700px] truncate">
                                            {photo.file?.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(fieldName)}
                                            className="text-[#708090] hover:text-red-500 transition-colors shrink-0"
                                            aria-label={`Remove ${label} photo`}
                                        >
                                            <X className="size-4 md:size-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => inputRefs.current[fieldName]?.click()}
                                            className="text-[#1CA7A6] text-[12px] md:text-[14px] font-bold hover:opacity-80 transition-opacity shrink-0"
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex-1 h-[46px] md:h-[70px] bg-[rgba(112,128,144,0.2)] hover:bg-[rgba(112,128,144,0.3)] transition-colors rounded-[6px] flex items-center justify-center gap-2 text-[16px] md:text-[24px] font-bold text-[#1F2A44] font-asap shadow-none"
                                        onClick={() => inputRefs.current[fieldName]?.click()}
                                    >
                                        <ImageIcon className="size-5 md:size-6 opacity-60" />
                                        Take & Upload
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="pt-[20px] md:pt-[40px]">
                <Button
                    onClick={() => {
                        const fileMap: Record<string, File | null> = {};
                        Object.entries(photos).forEach(([fieldName, photo]) => {
                            if (photo.file) {
                                fileMap[fieldName] = photo.file;
                            }
                        });
                        onSave(fileMap);
                    }}
                    className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold rounded-[10px] text-[20px] md:text-[30px] shadow-none font-asap"
                >
                    Add Images
                </Button>
            </div>
        </div>
    );
}
