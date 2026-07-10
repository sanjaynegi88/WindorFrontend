'use client';

import { ContentHeader } from '@/components/layouts/crm/components/content-header';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Content } from '@/components/layouts/crm/components/content';
import Link from 'next/link';
import UserList from "@/components/sub-accounts/user-list";

export default function AccountsPage() {
    const route = "/city-users"
    return (
        <>
            <Content className="block py-6">
                <UserList route={route} />
            </Content>
        </>
    );
}
