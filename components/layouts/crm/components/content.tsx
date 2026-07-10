import { cn } from '@/lib/utils';

export function Content({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-1 py-5 w-full min-w-0 overflow-x-clip', className)}>
      {children}
    </div>
  );
}
