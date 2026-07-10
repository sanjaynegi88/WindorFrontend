import { Content } from '@/components/layouts/crm/components/content';
import VerificationList from './verification-list';
import { VerificationHeader } from './page-header';

export default function VerificationPage() {
    return (
        <Content className="block py-0">
            <VerificationList />
        </Content>
    );
}
