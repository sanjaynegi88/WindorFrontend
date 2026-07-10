import { Content } from '@/components/layouts/crm/components/content';
import AuditLogsList from '@/components/audit-logs/audit-logs-list';

export default function InspectorLogsPage() {
    return (
        <Content className="block py-6">
            <AuditLogsList />
        </Content>
    );
}
