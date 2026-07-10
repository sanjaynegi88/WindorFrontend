'use client';

import { Content } from '@/components/layouts/crm/components/content';
import ImageCategoryListPage from './image-category-list';
import { useState } from 'react';

export default function ImageCategoryPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return (
        <>
            <Content className="block p-6">
                <ImageCategoryListPage refreshTrigger={refreshTrigger} onSuccess={handleRefresh} />
            </Content>
        </>
    );
}
