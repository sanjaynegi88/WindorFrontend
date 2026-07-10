'use client';

import { Content } from '@/components/layouts/crm/components/content';
import RolesListPage from './role-list';
import { useState } from 'react';

export default function RolesPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return (
        <>
            <Content className="block p-6">
                <RolesListPage refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
