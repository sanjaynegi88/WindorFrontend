'use client';

import {
  Search,
} from 'lucide-react';
import { ContentHeader } from '@/components/layouts/crm/components/content-header';

export function DetailsPageHeader() {
  return (
    <ContentHeader>
      <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
        <Search className="size-4 text-primary" />
        Installation Search Details
      </h1>
      <div className="flex items-center gap-2.5">
      </div>
    </ContentHeader>
  );
}
