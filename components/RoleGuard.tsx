'use client';

import { useUser } from '@/components/providers/user-provider';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Role } from '@/config/rbac';
import { ScreenLoader } from '@/components/common/screen-loader';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: Role[];
    redirectTo?: string;
    mainAccountOnly?: boolean;
}

export const RoleGuard = ({ children, allowedRoles, redirectTo = '/dashboard', mainAccountOnly = false }: RoleGuardProps) => {
    const { user, role, isLoading } = useUser();
    const router = useRouter();

    const isAuthorized = !isLoading && role && allowedRoles.includes(role) && (!mainAccountOnly || user?.sub_account === false);

    useEffect(() => {
        if (!isLoading && !isAuthorized) {
            router.push(redirectTo);
        }
    }, [isAuthorized, isLoading, router, redirectTo]);

    if (isLoading) return <ScreenLoader />;
    if (!isAuthorized) return null;

    return <>{children}</>;
};
