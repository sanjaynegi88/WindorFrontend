'use client';

import { useState } from 'react';
import BrandList from './brand-list';
import { BrandFormDialog } from './brand-form-dialog';
import { Content } from '@/components/layouts/crm/components/content';

export default function BrandsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAddBrand = () => {
        setIsDialogOpen(true);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <>
            <Content className="block p-6">
                <BrandList key={refreshTrigger} onAddBrand={handleAddBrand} />
            </Content>
            <BrandFormDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                brand={null}
                onSuccess={handleSuccess}
            />
        </>
    );
}
