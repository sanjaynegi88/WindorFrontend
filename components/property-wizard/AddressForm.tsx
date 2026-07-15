'use client';

import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Eye, MapPin } from 'lucide-react';
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
import { getCities, getUserProfile, getReportUsage } from '@/lib/actions';
import { MapDialog } from './MapDialog';

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
    const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);

    const [usageLimitInfo, setUsageLimitInfo] = useState<{
        isFreePlan: boolean;
        isLimitReached: boolean;
        errorMessage: string | null;
        loading: boolean;
    }>({
        isFreePlan: false,
        isLimitReached: false,
        errorMessage: null,
        loading: false,
    });

    useEffect(() => {
        const currentRole = user.role?.toLowerCase();
        const isContractorOrManufacturer = currentRole === 'contractor' || currentRole === 'manufacturer';
        
        if (!isContractorOrManufacturer || alreadySaved) return;

        let active = true;
        const fetchLimits = async () => {
            setUsageLimitInfo(prev => ({ ...prev, loading: true }));
            try {
                const [profile, usage] = await Promise.all([
                    getUserProfile(),
                    getReportUsage()
                ]);

                if (!active) return;

                const profilePayload = profile?.data ?? profile;
                const usagePayload = usage?.data ?? usage;

                const level = (profilePayload as any)?.level;
                const subscriptionLevel = (profilePayload as any)?.current_subscription?.status === 'ACTIVE'
                    ? (profilePayload as any)?.current_subscription?.plan?.level
                    : undefined;
                const effectivelevel = (level || subscriptionLevel || '').toUpperCase();
                
                const isFreePlan = !effectivelevel || effectivelevel === 'FREE';

                const propertiesUsed = usagePayload?.propertiesUsed ?? 0;
                const propertiesProvided = usagePayload?.propertiesProvided ?? 0;
                const propertiesUnlimited = usagePayload?.propertiesUnlimited === true || usagePayload?.propertiesUnlimited === 'true';

                const remainingLimit = propertiesUnlimited ? 999999 : (propertiesProvided - propertiesUsed);
                const isLimitReached = !propertiesUnlimited && remainingLimit <= 0;

                let errorMessage = null;
                if (isFreePlan) {
                    errorMessage = 'Your current membership does not include the ability to submit new property addresses. Upgrade your membership to enable this feature.';
                } else if (isLimitReached) {
                    errorMessage = 'You have reached your monthly limit of new property submissions for your current membership plan. Your limit will reset on the first day of next month, or you may upgrade your membership to continue submitting properties.';
                }

                setUsageLimitInfo({
                    isFreePlan,
                    isLimitReached,
                    errorMessage,
                    loading: false
                });
            } catch (err) {
                console.error('Failed to fetch limit info:', err);
                if (active) {
                    setUsageLimitInfo(prev => ({ ...prev, loading: false }));
                }
            }
        };

        fetchLimits();

        return () => {
            active = false;
        };
    }, [user.role, alreadySaved]);

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

                {/* Property Owner & Coordinates (Admin Only) */}
                {user?.role === "admin" && (
                    <div className="space-y-[15px] md:space-y-[20px] p-5 border border-dashed border-[rgba(28,167,166,0.3)] rounded-[10px] bg-slate-50/50">
                        <div>
                            <label className="text-[12px] md:text-[14px] font-bold text-[#708090] uppercase tracking-widest px-1 mb-1 block">
                                Property Owner
                            </label>
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
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <Button
                                type="button"
                                onClick={() => setIsMapPopupOpen(true)}
                                className="h-[46px] md:h-[55px] border border-[#1CA7A6] bg-white text-[#1CA7A6] hover:bg-[#1CA7A6]/5 font-bold rounded-[6px] md:rounded-[10px] text-[14px] md:text-[18px] flex items-center justify-center gap-2 shadow-none font-asap px-6"
                            >
                                <MapPin className="size-[16px] md:size-[22px]" />
                                Locate / Move Pin on Map
                            </Button>
                            {data.latitude !== undefined && data.longitude !== undefined && (
                                <span className="text-[12px] md:text-[14px] font-mono text-[#708090] bg-white px-4 py-2 rounded-[6px] border border-slate-200/60 shadow-sm">
                                    Pin Coordinates: {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-[15px] md:space-y-[17px] pt-[15px] md:pt-[23px]">
                {usageLimitInfo.errorMessage && !alreadySaved && (
                    <div className="flex items-start gap-3 p-4 md:p-5 rounded-[6px] md:rounded-[10px] border border-red-100 bg-red-50/80 text-red-800 text-[14px] md:text-[16px] font-medium leading-relaxed font-asap shadow-sm">
                        <svg className="size-5 md:size-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            {usageLimitInfo.errorMessage}
                        </div>
                    </div>
                )}

                <Button
                    type="button"
                    disabled={loading || usageLimitInfo.loading || (!!usageLimitInfo.errorMessage && !alreadySaved)}
                    onClick={(e) => handleFormSubmit(e, 'SAVE')}
                    className="w-full h-[52px] md:h-[77px] border border-[#1CA7A6] bg-white text-[#1CA7A6] hover:bg-[#1CA7A6]/5 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-[10px] text-[20px] md:text-[30px] font-asap shadow-none"
                >
                    {loading ? 'Saving...' : alreadySaved ? 'Saved ✓' : 'Save'}
                </Button>

                <Button
                    type="button"
                    disabled={loading || usageLimitInfo.loading || (!!usageLimitInfo.errorMessage && !alreadySaved)}
                    onClick={(e) => handleFormSubmit(e, 'IMAGES')}
                    className="w-full h-[52px] md:h-[77px] border border-[#1F2A44] bg-white text-[#1F2A44] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-[6px] text-[20px] md:text-[30px] flex items-center justify-center gap-4 font-asap shadow-none"
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

            {user?.role === "admin" && (
                <MapDialog
                    isOpen={isMapPopupOpen}
                    onClose={() => setIsMapPopupOpen(false)}
                    latitude={data.latitude}
                    longitude={data.longitude}
                    addressString={data.address ? `${data.address}, ${data.city || ''}, ${data.state || ''} ${data.zip || ''}` : undefined}
                    onSave={(lat, lng) => onChange({ ...data, latitude: lat, longitude: lng })}
                />
            )}
        </div>
    );
}

