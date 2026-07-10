'use client';

import { Content } from '@/components/layouts/crm/components/content';
import UserList from "@/components/sub-accounts/user-list";

export default function ContractorAdminPage() {
    const route = "/contractor-users"
    return (
        <>
            <Content className="block p-6">
                <UserList route={route} />
            </Content>
        </>
    );
}
