'use client';

import { RoleGuard } from '@/components/RoleGuard';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['property_owner', 'admin']}>
            {children}
        </RoleGuard>
    );
}
