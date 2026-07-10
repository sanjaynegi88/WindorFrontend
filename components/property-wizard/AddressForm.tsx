'use client';

import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Eye } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StateOption, CityOption } from '@/lib/location-utils';
import { toast } from 'sonner';
import { ConfirmSubmitDialog } from './ConfirmSubmitDialog';
import { ZipSelect } from '@/components/city-zip-selector';
import { useUser } from '../providers/user-provider';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getCities } from '@/lib/actions';

export interface AddressData {
    address: string;
    address2?: string;
    property_type_id?: string;
    property_type?: string;
    city_id: string;
    city: string;
    state: string;
    zip: string;
    property_name: string;
    property_owner_id: string;
    latitude?: number;
    longitude?: number;
    other_city?: string;
    state_id?: string;
}

export interface PropertyOwnerOption {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
}

export interface PropertyTypeOption {
    name: string;
}

interface AddressFormProps {
    data: AddressData;
    onChange: (data: AddressData) => void;
    onSubmit: (e: React.FormEvent, nextStep?: string) => void;
    loading: boolean;
    states?: StateOption[];
    cities?: CityOption[];
    propertyOwners?: PropertyOwnerOption[];
    propertyTypes?: PropertyTypeOption[];
    alreadySaved?: boolean;
    isEdit?: boolean;
    onBack?: () => void;
    hasSavedImages?: boolean;
}

const triggerClass =
    'h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] data-placeholder:text-[#708090]/50 focus:ring-[#1CA7A6]/20 font-asap gap-2 justify-start text-left [&>span]:flex-1 [&>span]:truncate [&>span]:text-left';

export function AddressForm({
    data,
    onChange,
    onSubmit,
    loading,
    states = [],
    cities = [],
    propertyOwners = [],
    propertyTypes = [],
    alreadySaved = false,
    isEdit = false,
    onBack,
    hasSavedImages = false,
}: AddressFormProps) {

    const user = useUser();
    const [citySearch, setCitySearch] = useState('');
    const [fetchedCities, setFetchedCities] = useState<CityOption[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        let active = true;
        const timer = setTimeout(async () => {
            if (!data.state && !citySearch) {
                setFetchedCities([]);
                return;
            }
            setLoadingCities(true);
            try {
                const citiesData = await getCities(undefined, undefined, undefined, citySearch || undefined, data.state || undefined);
                const rawCities = Array.isArray(citiesData) ? citiesData : citiesData?.data || [];
                const formatted = rawCities.map((c: any) => ({
                    id: String(c.id),
                    name: c.city_name || c.name,
                    state_id: c.state_id ? String(c.state_id) : undefined
                }));
                if (active) {
                    setFetchedCities(formatted);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) {
                    setLoadingCities(false);
                }
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [citySearch, data.state]);

    const cityOptions = useMemo(() => {
        if (!citySearch && fetchedCities.length === 0) {
            return cities.filter(c => !data.state || c.state_id === data.state);
        }
        return fetchedCities;
    }, [cities, fetchedCities, citySearch, data.state]);

    const handleFormSubmit = async (e: React.FormEvent, nextStep?: string) => {
        e.preventDefault();

        if (!data.property_type_id) {
            toast.error('Property type is required');
            return;
        }

        if (!data.address.trim()) {
            toast.error('Address is required');
            return;
        }
        if (!data.state) {
            toast.error('State is required');
            return;
        }
        if (!data.city_id && !data.other_city) {
            toast.error('City is required');
            return;
        }

        onSubmit(e, nextStep);
    };

    return (
        <div className="w-full max-w-[1170px] mx-auto space-y-[20px] md:space-y-[26px] animate-in fade-in zoom-in-95 duration-500 font-asap">
            <div className="text-center pb-[10px] md:pb-[20px]">
                <h2 className="text-[22px] md:text-[36px] font-bold text-[#1F2A44] uppercase leading-tight md:leading-[41px]">
                    Enter a New Property
                </h2>
            </div>

            <div className="space-y-[15px] md:space-y-[28px]">
                {/* Property Type */}
                <Select
                    value={data.property_type_id ?? data.property_type ?? ''}
                    onValueChange={(val) =>
                        onChange({
                            ...data,
                            property_type_id: val,
                            property_type: val,
                        })
                    }
                >
                    <SelectTrigger className={triggerClass}>
                        <SelectValue placeholder="Property Type" />
                    </SelectTrigger>

                    <SelectContent className="rounded-xl">
                        {propertyTypes.length > 0 ? (
                            propertyTypes.map((pt: any) => (
                                <SelectItem
                                    key={pt.id}
                                    value={pt.id}
                                >
                                    {pt.name
                                        ?.replace(/-/g, ' ')
                                        .replace(/\b\w/g, (c: any) => c.toUpperCase())}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-[#708090]">
                                Loading...
                            </div>
                        )}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Property Name"
                    required
                    className="h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap"
                    value={data.property_name}
                    onChange={(e) => onChange({ ...data, property_name: e.target.value })}
                />

                {/* Address 1 */}
                <Input
                    placeholder="Address 1"
                    required
                    className="h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap"
                    value={data.address}
                    onChange={(e) => onChange({ ...data, address: e.target.value })}
                />

                {/* Address 2 */}
                <Input
                    placeholder="Address 2"
                    className="h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap"
                    value={data.address2}
                    onChange={(e) => onChange({ ...data, address2: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-[10px] md:gap-[19.8px]">
                    {/* State */}
                    <Select
                        value={data.state || ''}
                        onValueChange={(val) => {
                            setCitySearch('');
                            setFetchedCities([]);
                            onChange({
                                ...data,
                                state: val,
                                state_id: val,
                                city_id: '',
                                city: '',
                                other_city: '',
                            });
                        }}
                    >
                        <SelectTrigger className={triggerClass}>
                            <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {states.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <SearchableSelect
                        options={cityOptions.map((c) => ({ id: c.id, name: c.name }))}
                        value={data.other_city ? `__custom__:${data.other_city}` : (data.city_id || '')}
                        displayValueFallback={data.city}
                        onValueChange={(val) => {
                            if (val.startsWith('__custom__:')) {
                                const customName = val.slice('__custom__:'.length);
                                onChange({
                                    ...data,
                                    city_id: '',
                                    other_city: customName,
                                    city: customName,
                                    state_id: data.state || '',
                                });
                            } else {
                                const selectedCity = cities.find((c) => c.id === val) || fetchedCities.find((c) => c.id === val);
                                onChange({
                                    ...data,
                                    city_id: val,
                                    other_city: '',
                                    city: selectedCity?.name || '',
                                    state: selectedCity?.state_id || data.state || '',
                                    state_id: selectedCity?.state_id || data.state || '',
                                });
                            }
                        }}
                        placeholder="City"
                        searchPlaceholder="Search city..."
                        loading={loadingCities}
                        allowCustom
                        searchValue={citySearch}
                        onSearchValueChange={setCitySearch}
                    />
                </div>

                <Input
                    placeholder="Zip Code"
                    required
                    className="h-[46px] md:h-[65px] px-[20px] md:px-[29px] bg-white border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] rounded-[6px] md:rounded-[10px] text-[14px] md:text-[20px] font-medium text-[#1F2A44] placeholder:text-[#708090]/50 font-asap"
                    value={data.zip}
                    onChange={(e) => onChange({ ...data, zip: e.target.value })}
                />

                {/* Property Owner */}
                {user?.role === "admin" && (
                    <Select
                        value={data.property_owner_id || ''}
                        onValueChange={(val) => onChange({ ...data, property_owner_id: val })}
                    >
                        <SelectTrigger className={triggerClass}>
                            <SelectValue placeholder="Property Owner" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {propertyOwners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                    {owner.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="space-y-[15px] md:space-y-[17px] pt-[15px] md:pt-[23px]">
                <Button
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleFormSubmit(e, 'SAVE')}
                    className="w-full h-[52px] md:h-[77px] border border-[#1CA7A6] bg-white text-[#1CA7A6] hover:bg-[#1CA7A6]/5 font-bold rounded-[10px] text-[20px] md:text-[30px] font-asap shadow-none"
                >
                    {loading ? 'Saving...' : alreadySaved ? 'Saved ✓' : 'Save'}
                </Button>

                {!isEdit && (
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={(e) => handleFormSubmit(e, 'PROJECT')}
                        className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold rounded-[10px] text-[20px] md:text-[30px] shadow-none font-asap"
                    >
                        {alreadySaved ? 'Continue to Project' : 'Save & Add Project'}
                    </Button>
                )}

                <Button
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleFormSubmit(e, 'IMAGES')}
                    className="w-full h-[52px] md:h-[77px] border border-[#1F2A44] bg-white text-[#1F2A44] hover:bg-slate-50 font-bold rounded-[6px] text-[20px] md:text-[30px] flex items-center justify-center gap-4 font-asap shadow-none"
                >
                    {hasSavedImages && !isEdit ? (
                        <>
                            <Eye className="size-[20px] md:size-[28px] text-[#1F2A44]" />
                            View Images
                        </>
                    ) : (
                        <>
                            <div className="size-[20px] md:size-[28px] rounded-full border border-[#1F2A44] flex items-center justify-center">
                                <span className="text-[14px] md:text-[20px] mt-[-2px]">+</span>
                            </div>
                            Upload Images
                        </>
                    )}
                </Button>
            </div>

            <div className="hidden md:flex justify-center pt-8 md:pt-[100px]">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex cursor-pointer items-center gap-[21px] text-[14px] md:text-[18px] font-bold text-[#1CA7A6] uppercase tracking-normal hover:opacity-80 transition-opacity font-asap"
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
