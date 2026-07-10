'use client';

import { Content } from '@/components/layouts/crm/components/content';
import { useState } from 'react';
import ReportPriceListPage from './report-price-list';

export default function ReportPricePage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return (
        <>
            <Content className="block p-6">
                <ReportPriceListPage refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
