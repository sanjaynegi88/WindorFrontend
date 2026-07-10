'use client';

import { Content } from '@/components/layouts/crm/components/content';
import StateList from './state-list';
import { useState } from 'react';

export default function StatesPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return (
        <>
            <Content className="block p-6">
                <StateList refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
