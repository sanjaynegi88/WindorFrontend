'use client';

import { Content } from '@/components/layouts/crm/components/content';
import PropertyTypeListPage from './property-type-list';
import { useState } from 'react';

export default function PropertyTypesPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return (
        <>
            <Content className="block p-6">
                <PropertyTypeListPage refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
