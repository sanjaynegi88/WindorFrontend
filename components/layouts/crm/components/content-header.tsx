'use client';

import { cn } from '@/lib/utils';

export function ContentHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="bg-background flex items-center border-b w-full z-[10] h-(--content-header-height) pe-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="container-fluid flex items-center gap-2 w-full min-w-0">
        <div className={cn('flex items-center justify-between grow min-w-0', className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
