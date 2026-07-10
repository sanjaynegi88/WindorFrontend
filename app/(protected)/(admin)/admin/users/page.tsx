import { Content } from '@/components/layouts/crm/components/content';
import UserList from './user-list';

export default function AdminUsersPage() {
    return (
        <>
            <Content className="block px-5">
                <UserList />
            </Content>
        </>
    );
}
