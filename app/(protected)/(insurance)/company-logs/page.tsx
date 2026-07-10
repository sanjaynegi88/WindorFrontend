import { Content } from '@/components/layouts/crm/components/content';
import AuditLogsList from '@/components/audit-logs/audit-logs-list';

export default function CompanyLogsPage() {
    return (
        <Content className="block py-6">
            <AuditLogsList />
        </Content>
    );
}
