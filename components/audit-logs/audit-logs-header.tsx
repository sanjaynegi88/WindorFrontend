'use client';

import { ContentHeader } from '@/components/layouts/crm/components/content-header';
import { History, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLogsHeaderProps {
  title?: string;
}

export function AuditLogsHeader({ title = 'Audit Logs' }: AuditLogsHeaderProps) {
  return (
    <ContentHeader>
      <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
        <History className="size-4 text-primary" />
        {title}
      </h1>
      <div className="flex items-center gap-2.5">
        {/* <Button size="sm" variant="outline">
          <Download className="size-4 mr-2" /> Export Logs
        </Button> */}
      </div>
    </ContentHeader>
  );
}
