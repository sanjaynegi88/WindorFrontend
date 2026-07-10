'use client';

import { Content } from '@/components/layouts/crm/components/content';
import { useState } from 'react';
import ServiceProvidedListPage from './service-provided-list';

export default function ServiceProvidedPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return (
        <>
            <Content className="block p-6">
                <ServiceProvidedListPage refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
