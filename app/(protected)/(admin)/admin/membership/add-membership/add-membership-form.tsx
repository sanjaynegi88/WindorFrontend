'use client';

import React from 'react';
import { MembershipForm } from '@/components/forms/membership-form';
import { useRouter } from 'next/navigation';

export function AddMembershipForm() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/admin/membership');
    };

    const handleCancel = () => {
        router.push('/admin/membership');
    };

    return (
        <MembershipForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
