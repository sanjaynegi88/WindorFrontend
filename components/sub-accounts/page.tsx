'use client';

import { RoleGuard } from '@/components/RoleGuard';
import UserList from './user-list';

export default function SubAccountsPage(route: string) {
  return (
    <RoleGuard allowedRoles={['city_inspector', 'insurance_company']} mainAccountOnly={true}>
      <div className="p-6">
        <UserList route={route} />
      </div>
    </RoleGuard>
  );
}
