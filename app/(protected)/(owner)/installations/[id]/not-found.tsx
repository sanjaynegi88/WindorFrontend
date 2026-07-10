import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="size-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Component Not Found</h2>
            <p className="text-muted-foreground text-sm">
              The component you're looking for doesn't exist or has been removed.
            </p>
          </div>
          <Button asChild className="w-full cursor-pointer">
            <Link href="/installations">
              Back to Installations
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}