'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ImageIcon, X, ImagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { getAppImageUrl, toPascalCase } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';
import { DynamicFeaturesTable } from '../common/dynamic-features-table';
import { getBrands, getImageCategory } from '@/lib/actions';
import { useUser } from '../providers/user-provider';



const commonSchema = {
    description: z.string().min(1, 'Description is required'),
    installDate: z.string().min(1, 'Install date is required'),
    supplier: z.string().min(1, 'Supplier is required'),
    installer: z.string().min(1, 'Installer is required'),
    brand: z.string().min(1, 'Brand is required'),
    contractorImages: z.array(z.string()).max(5, 'Maximum 5 contractor images allowed').optional(),
    ownerImages: z.array(z.string()).max(5, 'Maximum 5 owner images allowed').optional(),
    // manufacturer: z.string().optional(),
};

const roofingSchema = z.object({
    ...commonSchema,
    style: z.string().min(1, 'Style is required'),
    color: z.string().min(1, 'Color is required'),
    material: z.string().min(1, 'Material is required'),
    impactResistant: z.boolean().default(false),
    classRating: z.string().min(1, 'Class  Rating is required'),
    type: z.string().optional(),
});

const sidingSchema = z.object({
    ...commonSchema,
    style: z.string().min(1, 'Style is required'),
    color: z.string().min(1, 'Color is required'),
    material: z.string().min(1, 'Material is required'),
    type: z.string().optional(),
    elevationdata: z.array(z.object({
        name: z.string(),
        value: z.string()
    })).optional(),
});

const windowsSchema = z.object({
    ...commonSchema,
    productionLine: z.string().min(1, 'Production line is required'),
    orderNumber: z.string().min(1, 'Order number is required'),
    u_factor: z.string().min(1, 'U-Factor is required'),
});
const doorsSchema = z.object({
    ...commonSchema,
    productionLine: z.string().min(1, 'Production line is required'),
    orderNumber: z.string().min(1, 'Order number is required'),
});
const garageDoorsSchema = z.object({
    ...commonSchema,
    windcode: z.string().min(1, 'Wind Code is required'),
    orderNumber: z.string().optional(),
});

const otherSchema = z.object({
    ...commonSchema,
});


interface InstallationFormProps {
    type: any | null;
    tempPropertyId: string | null;
    address: string;
    propertyName?: string;
    onBack: () => void;
    onSave?: (values: any, files: { contractorFiles: File[], ownerFiles: File[], categoryFiles?: Record<string, File> }) => void;
    onAddImages?: (values: any, files: { contractorFiles: File[], ownerFiles: File[], categoryFiles?: Record<string, File> }) => void;
    isLastStep?: boolean;
    initialValues?: any;
    initialFiles?: File[];
    isSubmitting?: boolean;
    hasReport?: boolean;
}

export function InstallationForm({
    type,
    address,
    propertyName,
    onSave,
    onAddImages,
    initialValues,
    initialFiles,
    isSubmitting,
    hasReport
}: InstallationFormProps) {
    const [loading, setLoading] = useState(false);
    const [contractorImagePreviews, setContractorImagePreviews] = useState<string[]>([]);
    const [ownerImagePreviews, setOwnerImagePreviews] = useState<string[]>([]);
    const [contractorFiles, setContractorFiles] = useState<File[]>([]);
    const [ownerFiles, setOwnerFiles] = useState<File[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const user = useUser();

    const isAdmin = user?.role === 'admin';

    const [existingOwnerImages, setExistingOwnerImages] = useState<string[]>([]);
    const [existingContractorImages, setExistingContractorImages] = useState<string[]>([]);
    const isEditMode = Boolean(initialValues);

    // Category-based contractor image state (edit mode)
    const [imageCategories, setImageCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryPhotos, setCategoryPhotos] = useState<Record<string, { file: File | null; preview: string | null }>>({});
    const categoryInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const normalizeCategoryKey = (value?: string) =>
        (value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

    useEffect(() => {
        const fetchBrands = async () => {
            if (!type) return;
            setLoading(true);
            try {
                const response = await getBrands(1, 1000, type.toUpperCase());
                const rawBrands = Array.isArray(response) ? response : response?.data || [];
                setBrands(rawBrands);
            } catch (error) {
                console.error('Failed to load brands:', error);
                setBrands([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBrands();
    }, [type]);

    // Load image categories for contractor images in edit mode
    useEffect(() => {
        if (!type) return;
        const fetchImageCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await getImageCategory(type.toUpperCase());
                console.log("res", res);
                const cats = res?.data || res || [];
                setImageCategories(cats);
                setCategoryPhotos(prev => {
                    const next = { ...prev };
                    cats.forEach((cat: any) => {
                        const key = normalizeCategoryKey(cat.category_name || cat.display_name);
                        if (key && !next[key]) next[key] = { file: null, preview: null };
                    });
                    return next;
                });
            } catch (e) {
                console.error('Failed to load image categories:', e);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchImageCategories();
    }, [isEditMode, type]);

    let schema;

    switch (type) {
        case 'roofing':
            schema = roofingSchema;
            break;

        case 'siding':
            schema = sidingSchema;
            break;

        case 'windows':
            schema = windowsSchema;
            break;

        case 'doors':
            schema = doorsSchema;
            break;

        case 'garage_doors':
            schema = garageDoorsSchema;
            break;

        default:
            schema = otherSchema;
    }

    const getDefaultValues = (values?: any) => ({
        description: values?.description || '',
        installDate: values?.installDate || '',
        supplier: values?.supplier || '',
        installer: values?.installer || '',
        brand: values?.brand || '',
        //manufacturer: values?.manufacturer || '',
        orderNumber: values?.orderNumber || values?.order_number || '',
        productionLine: values?.productionLine || '',
        windcode: values?.windcode || '',
        u_factor: values?.u_factor || '',
        style: values?.style || '',
        color: values?.color || '',
        material: values?.material || '',
        type: values?.type || '',
        impactResistant: values?.impactResistant ?? false,
        classRating: values?.classRating || '',
        elevationdata: values?.elevationdata || [],
        contractorImages: [],
        ownerImages: [],
    } as any);

    const form = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: getDefaultValues(initialValues),
    });

    useEffect(() => {
        form.reset(getDefaultValues(initialValues));
    }, [form, initialValues, type]);

    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            setContractorFiles(initialFiles);
            const previews = initialFiles.map(file => URL.createObjectURL(file));
            setContractorImagePreviews(previews);
        }

        if (isEditMode && initialValues?.images) {
            const contractorImages: string[] = [];
            const ownerImages: string[] = [];

            initialValues.images.forEach((img: any) => {
                if (img.image_url) {
                    contractorImages.push(getAppImageUrl(img.image_url));
                }
                if (img.property_owner_files) {
                    ownerImages.push(getAppImageUrl(img.property_owner_files));
                }
            });

            if (contractorImages.length > 0) {
                setExistingContractorImages(contractorImages);
            }
            setExistingOwnerImages(ownerImages);
        }
    }, [initialFiles, isEditMode, initialValues]);

    const handleOwnerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const oversizedFiles = files.filter(f => f.size > 2 * 1024 * 1024);
        const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024);

        if (oversizedFiles.length > 0) {
            toast.error(`Some files were removed because they exceed the 2MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        }

        if (validFiles.length === 0) {
            e.target.value = '';
            return;
        }

        if (ownerFiles.length + validFiles.length > 5) {
            toast.error('You can only upload up to 5 property owner images');
            e.target.value = '';
            return;
        }
        const newFiles = [...ownerFiles, ...validFiles];
        setOwnerFiles(newFiles);
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setOwnerImagePreviews(prev => [...prev, ...newPreviews]);
        form.setValue('ownerImages', newFiles.map(f => f.name) as any);
        e.target.value = '';
    };

    const removeOwnerImage = (index: number) => {
        const newFiles = [...ownerFiles];
        newFiles.splice(index, 1);
        setOwnerFiles(newFiles);
        const newPreviews = [...ownerImagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setOwnerImagePreviews(newPreviews);
        form.setValue('ownerImages', newFiles.map(f => f.name) as any);
    };

    const [pendingAction, setPendingAction] = useState<'save' | 'addImages'>('save');

    const onSubmit = async (values: any) => {
        if (!type) return;

        const categoryFileMap: Record<string, File> = {};
        Object.entries(categoryPhotos).forEach(([key, val]) => {
            if (val.file) categoryFileMap[key] = val.file;
        });
        const allFiles = { contractorFiles: isEditMode ? [] : contractorFiles, ownerFiles, categoryFiles: categoryFileMap };
        if (pendingAction === 'addImages' && onAddImages) {
            onAddImages(values, allFiles as any);
        } else if (onSave) {
            onSave(values, allFiles as any);
        }
    };

    const onError = (errors: any) => {
        console.log('Zod validation errors:', errors);
        console.log('Zod validation errors stringified:', JSON.stringify(errors, null, 2));
    };

    if (!type) return null;

    return (
        <Card className="border-border/60 shadow-2xl shadow-black/5 animate-in fade-in zoom-in-95 duration-500 overflow-hidden py-4">
            <CardHeader className="border-b bg-muted/20 pb-6">
                <div className="flex items-center gap-3">
                    <div className="space-y-1 w-full">
                        {propertyName && (
                            <span className="text-xs font-bold text-[#1CA7A6] uppercase tracking-wider block mb-1">
                                {propertyName}
                            </span>
                        )}
                        <CardTitle className="text-2xl flex items-center gap-2 capitalize">
                            {toPascalCase(type)} Specifications
                            {isEditMode && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/60 normal-case tracking-normal">
                                    Editing
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {isEditMode
                                ? `Update the installation details below. The installation type cannot be changed.`
                                : `Enter valid system data for ${propertyName}.`}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="font-semibold text-foreground">Installation Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter system details and condition notes..."
                                                className="min-h-[100px] bg-muted/20 focus:bg-background transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="installDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-foreground">Installation Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                max={new Date().toISOString().split('T')[0]}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="supplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-foreground">Supplier</FormLabel>
                                        <FormControl>
                                            <Input placeholder="supplier name" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="installer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-foreground">Installer Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Installer name" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* <FormField
                                control={form.control}
                                name="manufacturer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-foreground">Manufacturer</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Manufacturer" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            /> */}

                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-foreground">Manufacturer/Brand</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={brands.map((b) => ({ id: b.id, name: b.name }))}
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                                placeholder="Select manufacturer/brand"
                                                searchPlaceholder="Search brand..."
                                                loading={loading}
                                                allowCustom
                                                displayValueFallback={initialValues?.brandName}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(type === 'roofing' || type === 'siding') && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="style"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-foreground">Style</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Installation style" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-foreground">Color</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Installation color" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="material"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-foreground">Material</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Installation material" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-foreground">Type</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Installation type" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>

                            )}

                            {type === 'roofing' && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="classRating"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-foreground">Class Rating</FormLabel>
                                                <FormControl>
                                                    {/* <Rating
                                                        rating={field.value || 0}
                                                        maxRating={10}
                                                        editable={true}
                                                        showValue={true}
                                                        onRatingChange={(rating) => field.onChange(rating)}
                                                        className="py-2"
                                                    /> */}
                                                    <Input placeholder="Rating" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="impactResistant"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-muted/10">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="font-semibold">
                                                        Impact Resistant
                                                    </FormLabel>
                                                    <FormDescription>
                                                        System meets impact resistance standards.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {type === 'siding' && (
                                <div className="md:col-span-2">
                                    <DynamicFeaturesTable
                                        control={form.control}
                                        name="elevationdata"
                                        title="Elevation Data"
                                        namePlaceholder="Field name"
                                        valuePlaceholder="Value"
                                        addButtonText="Add New Feature Line"
                                    />
                                </div>
                            )}

                            {type === 'windows' && (
                                <FormField
                                    control={form.control}
                                    name="u_factor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-foreground">U-Factor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="U-Factor" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {type === 'garage_doors' && (
                                <FormField
                                    control={form.control}
                                    name="windcode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-foreground">Wind Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Wind Code" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {(type === 'windows' || type === 'doors' || type === 'garage_doors') && (
                                <>

                                    <FormField
                                        control={form.control}
                                        name="orderNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-foreground">Order Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Order number" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {(type === 'windows' || type === 'doors') && (
                                <FormField
                                    control={form.control}
                                    name="productionLine"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-foreground">Model</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Model" className="h-11 bg-muted/20 focus:bg-background transition-all" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}


                            <div className="md:col-span-2 space-y-6">
                                {/* ── Contractor Images (category-based) ── */}
                                <div className="space-y-3">
                                    <FormLabel className="font-semibold text-foreground">Contractor Images</FormLabel>
                                    <p className="text-xs text-muted-foreground flex flex-col gap-0.5">
                                        <span>{!isEditMode ? "Upload a photo for each category." : "Leave empty to keep the current image."}</span>
                                        <span className="text-[11px] text-amber-600 font-semibold">Acceptable size: Max 2MB per image</span>
                                    </p>

                                    {loadingCategories ? (
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="flex flex-col items-center gap-2">
                                                    <div className="relative aspect-square rounded-xl overflow-hidden border bg-muted/20 w-full" />
                                                    <div className="h-3 rounded bg-muted/40 w-3/4" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : imageCategories.length === 0 ? (
                                        <p className="text-sm font-semibold text-destructive/80 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
                                            No image categories added, contact administrator
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {imageCategories.map((cat) => {
                                                const key = normalizeCategoryKey(cat.category_name || cat.display_name);
                                                const label = (cat.display_name || cat.category_name || '')
                                                    .split(/[_\s]+/)
                                                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                                    .join(' ');
                                                const photo = categoryPhotos[key];
                                                const existingImg = initialValues?.images?.find(
                                                    (img: any) => normalizeCategoryKey(img.image_category) === key
                                                );
                                                const existingUrl = existingImg?.image_url
                                                    ? getAppImageUrl(existingImg.image_url)
                                                    : null;

                                                return (
                                                    <div key={cat.id} className="flex flex-col items-center gap-2">
                                                        <div
                                                            className="relative aspect-square rounded-xl overflow-hidden border bg-muted/20 w-full cursor-pointer group"
                                                            onClick={() => categoryInputRefs.current[key]?.click()}
                                                        >
                                                            {photo?.preview ? (
                                                                <>
                                                                    <img src={photo.preview} alt={label} className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (photo.preview) URL.revokeObjectURL(photo.preview);
                                                                            setCategoryPhotos(prev => ({ ...prev, [key]: { file: null, preview: null } }));
                                                                            if (categoryInputRefs.current[key]) categoryInputRefs.current[key]!.value = '';
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                    >
                                                                        <X className="size-3" />
                                                                    </button>
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] font-medium text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        Change
                                                                    </div>
                                                                </>
                                                            ) : existingUrl ? (
                                                                <>
                                                                    <img src={existingUrl} alt={label} className="w-full h-full object-cover opacity-60" />
                                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20">
                                                                        <ImagePlus className="size-5 text-white" />
                                                                        <span className="text-[10px] text-white font-medium">Replace</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/25 rounded-xl hover:border-primary/40 transition-colors">
                                                                    <ImageIcon className="size-6 text-muted-foreground/50" />
                                                                    <span className="text-[11px] text-muted-foreground font-medium">Add Photo</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-semibold text-center text-muted-foreground leading-tight w-full px-1">
                                                            {label}
                                                        </span>
                                                        <input
                                                            ref={el => { categoryInputRefs.current[key] = el; }}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                if (file.size > 2 * 1024 * 1024) {
                                                                    toast.error(`Image "${file.name}" exceeds the 2MB size limit`);
                                                                    e.target.value = '';
                                                                    return;
                                                                }
                                                                const preview = URL.createObjectURL(file);
                                                                setCategoryPhotos(prev => ({ ...prev, [key]: { file, preview } }));
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ── Property Owner Images ── */}
                                {isEditMode && isAdmin && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-0.5">
                                            <FormLabel className="font-semibold text-foreground">Property Owner Images (Up to 5)</FormLabel>
                                            <span className="text-[11px] text-amber-600 font-semibold">Acceptable size: Max 2MB per image</span>
                                        </div>

                                        {existingOwnerImages.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">Current Owner Images</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    {existingOwnerImages.map((url, index) => (
                                                        <div key={`existing-owner-${index}`} className="relative aspect-square rounded-xl overflow-hidden border bg-muted/20">
                                                            <img src={url} alt={`Existing Owner ${index + 1}`} className="w-full h-full object-cover" />
                                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-md font-medium">Current</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[0.8rem] text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                                                    Upload new images below to replace them.
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {ownerImagePreviews.map((preview, index) => (
                                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border bg-muted/20 group">
                                                    <img src={preview} alt={`Owner ${index + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOwnerImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {ownerImagePreviews.length < 5 && (
                                                <label className="aspect-square rounded-xl border-2 border-dashed border-green-300/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-green-400/60">
                                                    <ImagePlus className="size-6 text-green-600" />
                                                    <span className="text-xs text-green-700 font-medium">Add Photo</span>
                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleOwnerImageChange} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-10">
                            <Button
                                type="submit"
                                disabled={loading || isSubmitting}
                                onClick={() => setPendingAction('save')}
                                className="md:flex-1 h-12 bg-[#1F2A44] hover:bg-[#1a212c] text-white font-bold text-base rounded-xl"
                            >
                                {loading || isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    hasReport === false ? 'Save' : 'Save'
                                )}
                            </Button>

                            {/* {!isEditMode && onAddImages && (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    onClick={() => setPendingAction('addImages')}
                                    disabled={loading || isSubmitting}
                                    className="md:flex-1 h-12 border-2 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#e6f7f5] font-bold text-base rounded-xl gap-2"
                                >
                                    <ImagePlus className="size-5" />
                                    Add Images
                                </Button>
                            )} */}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
