'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { Content } from '@/components/layouts/crm/components/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { getUserProfile, updateUserProfile, getAuditLogs, signout, purchaseExtraUsers, getStates, getServiceProvided, getCities, getReportUsage } from '@/lib/actions';
import {
    Camera, Sparkles, Zap, Lock, X, UserRoundPen, LogOut, History, ArrowRight, Building2,
} from 'lucide-react';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChangePasswordForm } from '@/components/forms/change-password-form';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/components/providers/user-provider';
import { CitySelect } from '@/components/city-zip-selector';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn, toPascalCase } from '@/lib/utils';

const profileSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.string().optional(),
    full_name: z.string()
        .min(3, 'Full name must be at least 3 characters')
        .regex(/^[^\s]+(\s[^\s]+)?$/, 'Please enter and at most one space')
        .optional().or(z.literal('')),
    profile_image_url: z.string().nullable().optional(),
    image: z.any().optional(),
    companyAddress: z.string().optional().or(z.literal('')),
    websiteUrl: z.string().optional().or(z.literal('')),
    licenseNumber: z.string().optional().or(z.literal('')),
    mobilePhone: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits').optional().or(z.literal('')),
    companyPhone: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits').optional().or(z.literal('')),
    city_id: z.string().optional().or(z.literal('')),
    serviceTypes: z.array(z.string()).optional(),
    propertyAddress: z.string().optional().or(z.literal('')),
    ownerDateStart: z.string().optional().or(z.literal('')),
    ownerDateEnd: z.string().optional().or(z.literal('')),
    state_id: z.string().optional().or(z.literal('')),
    zip: z.string().optional().or(z.literal('')),
    company_name: z.string().optional().or(z.literal('')),
    companyEmail: z.string().optional().or(z.literal('')),
    title: z.string().optional().or(z.literal('')),
    cityOfficial: z.string().optional().or(z.literal('')),
    cityAddress: z.string().optional().or(z.literal('')),
    cityPhone: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    const role = (data.role || '').toLowerCase();
    if (role === 'insurance_company') {
        if (!data.company_name?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company Name is required', path: ['company_name'] });
        }
        if (!data.companyAddress?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company Address is required', path: ['companyAddress'] });
        }
        if (!data.mobilePhone) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mobile Phone is required', path: ['mobilePhone'] });
        }
        if (!data.companyPhone) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company Phone is required', path: ['companyPhone'] });
        }
        if (!data.title?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Title is required', path: ['title'] });
        }
    } else if (role === 'city_inspector') {

        if (!data.cityOfficial?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City Official is required', path: ['cityOfficial'] });
        }
        if (!data.cityAddress?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City Address is required', path: ['cityAddress'] });
        }
        if (!data.cityPhone) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City Phone is required', path: ['cityPhone'] });
        }
        if (!data.title?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Title is required', path: ['title'] });
        }
    }
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileData {
    user_id: string;
    email: string;
    role?: string;
    roleEntity?: { role_name: string };
    sub_account?: boolean;
    first_name: string | null;
    last_name: string | null;
    // phone_number: string | null;
    company_name: string | null;
    companyEmail: string | null;
    profile_image_url: string | null;
    created_at: string;
    updated_at: string;
    // Role-specific extra fields
    companyAddress?: string | null;
    websiteUrl?: string | null;
    licenseNumber?: string | null;
    mobilePhone?: string | null;
    companyPhone?: string | null;
    city_id?: string | null;
    serviceTypes?: string[];
    propertyAddress?: string | null;
    ownerDateStart?: string | null;
    ownerDateEnd?: string | null;
    state_id?: string | null;
    zip?: string | null;
    title?: string | null;
    cityOfficial?: string | null;
    cityAddress?: string | null;
    cityPhone?: string | null;
    current_subscription?: {
        status: string;
        plan: {
            id: string;
            name: string;
            description: string;
            level?: string;
            monthlyAmount?: string;
            yearlyAmount?: string;
        };
    } | null;
}

const LOGS_ROUTE: Record<string, string> = {
    admin: '/admin/admin-logs',
    city_inspector: '/city-logs',
    insurance_company: '/company-logs',
};

const actionLabels: Record<string, string> = {
    LOGIN: 'Logged In', LOGOUT: 'Logged Out',
    PASSWORD_CHANGE: 'Password Changed', PASSWORD_RESET: 'Password Reset',
    PASSWORD_FORGOT: 'Forgot Password', USER_CREATE: 'User Created',
    CREATE: 'Self Registered', UPDATE: 'Updated',
};

export default function UserProfile() {
    const [user, setUser] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const router = useRouter();
    const { user: contextUser, setUser: setContextUser } = useUser();
    const [purchaseUsersOpen, setPurchaseUsersOpen] = useState(false);
    const [purchaseUserCount, setPurchaseUserCount] = useState(1);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [reportUsage, setReportUsage] = useState<any>(null);
    const [reportUsageLoading, setReportUsageLoading] = useState(false);

    const [services, setServices] = useState<{ id: string; service_name: string }[]>([]);
    const [states, setStates] = useState<{ id: string; name: string }[]>([]);
    const [selectedStateId, setSelectedStateId] = useState('');
    const [selectedCityName, setSelectedCityName] = useState('');


    const role = (user?.role ?? user?.roleEntity?.role_name ?? '').toLowerCase();
    const isSubAccount = contextUser?.user?.sub_account === true || contextUser?.sub_account === true || user?.sub_account === true;

    const hasLogsCard = !isSubAccount && (role === 'admin' || role === 'city_inspector' || role === 'insurance_company');
    const showMembership = !isSubAccount && (
        role === 'contractor' || role === 'insurance_company' || role === 'property_owner'
    );
    const logsRoute = LOGS_ROUTE[role] ?? '/admin/admin-logs';

    const level = (user as any)?.level;
    const subscriptionLevel = (user as any)?.current_subscription?.status === 'ACTIVE'
        ? (user as any)?.current_subscription?.plan?.level
        : undefined;
    const effectivelevel = level || subscriptionLevel;
    const showAddContractorProfile =
        role === 'contractor' &&
        (user as any)?.is_directory === false &&
        (effectivelevel === 'GOLD' || effectivelevel === 'SILVER');

    const showPurchasebtn = role === 'contractor' && !isSubAccount;
    const handleAddContractorProfile = () => {
        localStorage.setItem('pending_level', effectivelevel);
        router.push('/profile-setup');
    };

    const handleSignout = async () => {

        await signout();
        router.replace(process.env.NEXT_PUBLIC_LOGIN_URL || '/login');
    };

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            email: '', role: '', full_name: '', profile_image_url: null,
            companyAddress: '', websiteUrl: '', licenseNumber: '', mobilePhone: '', companyPhone: '',
            city_id: '', serviceTypes: [],
            propertyAddress: '', ownerDateStart: '', ownerDateEnd: '', state_id: '', zip: '',
            company_name: '', title: '', cityOfficial: '', cityAddress: '', cityPhone: '',
        },
    });

    const handlePurchaseUsers = async () => {
        if (purchaseUserCount < 1) return;
        setPurchaseLoading(true);
        const result = await purchaseExtraUsers(purchaseUserCount);
        setPurchaseLoading(false);
        if (!result.success) {
            toast.error(result.message || 'Failed to initiate purchase');
            return;
        }
        const url = result.data?.data?.checkout_session?.url ?? result.data?.url;
        if (url) {
            localStorage.setItem('pending_report_type', 'users');
            window.location.href = url;
        } else {
            toast.success('Users purchased successfully!');
            setPurchaseUsersOpen(false);
            setPurchaseUserCount(1);
        }
    };



    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await getUserProfile();

                setUser({
                    ...data,
                    companyAddress: data.form_details?.companyAddress ?? null,
                    websiteUrl: data.form_details?.websiteUrl ?? null,
                    licenseNumber: data.form_details?.licenseNumber ?? null,
                    mobilePhone: data.form_details?.mobilePhone ?? null,
                    companyPhone: data.form_details?.companyPhone ?? null,
                    city_id: data.user?.city_id ?? data.form_details?.city_id ?? null,
                    serviceTypes: data.form_details?.serviceTypes || [],
                    propertyAddress: data.form_details?.propertyAddress ?? null,
                    ownerDateStart: data.form_details?.ownerDateStart ?? null,
                    ownerDateEnd: data.form_details?.ownerDateEnd ?? null,
                    state_id: data.user?.state_id ?? null,
                    zip: data.user?.zip ?? null,
                    title: data.form_details?.title ?? null,
                    cityOfficial: data.form_details?.cityOfficial ?? null,
                    cityAddress: data.form_details?.cityAddress ?? null,
                    cityPhone: data.form_details?.cityPhone ?? null,
                    company_name: data.company_name ?? data.form_details?.company_name ?? null,
                });

                const cityId = data.form_details?.city_id || data.user?.city_id;
                if (cityId) {
                    try {
                        const cityRes = await getCities(undefined, undefined, cityId);
                        const cityData = cityRes?.data?.[0] ?? cityRes?.data ?? cityRes;
                        const resolvedName = Array.isArray(cityData) ? cityData[0]?.name : cityData?.name;
                        if (resolvedName) setSelectedCityName(resolvedName);
                    } catch {
                        console.log("error while fetching city name");
                    }
                }

                const stateId = data.user?.state_id ? String(data.user.state_id) : '';
                setSelectedStateId(stateId);
                form.reset({
                    full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                    profile_image_url: data.profile_image_url || null,
                    role: data.role ?? data.roleEntity?.role_name ?? '',
                    email: data.email || '',
                    // Contractor fields
                    companyAddress: data.form_details?.companyAddress || '',
                    websiteUrl: data.form_details?.websiteUrl || '',
                    licenseNumber: data.form_details?.licenseNumber || '',
                    mobilePhone: data.form_details?.mobilePhone || '',
                    companyPhone: data.form_details?.companyPhone || '',
                    city_id: data.form_details?.city_id ? String(data.form_details.city_id) : (data.user?.city_id ? String(data.user.city_id) : ''),
                    serviceTypes: data.form_details?.serviceTypes || [],
                    // Property fields
                    propertyAddress: data.form_details?.propertyAddress || '',
                    ownerDateStart: data.form_details?.ownerDateStart ? data.form_details.ownerDateStart.split('T')[0] : '',
                    ownerDateEnd: data.form_details?.ownerDateEnd ? data.form_details.ownerDateEnd.split('T')[0] : '',
                    state_id: stateId,
                    zip: data.user?.zip || '',
                    title: data.form_details?.title || '',
                    cityOfficial: data.form_details?.cityOfficial || '',
                    cityAddress: data.form_details?.cityAddress || '',
                    cityPhone: data.form_details?.cityPhone || '',
                    company_name: data.company_name || data.form_details?.company_name || '',
                });
            } catch (error: any) {
                toast.error(error.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [form]);

    // Load services for contractor role
    useEffect(() => {
        if (!role) return;
        if (role === 'contractor' || role === 'manufacturer') {
            getServiceProvided()
                .then((res) => setServices(Array.isArray(res?.data) ? res.data : []))
                .catch(() => { });
        }
        if (role === 'property_owner' || role === 'realtor') {
            getStates(1, 1000)
                .then((res) => {
                    const raw: any[] = Array.isArray(res) ? res : res?.data || [];
                    setStates(raw.map((s: any) => ({ id: String(s.id), name: s.state_name || s.name })));
                })
                .catch(() => { });
        }
    }, [role]);

    useEffect(() => {
        if (!hasLogsCard) return;
        setLogsLoading(true);
        getAuditLogs(1, 6)
            .then((res) => setRecentLogs(res?.data || []))
            .catch(() => { })
            .finally(() => setLogsLoading(false));
    }, [hasLogsCard]);

    useEffect(() => {
        if (role === 'insurance_company' || role === 'contractor') {
            setReportUsageLoading(true);
            getReportUsage()
                .then((res) => setReportUsage(res?.data || res))
                .catch(() => { })
                .finally(() => setReportUsageLoading(false));
        }
    }, [role]);

    const calculateIntegrity = () => {
        if (!user) return 0;
        let score = 50;
        if (user.first_name && user.last_name) score += 10;
        if (user.profile_image_url || previewUrl) score += 20;
        // if (user.phone_number && user.phone_number.length >= 10) score += 20;
        return score;
    };

    const integrityScore = calculateIntegrity();

    const getIntegrityStatus = (score: number) => {
        if (score >= 90) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-500' };
        if (score >= 75) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500' };
        if (score >= 60) return { label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-500' };
        return { label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' };
    };

    const integrityStatus = getIntegrityStatus(integrityScore);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const ROLE_ALLOWED_KEYS: Record<string, string[]> = {
        contractor: ['company_name', 'companyAddress', 'websiteUrl', 'licenseNumber', 'mobilePhone', 'companyPhone', 'city_id', 'serviceTypes'],
        manufacturer: ['company_name', 'companyAddress', 'websiteUrl', 'licenseNumber', 'mobilePhone', 'companyPhone', 'city_id', 'serviceTypes'],
        insurance_company: ['company_name', 'companyAddress', 'mobilePhone', 'companyPhone', 'title'],
        city_inspector: ['cityOfficial', 'cityAddress', 'cityPhone', 'title', 'city_id'],
        property_owner: ['propertyAddress', 'ownerDateStart', 'ownerDateEnd', 'state_id', 'zip'],
        realtor: ['company_name', 'companyAddress', 'websiteUrl', 'licenseNumber', 'mobilePhone', 'companyPhone', 'propertyAddress', 'state_id', 'zip'],
        admin: ['mobilePhone'],
    };

    async function onSubmit(data: ProfileFormValues) {
        const formData = new FormData();
        const userRole = (user?.role || data.role || '').toLowerCase();
        const allowedRoleKeys = ROLE_ALLOWED_KEYS[userRole];

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'full_name' && typeof value === 'string') {
                const parts = value.trim().split(' ');
                formData.append('first_name', parts[0] || '');
                formData.append('last_name', parts.slice(1).join(' ') || '');
            } else if (
                key !== 'image' &&
                key !== 'profile_image_url' &&
                key !== 'email' &&
                key !== 'role' &&
                key !== 'serviceTypes' &&
                value !== null &&
                value !== undefined
            ) {
                if (allowedRoleKeys && !allowedRoleKeys.includes(key)) {
                    return;
                }
                if ((key.endsWith('_id') || key.endsWith('Id')) && value === '') {
                    return;
                }
                formData.append(key, value as string);
            }
        });

        if (Array.isArray(data.serviceTypes) && (!allowedRoleKeys || allowedRoleKeys.includes('serviceTypes'))) {
            formData.append('serviceTypes', data.serviceTypes.join(','));
        }
        if (selectedImage) formData.append('image', selectedImage);


        console.log('FormData submitting:', Object.fromEntries(formData.entries()));



        const result = await updateUserProfile(formData);
        if (!result.success) {
            toast.error(result.message || 'Failed to update profile.');
            return;
        }
        setIsEditing(false);
        const updatedData = result.data;
        const updatedCompany = updatedData.company_name ?? updatedData.form_details?.company_name ?? null;
        setUser({
            ...updatedData,
            companyAddress: updatedData.form_details?.companyAddress ?? null,
            websiteUrl: updatedData.form_details?.websiteUrl ?? null,
            licenseNumber: updatedData.form_details?.licenseNumber ?? null,
            mobilePhone: updatedData.form_details?.mobilePhone ?? null,
            companyPhone: updatedData.form_details?.companyPhone ?? null,
            city_id: updatedData.user?.city_id ?? updatedData.form_details?.city_id ?? null,
            serviceTypes: updatedData.form_details?.serviceTypes || [],
            propertyAddress: updatedData.form_details?.propertyAddress ?? null,
            ownerDateStart: updatedData.form_details?.ownerDateStart ?? null,
            ownerDateEnd: updatedData.form_details?.ownerDateEnd ?? null,
            state_id: updatedData.user?.state_id ?? null,
            zip: updatedData.user?.zip ?? null,
            title: updatedData.form_details?.title ?? null,
            cityOfficial: updatedData.form_details?.cityOfficial ?? null,
            cityAddress: updatedData.form_details?.cityAddress ?? null,
            cityPhone: updatedData.form_details?.cityPhone ?? null,
            company_name: updatedCompany,
        });

        if (setContextUser) {
            setContextUser({
                ...contextUser,
                ...updatedData,
                first_name: updatedData.first_name,
                last_name: updatedData.last_name,
                company_name: updatedCompany,
                profile_image_url: updatedData.profile_image_url ?? contextUser?.profile_image_url,
            });
        }
        setSelectedImage(null);
        setPreviewUrl(null);
        toast.success('Profile updated successfully!');
    }

    if (loading) return <ScreenLoader />;

    return (
        <Content className="p-4 md:p-6 lg:p-10 mx-auto">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8">

                <div className="flex-1 w-full min-w-0 space-y-8">

                    <Card className="w-full border shadow-lg rounded-2xl overflow-hidden bg-background">
                        <CardHeader className="bg-muted/30 px-4 md:px-8 py-4 md:py-6 border-b flex-row flex-wrap items-center justify-between gap-3">
                            <CardTitle className="text-xl font-bold tracking-tight">General Information</CardTitle>
                            <Button size="sm" variant={isEditing ? 'outline' : 'primary'} onClick={() => setIsEditing(!isEditing)}>
                                {isEditing
                                    ? <><X className="size-4 mr-2" />Cancel Edit</>
                                    : <><UserRoundPen className="size-4 mr-2" />Edit Profile</>}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Form {...form}>
                                <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="divide-y border-b last:border-b-0">
                                    <div className="px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        <div className="md:col-span-2 flex items-center gap-8">
                                            <div className="relative group">
                                                <Avatar className="h-20 w-20 border-4 border-background">
                                                    <AvatarImage src={previewUrl || `${process.env.NEXT_PUBLIC_BASE_URL}${user?.profile_image_url}`} alt={user?.first_name || 'User'} className="object-cover" />
                                                    <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                                                        {user?.first_name?.substring(0, 1).toUpperCase()}{user?.last_name?.substring(0, 1).toUpperCase() || ''}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isEditing && (
                                                    <>
                                                        <input type="file" id="profile-image-input" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                        <button type="button" onClick={() => document.getElementById('profile-image-input')?.click()} className="absolute -bottom-1 -right-1 p-2 bg-background rounded-xl shadow-lg border text-primary hover:scale-110 transition-transform">
                                                            <Camera className="size-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-foreground">Profile Picture</p>
                                                {isEditing && <p className="text-xs text-muted-foreground leading-relaxed">Click camera to upload</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Email Address</Label>
                                        <div className="md:col-span-2"><p className="text-sm font-bold">{user?.email || 'Not provided'}</p></div>
                                    </div>
                                    <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Role</Label>
                                        <div className="md:col-span-2">
                                            <Badge variant="outline" className="font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/10 px-3 py-1">{toPascalCase(user?.role ?? user?.roleEntity?.role_name ?? 'Guest')}</Badge>
                                        </div>
                                    </div>
                                    <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Full Name</Label>
                                        <div className="md:col-span-2">
                                            {!isEditing ? (
                                                <p className="text-sm font-bold">{user?.first_name} {user?.last_name}</p>
                                            ) : (
                                                <FormField control={form.control} name="full_name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Enter First and Last Name" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none"
                                                                onKeyDown={(e) => { if (e.key === ' ' && field.value?.includes(' ')) e.preventDefault(); }} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Contractor-specific fields ── */}
                                    {(role === 'contractor' || role === 'manufacturer') && (
                                        <>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Address</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.companyAddress || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="companyAddress" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Address" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Name</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.company_name || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="company_name" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Name" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Email</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.companyEmail || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="companyEmail" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Address" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Website URL</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.websiteUrl || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Website URL" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">License Number</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.licenseNumber || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="License Number" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Mobile Phone</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.mobilePhone || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="mobilePhone" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Mobile Phone (10 digits)" {...field} value={field.value || ''} maxLength={10} inputMode="numeric"
                                                                        onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); field.onChange(digits); }}
                                                                        className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Phone</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.companyPhone || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="companyPhone" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Phone (10 digits)" {...field} value={field.value || ''} maxLength={10} inputMode="numeric"
                                                                        onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); field.onChange(digits); }}
                                                                        className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">City</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{selectedCityName || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="city_id" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className="[&_button]:h-11 [&_button]:rounded-xl [&_button]:bg-muted/30 [&_button]:border-input [&_button]:shadow-none">
                                                                        <CitySelect
                                                                            disabled={isSubAccount}
                                                                            value={field.value || ''}
                                                                            valueType="id"
                                                                            placeholder="Select city"
                                                                            onSelectCity={(city) => { field.onChange(city.id); setSelectedCityName(city.name); }}
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">Services</Label>
                                                <div className="md:col-span-2 min-w-0">
                                                    {!isEditing ? (
                                                        <div className="flex flex-wrap gap-2 min-w-0">
                                                            {user?.serviceTypes?.length ? (
                                                                services
                                                                    .filter((s) => user.serviceTypes!.includes(s.id))
                                                                    .map((s) => (
                                                                        <span
                                                                            key={s.id}
                                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 break-words"
                                                                        >
                                                                            {toPascalCase(s.service_name)}
                                                                        </span>
                                                                    ))
                                                            ) : (
                                                                <span className="text-sm font-bold text-muted-foreground">Not provided</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <FormField control={form.control} name="serviceTypes" render={({ field }) => (
                                                            <FormItem>
                                                                <div className="flex flex-wrap gap-2 min-w-0">
                                                                    {services.map((service) => {
                                                                        const selected = (field.value || []).includes(service.id);
                                                                        return (
                                                                            <button
                                                                                key={service.id}
                                                                                type="button"
                                                                                disabled={isSubAccount}
                                                                                onClick={() => {
                                                                                    const cur = field.value || [];
                                                                                    field.onChange(selected ? cur.filter(v => v !== service.id) : [...cur, service.id]);
                                                                                }}
                                                                                className={cn(
                                                                                    "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all text-left break-words cursor-pointer",
                                                                                    selected
                                                                                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                                                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                                                                                    isSubAccount && "opacity-60 cursor-not-allowed"
                                                                                )}
                                                                            >
                                                                                <span className={cn(
                                                                                    'w-3.5 h-3.5 shrink-0 rounded-xs border flex items-center justify-center transition-colors',
                                                                                    selected ? 'border-white bg-white/20' : 'border-muted-foreground/50',
                                                                                )}>
                                                                                    {selected && (
                                                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                        </svg>
                                                                                    )}
                                                                                </span>
                                                                                <span>{toPascalCase(service.service_name)}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ── Property-specific fields ── */}
                                    {(role === 'property_owner' || role === 'realtor') && (
                                        <>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Property Address</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.propertyAddress || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="propertyAddress" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Property Address" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Mobile Phone</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.mobilePhone || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="mobilePhone" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Mobile Phone (10 digits)" {...field} value={field.value || ''} maxLength={10} inputMode="numeric"
                                                                        onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); field.onChange(digits); }}
                                                                        className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">State</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{states.find(s => s.id === user?.state_id)?.name || user?.state_id || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="state_id" render={({ field }) => (
                                                            <FormItem>
                                                                <Select disabled={isSubAccount} value={field.value || ''} onValueChange={(val) => { field.onChange(val); setSelectedStateId(val); form.setValue('city_id', ''); }}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-input shadow-none">
                                                                            <SelectValue placeholder="Select State" />
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
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">City</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{selectedCityName || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="city_id" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className="[&_button]:h-11 [&_button]:rounded-xl [&_button]:bg-muted/30 [&_button]:border-input [&_button]:shadow-none">
                                                                        <CitySelect
                                                                            disabled={isSubAccount}
                                                                            value={field.value || ''}
                                                                            stateValue={selectedStateId}
                                                                            valueType="id"
                                                                            placeholder="Select city"
                                                                            onSelectCity={(city) => {
                                                                                field.onChange(city.id);
                                                                                setSelectedCityName(city.name);
                                                                                if (!selectedStateId && city.state_id) {
                                                                                    form.setValue('state_id', city.state_id);
                                                                                    setSelectedStateId(city.state_id);
                                                                                }
                                                                            }}
                                                                            syncState={true}
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Zip Code</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.zip || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="zip" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Zip Code" {...field} value={field.value || ''} inputMode="numeric" maxLength={10} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">Owner Dates</Label>
                                                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                                    {!isEditing ? (
                                                        <>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">Start</p>
                                                                <p className="text-sm font-bold">{user?.ownerDateStart ? user.ownerDateStart.split('T')[0] : 'Not provided'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">End</p>
                                                                <p className="text-sm font-bold">{user?.ownerDateEnd ? user.ownerDateEnd.split('T')[0] : 'Not provided'}</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FormField control={form.control} name="ownerDateStart" render={({ field }) => (
                                                                <FormItem>
                                                                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                                                                    <FormControl>
                                                                        <Input disabled={isSubAccount} type="date" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="ownerDateEnd" render={({ field }) => (
                                                                <FormItem>
                                                                    <p className="text-xs text-muted-foreground mb-1">End Date</p>
                                                                    <FormControl>
                                                                        <Input disabled={isSubAccount} type="date" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ── Insurance Company fields ── */}
                                    {role === 'insurance_company' && (
                                        <>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Name</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.company_name || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="company_name" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Name" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Title</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.title || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="title" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Title" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Address</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.companyAddress || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="companyAddress" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Address" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Website URL</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.websiteUrl || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Website URL" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Mobile Phone</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.mobilePhone || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="mobilePhone" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Mobile Phone (10 digits)" {...field} value={field.value || ''} maxLength={10} inputMode="numeric"
                                                                        onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); field.onChange(digits); }}
                                                                        className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Company Phone</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.companyPhone || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="companyPhone" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Company Phone (10 digits)" {...field} value={field.value || ''} maxLength={10} inputMode="numeric"
                                                                        onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); field.onChange(digits); }}
                                                                        className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ── City Inspector fields ── */}
                                    {role === 'city_inspector' && (
                                        <>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">City</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{selectedCityName || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="city_id" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className="[&_button]:h-11 [&_button]:rounded-xl [&_button]:bg-muted/30 [&_button]:border-input [&_button]:shadow-none">
                                                                        <CitySelect
                                                                            disabled={isSubAccount || role === 'city_inspector'}
                                                                            value={field.value || ''}
                                                                            valueType="id"
                                                                            placeholder="Select city"
                                                                            onSelectCity={(city) => { field.onChange(city.id); setSelectedCityName(city.name); }}
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">City Official</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.cityOfficial || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="cityOfficial" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="City Official" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Title</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.title || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="title" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="Title" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">City Address</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.cityAddress || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="cityAddress" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="City Address" {...field} value={field.value || ''} className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">City Phone</Label>
                                                <div className="md:col-span-2">
                                                    {!isEditing ? (
                                                        <p className="text-sm font-bold">{user?.cityPhone || 'Not provided'}</p>
                                                    ) : (
                                                        <FormField control={form.control} name="cityPhone" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input disabled={isSubAccount} placeholder="City Phone (10 digits)" {...field} value={field.value || ''} maxLength={10} inputMode="numeric"
                                                                        onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); field.onChange(digits); }}
                                                                        className="h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </Form>
                        </CardContent>
                        <AnimatePresence>
                            {isEditing && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-4 md:px-8 py-4 border-t bg-muted/20 flex justify-end gap-3">
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} type="button">Discard</Button>
                                        <Button variant="primary" size="sm" type="submit" form="profile-form" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    <Card className="border shadow-lg rounded-2xl overflow-hidden bg-background">
                        <CardHeader className="bg-muted/30 px-4 md:px-8 py-4 md:py-6 border-b">
                            <CardTitle className="text-xl font-bold tracking-tight">Account Security</CardTitle>
                            <CardDescription className="text-sm font-medium text-muted-foreground">Manage your authentication and security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 divide-y">
                            <div className="px-4 md:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm"><Lock className="size-5" /></div>
                                    <div>
                                        <p className="text-sm font-bold">Password Settings</p>
                                        <p className="text-xs text-muted-foreground font-medium">Keep your account secure with a strong password</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setChangePasswordOpen(true)} size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-wider h-9 px-4">Change Password</Button>
                            </div>
                            <div className="px-4 md:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shadow-sm"><LogOut className="size-5" /></div>
                                    <div>
                                        <p className="text-sm font-bold">Sign Out</p>
                                        <p className="text-xs text-muted-foreground font-medium">Sign out of your account on this device</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={handleSignout} size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-wider h-9 px-4 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">Sign Out</Button>
                            </div>
                            {showAddContractorProfile && (
                                <div className="px-4 md:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm"><Building2 className="size-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Contractor Profile</p>
                                            <p className="text-xs text-muted-foreground font-medium">Add your business to the contractor directory</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={handleAddContractorProfile} size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-wider h-9 px-4">Add Profile</Button>
                                </div>
                            )}
                            {showPurchasebtn && (
                                <div className="px-4 md:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm"><Building2 className="size-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Purchase Extra Users</p>
                                            <p className="text-xs text-muted-foreground font-medium">Add more Users to your contractor company</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setPurchaseUsersOpen(true)} size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-wider h-9 px-4">Purchase User</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader><DialogTitle className="sr-only">Change Password</DialogTitle></DialogHeader>
                            <ChangePasswordForm />
                        </DialogContent>
                    </Dialog>
                    <Dialog open={purchaseUsersOpen} onOpenChange={setPurchaseUsersOpen}>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle className="text-base font-bold">Purchase Extra Users</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Number of Users</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={purchaseUserCount}
                                        onChange={(e) => setPurchaseUserCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handlePurchaseUsers}
                                    disabled={purchaseLoading || purchaseUserCount < 1}
                                >
                                    {purchaseLoading ? 'Redirecting to checkout...' : 'Proceed to Payment'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>

                <div className="lg:w-[380px] shrink-0 space-y-6">

                    {role === 'insurance_company' && (
                        <Card className="border shadow-lg rounded-2xl overflow-hidden bg-background">
                            <CardHeader className="bg-muted/30 px-5 py-4 border-b flex-row items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight">Plan Details</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-4">
                                    {reportUsageLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Plan</p>
                                                <p className="text-xl font-black text-primary">{reportUsage?.plan || 'N/A'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Used</p>
                                                    <p className="text-lg font-bold">{reportUsage?.used ?? 0}</p>
                                                </div>
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                                                    <p className="text-lg font-bold">{reportUsage?.remaining ?? 0}</p>
                                                </div>
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Base Limit</p>
                                                    <p className="text-lg font-bold">{reportUsage?.baseLimit ?? 0}</p>
                                                </div>
                                                <div className="col-span-2 bg-muted/30 p-3 rounded-xl border flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0">Purchased Reports</p>
                                                    <p className="text-lg font-bold">{reportUsage?.purchasedReports ?? 0}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {role === 'contractor' && (
                        <Card className="border shadow-lg rounded-2xl overflow-hidden bg-background">
                            <CardHeader className="bg-muted/30 px-5 py-4 border-b flex-row items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight">Plan & Usage Details</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-4">
                                    {reportUsageLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Plan</p>
                                                <p className="text-xl font-black text-primary">{reportUsage?.plan || 'N/A'}</p>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                {/* Properties Usage */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-muted-foreground uppercase tracking-wider">Properties</span>
                                                        <span>
                                                            {reportUsage?.propertiesUsed ?? 0} / {reportUsage?.propertiesUnlimited ? 'Unlimited' : (reportUsage?.propertiesProvided ?? 0)}
                                                        </span>
                                                    </div>
                                                    {!reportUsage?.propertiesUnlimited && (
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(100, ((reportUsage?.propertiesUsed ?? 0) / (reportUsage?.propertiesProvided || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Projects Usage */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-muted-foreground uppercase tracking-wider">Projects</span>
                                                        <span>
                                                            {reportUsage?.projectsUsed ?? 0} / {reportUsage?.projectsUnlimited ? 'Unlimited' : (reportUsage?.projectsProvided ?? 0)}
                                                        </span>
                                                    </div>
                                                    {!reportUsage?.projectsUnlimited && (
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(100, ((reportUsage?.projectsUsed ?? 0) / (reportUsage?.projectsProvided || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <hr className="border-border my-2" />

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reports Used</p>
                                                    <p className="text-lg font-bold">{reportUsage?.used ?? 0}</p>
                                                </div>
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Report Limit</p>
                                                    <p className="text-lg font-bold">{reportUsage?.limit ?? 0}</p>
                                                </div>
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Remaining Reports</p>
                                                    <p className="text-lg font-bold">{reportUsage?.remaining ?? 0}</p>
                                                </div>
                                                <div className="bg-muted/30 p-3 rounded-xl border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Base Limit</p>
                                                    <p className="text-lg font-bold">{reportUsage?.baseLimit ?? 0}</p>
                                                </div>
                                                <div className="col-span-2 bg-muted/30 p-3 rounded-xl border flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0">Purchased Reports</p>
                                                    <p className="text-lg font-bold">{reportUsage?.purchasedReports ?? 0}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {showMembership && (
                        <Card className="border shadow-lg bg-background text-foreground overflow-hidden relative group rounded-3xl">
                            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none" />
                            <CardContent className="p-10 text-center relative z-10 flex flex-col items-center">
                                {user?.current_subscription?.status === 'ACTIVE' ? (
                                    <>
                                        <div className="size-20 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 mb-10 transform -rotate-12 group-hover:rotate-0 transition-all duration-700 ease-out group-hover:scale-110">
                                            <Sparkles className="size-10 text-white " />
                                        </div>
                                        <div className="mb-4">
                                            <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                                                Active Plan
                                            </Badge>
                                        </div>
                                        <h2 className="text-3xl font-black leading-[1.1] mb-6 uppercase tracking-tighter text-foreground">
                                            {user.current_subscription?.plan?.name} <br /><span className="text-primary italic">Plan</span>
                                        </h2>
                                        <p className="text-sm text-muted-foreground font-medium mb-10 leading-relaxed max-w-[260px]">
                                            {user.current_subscription?.plan?.description || "You have access to all premium features and exclusive verification reports."}
                                        </p>
                                        <Button onClick={() => router.push('/plans')} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black transition-all hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 text-xs uppercase tracking-[0.2em]">
                                            Manage Plan
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="size-20 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 mb-10 transform -rotate-12 group-hover:rotate-0 transition-all duration-700 ease-out group-hover:scale-110">
                                            <Sparkles className="size-10 text-white" />
                                        </div>
                                        <h2 className="text-3xl font-black leading-[1.1] mb-6 uppercase tracking-tighter text-foreground">
                                            Premium <br /><span className="text-primary italic">Membership</span>
                                        </h2>
                                        <p className="text-sm text-muted-foreground font-medium mb-10 leading-relaxed max-w-[260px]">
                                            Join thousands of professionals and unlock exclusive verification reports and instant data exports.
                                        </p>
                                        <Button onClick={() => router.push('/plans')} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black transition-all hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)] active:scale-95 text-xs uppercase tracking-[0.2em]">
                                            Upgrade Now
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {hasLogsCard && (
                        <Card className="border shadow-lg rounded-2xl overflow-hidden bg-background">
                            <CardHeader className="bg-muted/30 px-5 py-4 border-b flex-row items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <History className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight">Recent Activity</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 divide-y">
                                {logsLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
                                            <div className="size-8 rounded-lg bg-muted shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-2.5 bg-muted rounded w-2/3" />
                                                <div className="h-2 bg-muted rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))
                                ) : recentLogs.length === 0 ? (
                                    <div className="px-5 py-8 text-center">
                                        <History className="size-6 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground font-medium">No activity yet</p>
                                    </div>
                                ) : (
                                    recentLogs.map((log) => {
                                        const label = actionLabels[log.action] ?? log.action;
                                        const displayName =
                                            log.new_values?.first_name && log.new_values?.last_name
                                                ? `${log.new_values.first_name} ${log.new_values.last_name}`
                                                : log.changed_by_user_email || 'System';
                                        return (
                                            <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">
                                                        {displayName}{' '}
                                                        <span className="font-normal text-muted-foreground">{label}</span>
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                            {!logsLoading && recentLogs.length > 0 && (
                                <div className="px-5 py-3 border-t bg-muted/20">
                                    <button
                                        onClick={() => router.push(logsRoute)}
                                        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                                    >
                                        View All Logs <ArrowRight className="size-3" />
                                    </button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* <Card className="border shadow-lg rounded-2xl bg-background overflow-hidden p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Account Health</p>
                            <Zap className={`size-4 ${integrityStatus.color} fill-current`} />
                        </div>
                        <div className="space-y-4">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${integrityScore}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full ${integrityStatus.bg}`}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className={`${integrityStatus.color} uppercase`}>{integrityScore}% Integrity</span>
                                <span className="text-muted-foreground italic">
                                    {integrityScore < 95 ? (
                                        <span className="flex items-center gap-1">
                                            <span className="size-1 rounded-full bg-muted-foreground/30" />
                                            {integrityStatus.label}
                                        </span>
                                    ) : integrityStatus.label}
                                </span>
                            </div>
                        </div>
                    </Card> */}


                </div>
            </div>
        </Content>
    );
}
