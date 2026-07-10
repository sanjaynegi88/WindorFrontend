'use client';

import { useEffect, useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, ShieldCheck, Mail, User, Phone, Save, MapPin } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Content } from '@/components/layouts/crm/components/content';
import { ContentHeader } from '@/components/layouts/crm/components/content-header';
import { Camera } from 'lucide-react';
import { getSpecificSubAccounts, editStaff } from '@/lib/actions';
import { ScreenLoader } from '@/components/common/screen-loader';

const userSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phoneNumber: z.string().max(10, 'Phone number must be 10 digits').regex(/^\d*$/, 'Numbers only').optional(),
    displayName: z.string().optional(),
    address: z.string().optional(),
    city_id: z.string().optional(),
    profileImageUrl: z.string().optional(),
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

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            displayName: '',
            address: '',
            city_id: '',
            profileImageUrl: '',
        },
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await getSpecificSubAccounts(id);
                const userData = response.data;
                setUserDataRaw(userData);

                const profile = userData.profile || {};
                form.reset({
                    firstName: userData.first_name || '',
                    lastName: userData.last_name || '',
                    phoneNumber: profile.phone_number || '',
                    displayName: profile.display_name || '',
                    address: profile.address || '',
                    city_id: userData.city_id || profile.city_id || '',
                    profileImageUrl: profile.profile_image_url || '',
                });
            } catch (error: any) {
                toast.error(error.message || 'Failed to load user data');
                router.push('/company-users');
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
        try {
            const formData = new FormData();
            formData.append('first_name', values.firstName);
            formData.append('last_name', values.lastName);
            if (values.phoneNumber) formData.append('phone_number', values.phoneNumber);
            if (values.displayName) formData.append('display_name', values.displayName);
            if (values.address) formData.append('address', values.address);

            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            await editStaff(id, formData);
            toast.success('User updated successfully!');
            router.push('/contractor-users');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <ScreenLoader />;
    }

    return (
        <>
            <Content className="block py-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-border/60 shadow-2xl shadow-black/5 overflow-hidden">
                        <CardHeader className="border-b justify-center bg-muted/20 py-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="size-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">Staff Details</CardTitle>
                                    <CardDescription>
                                        Update staff information and profile.
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
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-bold bg-muted px-3 py-1 rounded-full">INSURANCE COMPANY</p>
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
                                                    <FormLabel className="font-semibold">First Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="First Name"
                                                                className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                                                                {...field}
                                                            />
                                                        </div>
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
                                                    <FormLabel className="font-semibold">Last Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Last Name"
                                                                className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="md:col-span-2">
                                            <FormLabel className="font-semibold">Email Address</FormLabel>
                                            <div className="relative">
                                                <Input
                                                    type="email"
                                                    value={userDataRaw?.email || ''}
                                                    className="pl-10 h-11 bg-muted/50 focus:bg-muted/50 transition-all cursor-not-allowed"
                                                    disabled
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="displayName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Display Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Display Name"
                                                                className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phoneNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Phone Number</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="5550199"
                                                                className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                                                                maxLength={10}
                                                                onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault(); }}
                                                                {...field}
                                                            />
                                                        </div>
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
                                                    <FormLabel className="font-semibold">Address</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Address"
                                                                className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
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
                                                    Update Staff Account
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