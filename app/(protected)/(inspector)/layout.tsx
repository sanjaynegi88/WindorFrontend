'use client';

import { RoleGuard } from '@/components/RoleGuard';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['city_inspector', 'admin']}>
            {children}
        </RoleGuard>
    );
}
