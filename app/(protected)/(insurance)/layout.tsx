'use client';

import { RoleGuard } from '@/components/RoleGuard';

export default function InsuranceLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['insurance_company', 'admin']}>
            {children}
        </RoleGuard>
    );
}
