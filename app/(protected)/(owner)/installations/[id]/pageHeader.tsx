'use client';

import {
  Hammer,
} from 'lucide-react';
import { ContentHeader } from '@/components/layouts/crm/components/content-header';

export function DetailsPageHeader() {
  return (
    <ContentHeader>
      <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
        <Hammer className="size-4 text-primary" />
        Details
      </h1>
      <div className="flex items-center gap-2.5">
      </div>
    </ContentHeader>
  );
}
