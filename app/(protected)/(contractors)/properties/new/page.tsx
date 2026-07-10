'use client';

import { useState, useEffect } from 'react';

import { AddressForm, AddressData, PropertyOwnerOption } from '@/components/property-wizard/AddressForm';
import { CategorySelection } from '@/components/property-wizard/CategorySelection';
import { PropertyAddressPhotos } from '@/components/property-wizard/PropertyAddressPhotos';
import { CategoryImageUpload } from '@/components/property-wizard/CategoryImageUpload';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileHeader } from '@/components/layouts/global';
import { Suspense } from 'react';


import { postProperty, postReport, postInstallation, postPropertyOwnerInstallations, getStates, getCities, getPropertyOwners, uploadInstallationImages, uploadPropertOwnerImages, getPropertyTypeOptions, getPropertyById, confirmProject } from '@/lib/actions';
import { type StateOption, type CityOption } from '@/lib/location-utils';
import { InstallationForm } from '@/components/property-wizard/InstallationForm';
import { ConfirmSubmitDialog } from '@/components/property-wizard/ConfirmSubmitDialog';
import { useUser } from '@/components/providers/user-provider';



interface PropertyAddProps {
    initialStep?: Step;
}


type Step = 'ADDRESS' | 'PHOTOS' | 'PROJECT' | 'IMAGE_UPLOAD' | 'FORM' | 'SUCCESS' | 'INSTALLATION_FORM';

function NewPropertyForm({ initialStep }: PropertyAddProps) {
    const searchParams = useSearchParams();
    const initialPropertyId = searchParams.get('propertyId');

    const flow = searchParams.get('flow');

    const [step, setStep] = useState<Step>(() => {
        if (typeof window !== 'undefined') {
            if (flow === 'add-installation' && localStorage.getItem('current_project_id') && localStorage.getItem('current_project_type')) {
                return 'INSTALLATION_FORM';
            }
            if (flow === 'add-installation' && localStorage.getItem('current_property_id')) {
                return 'PROJECT';
            }
        }
        return initialPropertyId ? 'PROJECT' : 'ADDRESS';
    });
    const [tempPropertyId, setTempPropertyId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            if (flow === 'add-installation') {
                const storedPropertyId = localStorage.getItem('current_property_id');
                if (storedPropertyId) return storedPropertyId;
            }
        }
        return initialPropertyId;
    });
    const [selectedTypes, setSelectedTypes] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            if (flow === 'add-installation') {
                const storedType = localStorage.getItem('current_project_type');
                if (storedType) return [storedType];
            }
        }
        return [];
    });
    const [installationsData, setInstallationsData] = useState<Record<string, { values: any, files: File[] | { contractorFiles: File[], ownerFiles: File[] } }>>({});
    const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            if (flow === 'add-installation') {
                const storedType = localStorage.getItem('current_project_type');
                if (storedType) return storedType;
            }
        }
        return 'roofing';
    });
    const [currentInstallationId, setCurrentInstallationId] = useState<string | null>(null);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            if (flow === 'add-installation') {
                return localStorage.getItem('current_project_id');
            }
        }
        return null;
    });
    const [isOwnerProjectType, setIsOwnerProjectType] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('is_owner_project_type') === 'true';
        }
        return false;
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [isInitializingProperty, setIsInitializingProperty] = useState(false);
    const [hasExistingReport, setHasExistingReport] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            if (flow === 'add-installation') {
                const storedHasReport = localStorage.getItem('current_property_has_report');
                if (storedHasReport !== null) return storedHasReport === 'true';
            }
        }
        return false;
    });
    const [existingPropertyName, setExistingPropertyName] = useState<string>('');
    const [states, setStates] = useState<StateOption[]>([]);
    const [cities, setCities] = useState<CityOption[]>([]);
    const [propertyOwners, setPropertyOwners] = useState<PropertyOwnerOption[]>([]);
    const [propertyTypes, setPropertyTypes] = useState<{ name: string }[]>([]);
    const [hasSavedImages, setHasSavedImages] = useState(false);

    const user = useUser();
    const canFetchOwners = user.role === 'admin';
    const router = useRouter();

    const clearPropertyFlow = () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('current_project_id');
        localStorage.removeItem('current_property_id');
        localStorage.removeItem('current_property_name');
        localStorage.removeItem('current_project_type');
        localStorage.removeItem('current_property_has_report');
        localStorage.removeItem('is_owner_project_type');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (flow !== 'add-installation' && !initialPropertyId) {
                clearPropertyFlow();
            }
        }
    }, [flow, initialPropertyId]);

    const [addressData, setAddressData] = useState<AddressData>(() => {
        if (typeof window !== 'undefined' && flow === 'add-installation') {
            const storedName = localStorage.getItem('current_property_name');
            if (storedName) {
                return {
                    address: '',
                    address2: '',
                    property_type: '',
                    city_id: '',
                    city: '',
                    state: '',
                    zip: '',
                    property_name: storedName,
                    property_owner_id: '',
                    latitude: 40.670,
                    longitude: -73.940
                };
            }
        }
        return {
            address: '',
            address2: '',
            property_type: '',
            city_id: '',
            city: '',
            state: '',
            zip: '',
            property_name: '',
            property_owner_id: '',
            latitude: 40.670,
            longitude: -73.940
        };
    });

    useEffect(() => {
        if (!tempPropertyId) {
            setIsInitializingProperty(false);
            return;
        }

        let isMounted = true;

        const loadPropertySummary = async () => {
            setIsInitializingProperty(true);

            try {
                const storedHasReport = flow === 'add-installation' ? localStorage.getItem('current_property_has_report') : null;
                if (storedHasReport !== null && isMounted) {
                    setHasExistingReport(storedHasReport === 'true');
                }

                const storedPropertyName = flow === 'add-installation' ? localStorage.getItem('current_property_name') : null;
                if (storedPropertyName && isMounted) {
                    setExistingPropertyName(storedPropertyName);
                    setAddressData((prev) => ({ ...prev, property_name: storedPropertyName }));
                }

                const [property, citiesRes] = await Promise.all([
                    getPropertyById(tempPropertyId),
                    getCities()
                ]);
                if (!isMounted) return;

                const rawCities: any[] = Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || [];
                setCities(rawCities.map((c) => ({ id: String(c.id), name: c.city_name || c.name, state_id: c.state_id ? String(c.state_id) : undefined })));

                const propertyPayload = property?.data ?? property;
                const reportFlag = propertyPayload?.has_report === true || propertyPayload?.has_report === 'true';
                const propertyName = propertyPayload?.property_name || propertyPayload?.name || '';

                setHasExistingReport(reportFlag);
                setExistingPropertyName(propertyName);
                if (propertyPayload) {
                    setHasSavedImages(!!propertyPayload.front_image || !!propertyPayload.other_image);
                    setAddressData({
                        address: propertyPayload.address || '',
                        address2: propertyPayload.address2 || '',
                        property_type_id: propertyPayload.property_type_id || propertyPayload.property_type?.id || '',
                        property_type: propertyPayload.property_type_id || propertyPayload.property_type?.id || '',
                        city_id: propertyPayload.city_id || '',
                        city: propertyPayload.city_name || propertyPayload.city?.name || '',
                        state: propertyPayload.state_id || '',
                        zip: propertyPayload.zip || '',
                        property_name: propertyName,
                        property_owner_id: propertyPayload.property_owner_id || '',
                        latitude: propertyPayload.latitude ? Number(propertyPayload.latitude) : 40.670,
                        longitude: propertyPayload.longitude ? Number(propertyPayload.longitude) : -73.940,
                    });
                }
                if (typeof window !== 'undefined') {
                    localStorage.setItem('current_property_has_report', String(reportFlag));
                    if (propertyName) {
                        localStorage.setItem('current_property_name', propertyName);
                    }
                }
            } catch (error) {
                console.error('Failed to load property summary:', error);
            } finally {
                if (isMounted) {
                    setIsInitializingProperty(false);
                }
            }
        };

        loadPropertySummary();

        return () => {
            isMounted = false;
        };
    }, [tempPropertyId]);

    useEffect(() => {
        if (!tempPropertyId || step !== 'ADDRESS') return;

        let isMounted = true;
        const checkImages = async () => {
            try {
                const property = await getPropertyById(tempPropertyId);
                const propertyPayload = property?.data ?? property;
                if (propertyPayload && isMounted) {
                    const hasImages = !!propertyPayload.front_image || !!propertyPayload.other_image;
                    setHasSavedImages(hasImages);
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkImages();
        return () => {
            isMounted = false;
        };
    }, [tempPropertyId, step]);

    useEffect(() => {
        async function loadLocationData() {
            try {
                const [statesRes, citiesRes, ownersRes, typesRes] = await Promise.all([
                    getStates(1, 1000),
                    getCities(),
                    canFetchOwners ? getPropertyOwners() : Promise.resolve([]),
                    getPropertyTypeOptions(),
                ]);
                const rawStates: any[] = Array.isArray(statesRes) ? statesRes : statesRes?.data || [];
                const rawCities: any[] = Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || [];
                const rawOwners: any[] = Array.isArray(ownersRes) ? ownersRes : ownersRes?.data || [];
                const rawPropertyTypes: any[] = typesRes?.data || [];
                setStates(rawStates.map((s) => ({ id: String(s.id), name: s.state_name || s.name, abbreviation: s.abbreviation })));
                setCities(rawCities.map((c) => ({ id: String(c.id), name: c.city_name || c.name, state_id: c.state_id ? String(c.state_id) : undefined })));
                setPropertyOwners(rawOwners.map((o: any) => ({
                    id: String(o.id),
                    first_name: o.first_name,
                    last_name: o.last_name,
                    email: o.email
                })));
                setPropertyTypes(
                    rawPropertyTypes.map((pt: any) => ({
                        id: String(pt.id),
                        name: pt.type_name,
                    }))
                );
            } catch (error) {
                console.error('Failed to load location data:', error);
                toast.error('Failed to load states and cities lists');
            }
        }
        loadLocationData();
    }, []);



    const handleCreateProperty = async (e: React.FormEvent, nextStep?: string) => {
        e.preventDefault();

        setLoading(true);
        try {

            let propertyId = tempPropertyId;

            if (!propertyId) {
                const propertyResult = await postProperty({
                    address: addressData.address,
                    address2: addressData.address2,
                    city_id: addressData.city_id || null,
                    other_city: addressData.other_city || null,
                    state_id: addressData.state || addressData.state_id || null,
                    zip: addressData.zip,
                    property_type_id: addressData.property_type,
                    property_name: addressData.property_name,
                    ...(user.role == "admin" ? { property_owner_id: addressData.property_owner_id } : {}),
                    latitude: addressData.latitude,
                    longitude: addressData.longitude,
                });

                if (!propertyResult.success) {
                    toast.error(propertyResult.message || 'Failed to save property. Please try again.');
                    return;
                }

                propertyId = propertyResult.data?.data?.id || propertyResult.data?.id;
                if (!propertyId) throw new Error('Property creation failed — no ID returned');

                const propertyData = propertyResult.data?.data ?? propertyResult.data;
                const reportFlag = propertyData?.has_report === true || propertyData?.has_report === 'true';
                const propertyName = propertyData?.property_name || addressData.property_name;
                toast.success('Property created successfully!');

                if (nextStep === 'SAVE') {
                    clearPropertyFlow();
                    router.push('/dashboard');
                    return;
                }

                setHasExistingReport(reportFlag);
                setExistingPropertyName(propertyName);
                setTempPropertyId(propertyId);
                setAddressData((prev) => ({ ...prev, property_name: propertyName }));
                if (typeof window !== 'undefined') {
                    localStorage.setItem('current_property_id', propertyId);
                    localStorage.setItem('current_property_name', propertyName || '');
                    localStorage.setItem('current_property_has_report', String(reportFlag));
                }
            }

            if (nextStep === 'IMAGES') {
                setStep('PHOTOS');
            } else if (nextStep === 'PROJECT') {
                setStep('PROJECT');
            } else if (nextStep === 'SAVE') {
                clearPropertyFlow();
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('Failed to save property:', error);
            toast.error(error?.message || 'Failed to save property. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProjectCreate = (data: any) => {
        if (data.type) {
            const category = data.type as any;
            setSelectedCategory(category);
            setSelectedTypes([category]);
            setCurrentTypeIndex(0);
        }
        const projectId = data.projectData?.data?.id || data.projectData?.id || null;
        if (projectId) {
            setCurrentProjectId(projectId);
            localStorage.setItem('current_project_id', projectId);
        }
        if (data.isOwnerProjectType) {
            setIsOwnerProjectType(true);
            localStorage.setItem('is_owner_project_type', 'true');
        } else {
            setIsOwnerProjectType(false);
            localStorage.removeItem('is_owner_project_type');
        }
        setStep('INSTALLATION_FORM');
    };


    const saveInstallation = async (values: any, files: { contractorFiles: File[], ownerFiles: File[], categoryFiles?: Record<string, File> }) => {
        if (!tempPropertyId) throw new Error('No property ID');

        const type = selectedTypes[currentTypeIndex];

        const isCustomBrand = typeof values.brand === 'string' && values.brand.startsWith('__custom__:');

        const payload: any = {
            description: values.description,
            install_date: values.installDate,
            supplier: values.supplier,
            installer: values.installer,
            // manufacturer: values.manufacturer || null,
            ...(values.brand && !isCustomBrand && { brand_id: values.brand }),
            ...(isCustomBrand && { other_brand: values.brand.slice('__custom__:'.length) }),
            ...(currentProjectId && { project_id: currentProjectId }),
        };

        if (type === 'roofing' || type === 'siding') {
            payload.style = values.style;
            payload.color = values.color;
            payload.material = values.material;
            payload.type = values.type;

            if (type === 'roofing') {
                payload.impact_resistant = values.impactResistant;
                payload.class_rating = values.classRating;
            } else if (type === 'siding') {
                payload.elevation_data = values.elevationdata;
            }
        } else if (type === 'windows' || type === 'doors' || type === 'garage_doors') {
            if (type === 'windows' || type === 'doors') {
                payload.production_line = values.productionLine;
                payload.order_number = values.orderNumber;
            }
            if (type === 'garage_doors') {
                payload.windcode = values.windcode;
            }
            if (type === 'windows') {
                payload.u_factor = values.u_factor;
            }
        }

        const apiType = type === 'garage_doors' ? 'garage-doors' : type;
        const isOwnerProject = user.role === 'property_owner' ||
            isOwnerProjectType ||
            type === 'windows and doors' ||
            type === 'WINDOWS AND DOORS';
        const installationResult = isOwnerProject
            ? await postPropertyOwnerInstallations(tempPropertyId, payload)
            : await postInstallation(tempPropertyId, apiType, payload);

        if (!installationResult.success) {
            throw new Error(installationResult.message || `Failed to save ${type} installation`);
        }

        const installationId = installationResult.data?.data?.id || installationResult.data?.id;
        if (!installationId) throw new Error(`Failed to save ${type} installation — no ID returned`);

        if (files.categoryFiles && Object.keys(files.categoryFiles).length > 0) {
            const imgResult = await uploadInstallationImages(apiType, installationId, files.categoryFiles);
            if (!imgResult.success) throw new Error(imgResult.message);
        } else if (files.contractorFiles.length > 0) {
            const imgResult = await uploadInstallationImages(apiType, installationId, files.contractorFiles);
            if (!imgResult.success) throw new Error(imgResult.message);
        }

        if (files.ownerFiles.length > 0) {
            const ownerImgResult = await uploadPropertOwnerImages(apiType, installationId, files.ownerFiles);
            if (!ownerImgResult.success) throw new Error(ownerImgResult.message);
        }

        const newData = { ...installationsData, [type]: { values, files } };
        setInstallationsData(newData);
        setCurrentInstallationId(installationId);

        return { type, installationId };
    };

    const handleStepSave = async (values: any, files: { contractorFiles: File[], ownerFiles: File[], categoryFiles?: Record<string, File> }) => {
        if (!tempPropertyId) return;
        setLoading(true);
        try {
            const { type } = await saveInstallation(values, files);

            if (hasExistingReport === false) {
                try {
                    const reportRes = await postReport(tempPropertyId);
                    if (reportRes.success) {
                        setHasExistingReport(true);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('current_property_has_report', 'true');
                        }
                    } else {
                        console.error('Failed to generate report:', reportRes.message);
                    }
                } catch (reportErr) {
                    console.error('Error generating report:', reportErr);
                }
            }

            if (currentTypeIndex < selectedTypes.length - 1) {
                setCurrentTypeIndex(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toast.success(`${type} installation saved!`);
            } else {
                toast.success('Installation saved!');

                setStep('SUCCESS');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error: any) {
            console.error('Failed to save installation:', error);
            toast.error(error?.message || 'Failed to save installation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddImages = async (values: any, files: { contractorFiles: File[], ownerFiles: File[], categoryFiles?: Record<string, File> }) => {
        if (!tempPropertyId) return;
        setLoading(true);
        try {
            await saveInstallation(values, files);

            if (hasExistingReport === false) {
                try {
                    const reportRes = await postReport(tempPropertyId);
                    if (reportRes.success) {
                        setHasExistingReport(true);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('current_property_has_report', 'true');
                        }
                    } else {
                        console.error('Failed to generate report:', reportRes.message);
                    }
                } catch (reportErr) {
                    console.error('Error generating report:', reportErr);
                }
            }

            toast.success('Installation saved!');
            setStep('IMAGE_UPLOAD');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: any) {
            console.error('Failed to save installation:', error);
            toast.error(error?.message || 'Failed to save installation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const performFinalSubmission = async () => {
        toast.success('Property added successfully');
        clearPropertyFlow();
        router.replace('/dashboard');
    };

    const handleConfirmProject = async () => {
        if (!currentProjectId) {
            toast.error('Project ID not found');
            return;
        }

        setSubmitting(true);
        try {
            const result = await confirmProject(currentProjectId);
            if (!result?.success) {
                toast.error(result?.message || 'Failed to confirm project');
                return;
            }

            toast.success('Project confirmed successfully');
            clearPropertyFlow();
            if (user.role === 'admin') {
                router.replace('/dashboard');
            }
            else {
                router.replace('/my-projects');
            }
        } catch (error) {
            console.error('Error confirming project:', error);
            toast.error('Failed to confirm project');
        } finally {
            setSubmitting(false);
        }
    };

    if (isInitializingProperty && tempPropertyId) {
        return (
            <div className="bg-[#FFFFFF] md:bg-[#1F2A44] md:min-h-screen flex flex-col flex-1 items-center justify-center px-6">
                <MobileHeader variant="overlay" sticky={false} />
                <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] bg-white px-8 py-10 shadow-[0px_4px_34px_rgba(31,42,68,0.1)] text-center">
                    <div className="size-12 rounded-full border-4 border-[#1CA7A6]/20 border-t-[#1CA7A6] animate-spin" />
                    <div>
                        <h2 className="text-[20px] font-semibold text-[#1F2A44]">Loading Project Form</h2>
                        <p className="mt-2 text-sm text-[#708090]">Please wait.......</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#FFFFFF] md:bg-[#1F2A44] md:min-h-screen flex flex-col flex-1">
            <MobileHeader variant="overlay" sticky={false} />
            {step === 'ADDRESS' ? (

                <div className="relative w-full overflow-hidden h-[412px] md:h-[1080px]">
                    <img
                        src={"/assets/add-property/new-address.png"}
                        alt="Hero"
                        className="absolute inset-0 w-full h-[250px] md:h-full object-cover md:top-[-70px]"
                    />
                    <div className="absolute inset-0 h-full" />
                </div>) : null}

            <div className={`relative z-10 flex flex-col flex-1 items-center w-full ${step === 'ADDRESS' ? 'mt-[-200px] md:mt-[-462px]' : 'mt-0'}`}>
                <div className="absolute top-[-30px] md:top-[-50px] bottom-0 md:bottom-20 left-0 w-full bg-white opacity-30 rounded-t-[40px] md:rounded-t-[50px] pointer-events-none block" />
                <div className="absolute top-[-15px] md:top-[-25px] bottom-0 md:bottom-20 left-0 w-full bg-white opacity-30 rounded-t-[40px] md:rounded-t-[50px] pointer-events-none block" />

                <div className={`w-full bg-white ${step === 'ADDRESS' ? 'rounded-t-[40px] md:rounded-t-[50px]' : ''}  shadow-[0px_4px_34px_rgba(31,42,68,0.1)] md:shadow-none px-6 pt-10 pb-[100px] md:p-[80px] flex-1 md:min-h-[781px] relative mt-0`}>
                    <div className="max-w-[1170px] mx-auto relative w-full">
                        {step === 'ADDRESS' && (
                            <AddressForm
                                data={addressData}
                                onChange={setAddressData}
                                onSubmit={handleCreateProperty}
                                loading={loading}
                                states={states}
                                cities={cities}
                                propertyOwners={propertyOwners}
                                propertyTypes={propertyTypes}
                                alreadySaved={!!tempPropertyId}
                                onBack={() => router.back()}
                                hasSavedImages={hasSavedImages}
                            />
                        )}

                        {step === 'PHOTOS' && (
                            <PropertyAddressPhotos
                                address={addressData.property_name}
                                propertyId={tempPropertyId ?? ''}
                                onSave={() => setStep('PROJECT')}
                                onBack={() => setStep('ADDRESS')}
                            />
                        )}

                        {step === 'PROJECT' && (
                            <CategorySelection
                                address={addressData.property_name}
                                propertyId={tempPropertyId || ''}
                                defaultGoverningCityId={addressData.city_id}
                                cities={cities}
                                onContinue={handleProjectCreate}
                                onBack={() => initialPropertyId ? router.back() : setStep('ADDRESS')}
                            />
                        )}

                        {step === 'IMAGE_UPLOAD' && (
                            <CategoryImageUpload
                                address={addressData.property_name}
                                initialCategory={selectedCategory}
                                onSave={async (photos) => {
                                    if (!currentInstallationId) return;
                                    setLoading(true);
                                    const result = await uploadInstallationImages(selectedCategory, currentInstallationId, photos as Record<string, File>);
                                    setLoading(false);
                                    if (!result.success) {
                                        toast.error(result.message || 'Failed to upload images. Please try again.');
                                        return;
                                    }
                                    setStep('SUCCESS');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                onBack={() => setStep('INSTALLATION_FORM')}
                            />
                        )}
                        {step === 'INSTALLATION_FORM' && (
                            <InstallationForm
                                type={selectedCategory}
                                tempPropertyId={tempPropertyId}
                                address={addressData.property_name}
                                propertyName={addressData.property_name || existingPropertyName}
                                hasReport={hasExistingReport}
                                onSave={handleStepSave}
                                onAddImages={(values, files) => handleAddImages(values, files)}
                                onBack={() => {
                                    if (localStorage.getItem('current_project_id')) {
                                        clearPropertyFlow();
                                        router.back();
                                    } else {
                                        setStep('PROJECT');
                                    }
                                }}
                            />
                        )}
                        {step === 'SUCCESS' && (
                            <div className="w-full max-w-[1170px] mx-auto space-y-[20px] md:space-y-[45px] animate-in fade-in slide-in-from-bottom-4 duration-500 font-asap px-[20px] md:px-0">
                                <div className="text-center space-y-[10px] md:space-y-[15px]">
                                    {/* Check icon */}
                                    <div className="flex justify-center">
                                        <div className="size-[64px] md:size-[90px] rounded-full bg-[rgba(28,167,166,0.12)] flex items-center justify-center">
                                            <svg className="size-[32px] md:size-[46px] text-[#1CA7A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h2 className="text-[24px] md:text-[36px] font-bold text-[#1F2A44] uppercase leading-tight md:leading-[41px]">
                                        Installation Saved!
                                    </h2>
                                    <p className="text-[#708090] font-medium text-[14px] md:text-[18px] leading-relaxed max-w-[480px] mx-auto">
                                        Your installation has been saved. You can add more projects to this property, or go to Homepage.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-[12px] md:gap-[16px] pt-[10px] md:pt-[20px]">

                                    {currentProjectId && (
                                        <div>
                                            {user?.role === 'admin' ? (
                                                <p className='text-[#708090] font-medium text-[14px] md:text-[18px] leading-relaxed  mx-auto'>Note: As an administrator, you can still edit or delete this installation after confirmation.</p>
                                            ) : (
                                                <p className='text-[#708090] font-medium text-[14px] md:text-[18px] leading-relaxed  mx-auto'>Note: After Confirmation you can not edit or delete this installation.</p>
                                            )}
                                            <button
                                                onClick={() => setConfirmDialogOpen(true)}
                                                disabled={submitting}
                                                className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 disabled:opacity-60 text-white font-bold rounded-[10px] text-[18px] md:text-[24px] font-asap transition-colors flex items-center justify-center gap-3 cursor-pointer"
                                            >
                                                {submitting ? 'Confirming...' : 'Confirm'}
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            setCurrentTypeIndex(0);
                                            setStep('PROJECT');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="w-full h-[52px] md:h-[77px] border-2 border-[#1CA7A6] text-[#1CA7A6] font-bold rounded-[10px] text-[18px] md:text-[24px] font-asap hover:bg-[rgba(28,167,166,0.06)] transition-colors cursor-pointer"
                                    >
                                        + Add New Project
                                    </button>

                                    <button
                                        onClick={() => {
                                            performFinalSubmission();
                                        }}
                                        disabled={submitting}
                                        className="w-full h-[52px] md:h-[77px] bg-[#1F2A44] hover:bg-[#1a212c] disabled:opacity-60 text-white font-bold rounded-[10px] text-[18px] md:text-[24px] font-asap transition-colors flex items-center justify-center gap-3 cursor-pointer"
                                    >
                                        {submitting ? 'Submitting...' : 'Go to Homepage'}
                                    </button>
                                </div>

                                <ConfirmSubmitDialog
                                    open={confirmDialogOpen}
                                    onConfirm={() => {
                                        setConfirmDialogOpen(false);
                                        handleConfirmProject();
                                    }}
                                    onCancel={() => setConfirmDialogOpen(false)}
                                    title="Confirm Project"
                                    description={user?.role === 'admin'
                                        ? "Once confirmed, this project will be finalized. As an administrator, you will still be able to make changes after submission."
                                        : "Once confirmed, this project cannot be edited by you. Only an admin will be able to make changes after submission."}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewPropertyPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <NewPropertyForm />
        </Suspense>
    );
}