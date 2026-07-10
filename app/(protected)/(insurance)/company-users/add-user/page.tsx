'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, ArrowLeft, Loader2, ShieldCheck, Mail, User, Lock, EyeOff, Eye } from 'lucide-react';
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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Content } from '@/components/layouts/crm/components/content';
import { ContentHeader } from '@/components/layouts/crm/components/content-header';
import { addStaff } from '@/lib/actions';

const staffSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function AddInsuranceStaffPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: StaffFormValues) => {
        setLoading(true);
        const payload = {
            email: values.email,
            first_name: values.firstName,
            last_name: values.lastName,
            password: values.password,
        };
        const result = await addStaff(payload);
        setLoading(false);
        if (!result.success) {
            toast.error(result.message || 'Failed to add staff');
            return;
        }
        toast.success(`Insurance staff "${values.firstName} ${values.lastName}" added successfully!`);
        router.push('/company-users');
    };

    return (
        <>
            <div className="flex-1 flex items-center justify-center py-8 px-4">
                <div className="w-full max-w-2xl">
                    <Card className="border-border/60 shadow-2xl shadow-black/5 overflow-hidden">
                        <CardHeader className="border-b justify-center bg-muted/20 py-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="size-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">Staff Credentials</CardTitle>
                                    <CardDescription>
                                        Create a new company staff account.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
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

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className="font-semibold">Email Address</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type="email"
                                                                placeholder="Email"
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
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className="font-semibold">Initial Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showPassword ? "text" : "password"}
                                                                placeholder="••••••••"
                                                                className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-5 w-5" />
                                                                ) : (
                                                                    <Eye className="h-5 w-5" />
                                                                )}
                                                            </button>
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
                                            className="sm:flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Creating User...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-5 w-5" />
                                                    Create User Account
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
            </div>
        </>
    );
}
