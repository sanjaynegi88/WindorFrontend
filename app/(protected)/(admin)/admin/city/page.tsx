'use client';

import { Content } from '@/components/layouts/crm/components/content';
import CityList from './city-list';
import { useState } from 'react';

export default function CitiesPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <>
            <Content className="block p-6">
                <CityList refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
