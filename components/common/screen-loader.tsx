'use client';

import { toAbsoluteUrl } from '@/lib/helpers';

export function ScreenLoader() {
  return (
    <div className="flex flex-col items-center gap-2 justify-center fixed inset-0 z-[100] bg-white transition-opacity duration-700 ease-in-out">
      <img
        className="h-12 w-auto animate-pulse"
        src={toAbsoluteUrl('/assets/logo.png')}
        alt="logo"
      />
      <div className="text-muted-foreground font-medium text-sm animate-pulse">
        Loading...
      </div>
    </div>
  );
}
