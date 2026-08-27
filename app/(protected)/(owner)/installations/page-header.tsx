'use client';

import {
  Hammer,
} from 'lucide-react';

import { ContentHeader } from '@/components/layouts/crm/components/content-header';

export function PageHeader() {
  return (
    <ContentHeader>
      <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
        <Hammer className="size-4 text-primary" />
        Installations
      </h1>
    </ContentHeader>
  );
}
