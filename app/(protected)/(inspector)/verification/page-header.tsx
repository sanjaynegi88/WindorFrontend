'use client';

import { ContentHeader } from '@/components/layouts/crm/components/content-header';
import { BadgeCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';


export function VerificationHeader() {
  return (
    <ContentHeader>
      <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
        <BadgeCheck className="size-4 text-primary" />
        Verification Portal
      </h1>
      <div className="flex items-center gap-2.5">

        <Button size="sm">
          <Plus /> New Inspection
        </Button>
      </div>
    </ContentHeader>
  );
}
