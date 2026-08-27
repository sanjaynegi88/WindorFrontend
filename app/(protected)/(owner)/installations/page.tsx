import { Content } from '@/components/layouts/crm/components/content';
import InstallationList from './installation-list';
import { PageHeader } from './page-header';

export default function InstallationsPage() {
    return (
        <>
            <PageHeader />
            <Content className="block py-0">
                <InstallationList />
            </Content>
        </>
    );
}
