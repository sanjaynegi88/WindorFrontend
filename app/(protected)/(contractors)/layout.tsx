'use client';

import { RoleGuard } from '@/components/RoleGuard';

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['contractor', 'admin','property_owner']}>
            {children}
        </RoleGuard>
    );
}
