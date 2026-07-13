'use client';

import { useEffect, useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, ShieldCheck, Mail, User, Phone, Save, MapPin, Building2, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CitySelect } from '@/components/city-zip-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Content } from '@/components/layouts/crm/components/content';
import { getUserById, editUserAdmin, getStates, getServiceProvided } from '@/lib/actions';
import { ScreenLoader } from '@/components/common/screen-loader';
import { toPascalCase } from '@/lib/utils';

// ─── Role groups ──────────────────────────────────────────────────────────────
const PROPERTY_ROLES = ['PROPERTY_OWNER', 'REALTOR'];
const CONTRACTOR_ROLES = ['CONTRACTOR', 'MANUFACTURER'];
const INSURANCE_ROLES = ['INSURANCE_COMPANY'];
const INSPECTOR_ROLES = ['CITY_INSPECTOR'];

function getRoleGroup(roleName: string): 'property' | 'contractor' | 'insurance' | 'inspector' | null {
    const roleUpper = roleName?.toUpperCase() || '';
    if (PROPERTY_ROLES.includes(roleUpper)) return 'property';
    if (CONTRACTOR_ROLES.includes(roleUpper)) return 'contractor';
    if (INSURANCE_ROLES.includes(roleUpper)) return 'insurance';
    if (INSPECTOR_ROLES.includes(roleUpper)) return 'inspector';
    return null;
}

const phoneRegex = /^\d{10}$/;

const userSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Please select a user role'),
    sub_account: z.boolean().optional(),
    displayName: z.string().optional(),
    phoneNumber: z.string().max(10, 'Phone number must be 10 digits').regex(/^\d*$/, 'Numbers only').optional(),
    profileImageUrl: z.string().optional(),
    address: z.string().optional().or(z.literal('')),

    // Property Owner / Realtor fields
    propertyAddress: z.string().optional().or(z.literal('')),
    ownerDateStart: z.string().optional().or(z.literal('')),
    ownerDateEnd: z.string().optional().or(z.literal('')),
    mobilePhone: z.string().optional().or(z.literal('')),
    state_id: z.string().optional().or(z.literal('')),
    city_id: z.string().optional().or(z.literal('')),
    zip: z.string().optional().or(z.literal('')),

    // Contractor / Manufacturer fields
    companyAddress: z.string().optional().or(z.literal('')),
    company_name: z.string().optional().or(z.literal('')),
    companyEmail: z.string().optional().or(z.literal('')),
    websiteUrl: z.string().optional().or(z.literal('')),
    companyPhone: z.string().optional().or(z.literal('')),
    licenseNumber: z.string().optional().or(z.literal('')),
    serviceTypes: z.array(z.string()).optional(),

    // Insurance / Inspector fields
    title: z.string().optional().or(z.literal('')),
    cityOfficial: z.string().optional().or(z.literal('')),
    cityAddress: z.string().optional().or(z.literal('')),
    cityPhone: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.sub_account) return;
    const role = data.role?.toUpperCase();
    if (role === 'PROPERTY_OWNER' || role === 'REALTOR') {
        if (!data.propertyAddress?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Property address is required', path: ['propertyAddress'] });
        }
        if (!data.ownerDateStart?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date is required', path: ['ownerDateStart'] });
        }
        if (!data.mobilePhone || !phoneRegex.test(data.mobilePhone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mobile phone must be exactly 10 digits', path: ['mobilePhone'] });
        }
        if (!data.state_id?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'State is required', path: ['state_id'] });
        }
        if (!data.city_id?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['city_id'] });
        }
        if (!data.zip?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Zip code is required', path: ['zip'] });
        }
    } else if (role === 'CONTRACTOR' || role === 'MANUFACTURER') {
        if (!data.companyAddress?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company address is required', path: ['companyAddress'] });
        }
        if (!data.websiteUrl?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Website URL is required', path: ['websiteUrl'] });
        }
        if (!data.city_id?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['city_id'] });
        }
        if (!data.mobilePhone || !phoneRegex.test(data.mobilePhone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mobile phone must be exactly 10 digits', path: ['mobilePhone'] });
        }
        if (!data.companyPhone || !phoneRegex.test(data.companyPhone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company phone must be exactly 10 digits', path: ['companyPhone'] });
        }
        if (!data.licenseNumber?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'License number is required', path: ['licenseNumber'] });
        }
        if (!data.serviceTypes || data.serviceTypes.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one service', path: ['serviceTypes'] });
        }
    } else if (role === 'INSURANCE_COMPANY') {
        if (!data.company_name?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company name is required', path: ['company_name'] });
        }
        if (!data.companyAddress?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company address is required', path: ['companyAddress'] });
        }
        if (!data.mobilePhone || !phoneRegex.test(data.mobilePhone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mobile phone must be exactly 10 digits', path: ['mobilePhone'] });
        }
        if (!data.companyPhone || !phoneRegex.test(data.companyPhone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company phone must be exactly 10 digits', path: ['companyPhone'] });
        }
        if (!data.title?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Title is required', path: ['title'] });
        }
    } else if (role === 'CITY_INSPECTOR') {
        if (!data.city_id?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['city_id'] });
        }
        if (!data.cityOfficial?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City official name is required', path: ['cityOfficial'] });
        }
        if (!data.cityAddress?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City address is required', path: ['cityAddress'] });
        }
        if (!data.cityPhone || !phoneRegex.test(data.cityPhone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City phone must be exactly 10 digits', path: ['cityPhone'] });
        }
        if (!data.title?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Title is required', path: ['title'] });
        }
    }
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [userDataRaw, setUserDataRaw] = useState<any>(null);
    const [states, setStates] = useState<{ id: string; name: string }[]>([]);
    const [services, setServices] = useState<{ id: string; service_name: string }[]>([]);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            role: '',
            sub_account: false,
            displayName: '',
            phoneNumber: '',
            profileImageUrl: '',
            address: '',
            propertyAddress: '',
            ownerDateStart: '',
            ownerDateEnd: '',
            mobilePhone: '',
            state_id: '',
            city_id: '',
            zip: '',
            companyAddress: '',
            company_name: '',
            companyEmail: '',
            websiteUrl: '',
            companyPhone: '',
            licenseNumber: '',
            serviceTypes: [],
            title: '',
            cityOfficial: '',
            cityAddress: '',
            cityPhone: '',
        }
    });

    useEffect(() => {
        getStates(1, 1000)
            .then((res) => {
                const raw: any[] = Array.isArray(res) ? res : res?.data || [];
                setStates(raw.map((s: any) => ({ id: String(s.id), name: s.state_name || s.name })));
            })
            .catch(() => { });

        getServiceProvided()
            .then(r => setServices(r.data || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await getUserById(id);
                console.log(userData)
                const userInfo = userData;
                if (!userInfo) {
                    throw new Error('User data not found');
                }

                setUserDataRaw(userInfo);

                const profile = userInfo?.profile || {};
                const formDetails = userInfo?.form_details || userInfo?.formDetails || {};

                const formData = {
                    firstName: userInfo?.first_name || '',
                    lastName: userInfo?.last_name || '',
                    email: userInfo?.email || '',
                    role: userInfo?.role || '',
                    sub_account: userInfo?.sub_account || false,
                    displayName: profile?.display_name || '',
                    phoneNumber: profile?.phone_number || '',
                    profileImageUrl: profile?.profile_image_url || '',
                    address: profile?.address || '',

                    // Extra fields:
                    propertyAddress: formDetails?.propertyAddress || '',
                    ownerDateStart: formDetails?.ownerDateStart ? formDetails.ownerDateStart.split('T')[0] : '',
                    ownerDateEnd: formDetails?.ownerDateEnd ? formDetails.ownerDateEnd.split('T')[0] : '',
                    mobilePhone: formDetails?.mobilePhone || '',
                    state_id: userInfo?.state_id ? String(userInfo.state_id) : (formDetails?.state_id ? String(formDetails.state_id) : ''),
                    city_id: userInfo?.city_id ? String(userInfo.city_id) : (formDetails?.city_id ? String(formDetails.city_id) : ''),
                    zip: userInfo?.zip || formDetails?.zip || '',

                    companyAddress: formDetails?.companyAddress || '',
                    company_name: userInfo?.company_name || formDetails?.company_name || '',
                    companyEmail: formDetails?.companyEmail || '',
                    websiteUrl: formDetails?.websiteUrl || '',
                    companyPhone: formDetails?.companyPhone || '',
                    licenseNumber: formDetails?.licenseNumber || '',
                    serviceTypes: formDetails?.serviceTypes || [],

                    title: formDetails?.title || '',
                    cityOfficial: formDetails?.cityOfficial || '',
                    cityAddress: formDetails?.cityAddress || '',
                    cityPhone: formDetails?.cityPhone || '',
                };

                form.reset(formData);
            } catch (error: any) {
                console.error('Error fetching user data:', error);
                toast.error(error.message || 'Failed to load user data');
                router.push('/admin/users');
            } finally {
                setPageLoading(false);
            }
        };

        fetchUserData();
    }, [id, form, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (values: UserFormValues) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('first_name', values.firstName);
        formData.append('last_name', values.lastName);
        formData.append('role', values.role);
        if (values.sub_account !== undefined) formData.append('sub_account', String(values.sub_account));
        if (values.displayName) formData.append('display_name', values.displayName);
        if (values.phoneNumber) formData.append('phone_number', values.phoneNumber);

        const role = values.role;
        const group = getRoleGroup(role);

        if (group === 'property') {
            if (values.propertyAddress) formData.append('propertyAddress', values.propertyAddress);
            if (values.ownerDateStart) formData.append('ownerDateStart', values.ownerDateStart);
            if (values.ownerDateEnd) formData.append('ownerDateEnd', values.ownerDateEnd);
            if (values.mobilePhone) formData.append('mobilePhone', values.mobilePhone);
            if (values.state_id) formData.append('state_id', values.state_id);
            if (values.city_id) formData.append('city_id', values.city_id);
            if (values.zip) formData.append('zip', values.zip);
        } else if (group === 'contractor') {
            if (values.companyAddress) formData.append('companyAddress', values.companyAddress);
            if (values.company_name) formData.append('company_name', values.company_name);
            if (values.companyEmail) formData.append('companyEmail', values.companyEmail);
            if (values.websiteUrl) formData.append('websiteUrl', values.websiteUrl);
            if (values.city_id) formData.append('city_id', values.city_id);
            if (values.mobilePhone) formData.append('mobilePhone', values.mobilePhone);
            if (values.companyPhone) formData.append('companyPhone', values.companyPhone);
            if (values.licenseNumber) formData.append('licenseNumber', values.licenseNumber);
            if (values.serviceTypes && values.serviceTypes.length > 0) {
                formData.append('serviceTypes', values.serviceTypes.join(','));
            }
        } else if (group === 'insurance') {
            if (values.company_name) formData.append('company_name', values.company_name);
            if (values.companyAddress) formData.append('companyAddress', values.companyAddress);
            if (values.websiteUrl) formData.append('websiteUrl', values.websiteUrl);
            if (values.mobilePhone) formData.append('mobilePhone', values.mobilePhone);
            if (values.companyPhone) formData.append('companyPhone', values.companyPhone);
            if (values.title) formData.append('title', values.title);
        } else if (group === 'inspector') {
            if (values.city_id) formData.append('city_id', values.city_id);
            if (values.cityOfficial) formData.append('cityOfficial', values.cityOfficial);
            if (values.cityAddress) formData.append('cityAddress', values.cityAddress);
            if (values.cityPhone) formData.append('cityPhone', values.cityPhone);
            if (values.title) formData.append('title', values.title);
        } else {
            // Default generic fields if no specific group matches
            if (values.company_name) formData.append('company_name', values.company_name);
            if (values.address) formData.append('address', values.address);
            if (values.city_id) formData.append('city_id', values.city_id);
        }

        if (selectedImage) formData.append('image', selectedImage);

        const result = await editUserAdmin(id, formData);
        setLoading(false);
        if (!result.success) {
            toast.error(result.message || 'Failed to update user');
            return;
        }
        toast.success('User updated successfully!');
        router.push('/admin/users');
    };

    if (pageLoading) {
        return <ScreenLoader />;
    }

    return (
        <>
            <Content className="block py-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-border/60 shadow-2xl shadow-black/5 overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 p-5 sm:p-8">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="size-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">Account Details</CardTitle>
                                    <CardDescription>
                                        Update user information and access permissions.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="flex flex-col items-center mb-10 group">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-4 border-background">
                                        <AvatarImage src={previewUrl || (userDataRaw?.profile?.profile_image_url ? `${process.env.NEXT_PUBLIC_BASE_URL}${userDataRaw.profile.profile_image_url}` : '')} className="object-cover" />
                                        <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                                            {userDataRaw?.first_name?.substring(0, 1).toUpperCase()}{userDataRaw?.last_name?.substring(0, 1).toUpperCase() || ''}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('profile-image-input')?.click()}
                                        className="absolute bottom-1 right-1 size-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all cursor-pointer ring-4 ring-background"
                                    >
                                        <Camera className="size-5" />
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    id="profile-image-input"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <div className="mt-4 text-center">
                                    <h3 className="font-semibold text-lg">{form.watch('firstName')} {form.watch('lastName')}</h3>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-bold bg-muted px-3 py-1 rounded-full">{form.watch('role')?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="First Name"
                                                            className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Last Name"
                                                            className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="Email"
                                                            className="h-11 bg-muted/50 focus:bg-muted/50 transition-all cursor-not-allowed"
                                                            disabled
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11 bg-muted/20 disabled:cursor-not-allowed focus:bg-background transition-all">
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="PROPERTY_OWNER" className='cursor-pointer'>Property Owner</SelectItem>
                                                            <SelectItem value="REALTOR" className='cursor-pointer'>Realtor</SelectItem>
                                                            <SelectItem value="CONTRACTOR" className='cursor-pointer'>Contractor</SelectItem>
                                                            <SelectItem value="MANUFACTURER" className='cursor-pointer'>Manufacturer</SelectItem>
                                                            <SelectItem value="CITY_INSPECTOR" className='cursor-pointer'>City Inspector</SelectItem>
                                                            <SelectItem value="INSURANCE_COMPANY" className='cursor-pointer'>Insurance Company</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="displayName"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Display Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Display Name"
                                                            className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Dynamic Role-specific Fields */}
                                        {(() => {
                                            const role = form.watch('role');
                                            const group = getRoleGroup(role);
                                            if (!group) return null;

                                            const isSubUser = form.watch('sub_account') === true;
                                            if (isSubUser) return null;

                                            return (
                                                <div className="md:col-span-2 pt-6 mt-6 border-t border-border/60">
                                                    <h3 className="text-base font-bold text-[#1F2A44] mb-4">
                                                        {role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Information
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {group === 'property' && (
                                                            <>
                                                                <FormField control={form.control} name="propertyAddress" render={({ field }) => (
                                                                    <FormItem className="md:col-span-2"><FormLabel>Property Address</FormLabel>
                                                                        <FormControl><Input placeholder="Property Address" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="mobilePhone" render={({ field }) => (
                                                                    <FormItem><FormLabel>Phone (Direct)</FormLabel>
                                                                        <FormControl><Input placeholder="Mobile Phone (10 digits)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                            maxLength={10}
                                                                            inputMode="numeric"
                                                                            onChange={(e) => {
                                                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                field.onChange(digits);
                                                                            }}
                                                                        /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="state_id" render={({ field }) => (
                                                                    <FormItem><FormLabel>State</FormLabel>
                                                                        <Select value={field.value} onValueChange={(val) => {
                                                                            field.onChange(val);
                                                                            form.setValue('city_id', '');
                                                                        }}>
                                                                            <FormControl>
                                                                                <SelectTrigger className="h-11 bg-muted/20 focus:bg-background transition-all">
                                                                                    <SelectValue placeholder="Select a state" />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                {states.map(s => (
                                                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <CitySelect
                                                                    name="city_id"
                                                                    label="City"
                                                                    valueType="id"
                                                                    placeholder="Select a city"
                                                                    stateValue={form.watch('state_id')}
                                                                    syncState={true}
                                                                />
                                                                <FormField control={form.control} name="zip" render={({ field }) => (
                                                                    <FormItem><FormLabel>Zip Code</FormLabel>
                                                                        <FormControl><Input placeholder="Zip Code" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" inputMode="numeric" maxLength={10} /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="ownerDateStart" render={({ field }) => (
                                                                    <FormItem><FormLabel>Owner Start Date</FormLabel>
                                                                        <FormControl><Input type="date" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="ownerDateEnd" render={({ field }) => (
                                                                    <FormItem><FormLabel>Owner End Date</FormLabel>
                                                                        <FormControl><Input type="date" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                            </>
                                                        )}

                                                        {group === 'contractor' && (
                                                            <>
                                                                <FormField control={form.control} name="company_name" render={({ field }) => (
                                                                    <FormItem><FormLabel>Company Name</FormLabel>
                                                                        <FormControl><Input placeholder="Company Name (optional)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="companyEmail" render={({ field }) => (
                                                                    <FormItem><FormLabel>Company Email</FormLabel>
                                                                        <FormControl><Input placeholder="Email (optional)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="companyAddress" render={({ field }) => (
                                                                    <FormItem className="md:col-span-2"><FormLabel>Company Address</FormLabel>
                                                                        <FormControl><Input placeholder="Company Address" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                                                                    <FormItem><FormLabel>Website URL</FormLabel>
                                                                        <FormControl><Input placeholder="https://..." {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="mobilePhone" render={({ field }) => (
                                                                    <FormItem><FormLabel>Mobile Phone</FormLabel>
                                                                        <FormControl><Input placeholder="Mobile (10 digits)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                            maxLength={10}
                                                                            inputMode="numeric"
                                                                            onChange={(e) => {
                                                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                field.onChange(digits);
                                                                            }}
                                                                        /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="companyPhone" render={({ field }) => (
                                                                    <FormItem><FormLabel>Company Phone</FormLabel>
                                                                        <FormControl><Input placeholder="Company (10 digits)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                            maxLength={10}
                                                                            inputMode="numeric"
                                                                            onChange={(e) => {
                                                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                field.onChange(digits);
                                                                            }}
                                                                        /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <CitySelect
                                                                    name="city_id"
                                                                    label="City"
                                                                    valueType="id"
                                                                    placeholder="Select a city"
                                                                />
                                                                <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                                                                    <FormItem><FormLabel>License Number</FormLabel>
                                                                        <FormControl><Input placeholder="License No." {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="serviceTypes" render={() => (
                                                                    <FormItem className="md:col-span-2">
                                                                        <FormLabel>Services Provided</FormLabel>
                                                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                                                            {services.map(service => (
                                                                                <FormField key={service.id} control={form.control} name="serviceTypes"
                                                                                    render={({ field }) => {
                                                                                        const checked = field.value?.includes(service.id) ?? false;
                                                                                        return (
                                                                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                                                                <FormControl>
                                                                                                    <Checkbox checked={checked}
                                                                                                        onCheckedChange={val => {
                                                                                                            const cur = field.value ?? [];
                                                                                                            field.onChange(val ? [...cur, service.id] : cur.filter(v => v !== service.id));
                                                                                                        }}
                                                                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <span className="text-sm font-medium">{toPascalCase(service.service_name)}</span>
                                                                                            </FormItem>
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                            </>
                                                        )}

                                                        {group === 'insurance' && (
                                                            <>
                                                                <FormField control={form.control} name="company_name" render={({ field }) => (
                                                                    <FormItem><FormLabel>Company Name</FormLabel>
                                                                        <FormControl><Input placeholder="Company Name" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="title" render={({ field }) => (
                                                                    <FormItem><FormLabel>Title</FormLabel>
                                                                        <FormControl><Input placeholder="Title" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="companyAddress" render={({ field }) => (
                                                                    <FormItem className="md:col-span-2"><FormLabel>Company Address</FormLabel>
                                                                        <FormControl><Input placeholder="Company Address" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                                                                    <FormItem><FormLabel>Website URL</FormLabel>
                                                                        <FormControl><Input placeholder="https://..." {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="mobilePhone" render={({ field }) => (
                                                                    <FormItem><FormLabel>Mobile Phone</FormLabel>
                                                                        <FormControl><Input placeholder="Mobile (10 digits)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                            maxLength={10}
                                                                            inputMode="numeric"
                                                                            onChange={(e) => {
                                                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                field.onChange(digits);
                                                                            }}
                                                                        /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="companyPhone" render={({ field }) => (
                                                                    <FormItem><FormLabel>Company Phone</FormLabel>
                                                                        <FormControl><Input placeholder="Company (10 digits)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                            maxLength={10}
                                                                            inputMode="numeric"
                                                                            onChange={(e) => {
                                                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                field.onChange(digits);
                                                                            }}
                                                                        /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                            </>
                                                        )}

                                                        {group === 'inspector' && (
                                                            <>
                                                                <CitySelect
                                                                    name="city_id"
                                                                    label="City"
                                                                    valueType="id"
                                                                    placeholder="Select a city"
                                                                />
                                                                <FormField control={form.control} name="cityOfficial" render={({ field }) => (
                                                                    <FormItem><FormLabel>City Official Name</FormLabel>
                                                                        <FormControl><Input placeholder="City Official" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="title" render={({ field }) => (
                                                                    <FormItem><FormLabel>Title</FormLabel>
                                                                        <FormControl><Input placeholder="Title" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="cityAddress" render={({ field }) => (
                                                                    <FormItem className="md:col-span-2"><FormLabel>City Address</FormLabel>
                                                                        <FormControl><Input placeholder="City Address" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField control={form.control} name="cityPhone" render={({ field }) => (
                                                                    <FormItem><FormLabel>City Phone</FormLabel>
                                                                        <FormControl><Input placeholder="City Phone (10 digits)" {...field} className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                            maxLength={10}
                                                                            inputMode="numeric"
                                                                            onChange={(e) => {
                                                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                field.onChange(digits);
                                                                            }}
                                                                        /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Generic details if NO specific group is chosen */}
                                        {!getRoleGroup(form.watch('role')) && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="phoneNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone Number</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Phone Number"
                                                                    className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                    maxLength={10}
                                                                    onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault(); }}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="address"
                                                    render={({ field }) => (
                                                        <FormItem className="md:col-span-2">
                                                            <FormLabel>Address</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Address"
                                                                    className="h-11 bg-muted/20 focus:bg-background transition-all"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Updating User...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-5 w-5" />
                                                    Update User Account
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.back()}
                                            className="h-12 px-8 font-semibold"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </Content>
        </>
    );
}

