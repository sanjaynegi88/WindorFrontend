import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6  px-4">
      <div className="flex size-24 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-12 text-muted-foreground" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <Button asChild variant="outline" className='cursor-pointer'>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
