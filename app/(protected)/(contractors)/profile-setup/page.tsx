'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContractorProfileForm } from '@/components/forms/contractor-profile-form';
import type { ContractorProfileInitialData } from '@/components/forms/contractor-profile-form';
import { Container } from '@/components/common/container';
import { Loader2 } from 'lucide-react';
import { getContractorProfile } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';

export default function ContractorProfileSetupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;
    const { role, user } = useUser();

    const [membershipLevel, setMembershipLevel] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<ContractorProfileInitialData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                if (isEditMode) {
                    const response = await getContractorProfile(editId);

                    const data = response.data;

                    const mapped: ContractorProfileInitialData = {
                        id: data.id,
                        description: data.description ?? '',
                        companyLogo: data.companyLogo ?? null,
                        selectedCities: data.selectedCities ?? [],
                        cityDetails: data.cityDetails ?? [],
                        membershipLevel: data.membershipLevel,
                        level_info: data.level_info,
                    };
                    setMembershipLevel(data.membershipLevel);
                    setInitialData(mapped);
                } else {
                    const pendingLevel = localStorage.getItem('pending_level');
                    const hasDirectoryFeature = Boolean(
                        (user as any)?.level_info?.features?.is_contractor_directory ??
                        (user as any)?.current_subscription?.plan?.level_info?.features?.is_contractor_directory ??
                        (user as any)?.is_directory
                    );

                    if (!pendingLevel && !hasDirectoryFeature) {
                        localStorage.removeItem('pending_level');
                        router.push('/dashboard');
                        return;
                    }
                    setMembershipLevel(pendingLevel || (user as any)?.level || '');
                }
            } catch (error: any) {
                console.error('Failed to load contractor profile:', error);
                toast.error(error.message || 'Failed to load contractor profile');
                if (!isEditMode) {
                    localStorage.removeItem('pending_level');
                }
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [editId, isEditMode, router, user]);

    if (isLoading || (isEditMode && !initialData)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <Container>
            <div className="py-8">
                <ContractorProfileForm
                    membershipLevel={membershipLevel ?? undefined}
                    levelInfo={initialData?.level_info || (user as any)?.level_info || (user as any)?.current_subscription?.plan?.level_info}
                    initialData={initialData}
                    profileId={editId ?? undefined}
                    role={role ?? undefined}
                    onSuccess={() => router.push('/dashboard')}
                />
            </div>
        </Container>
    );
}
