'use client';

import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PurchaseCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5FFFF] to-[#FFFFFF] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[20px] shadow-[0px_4px_34px_rgba(31,42,68,0.1)] p-8 md:p-12 space-y-6 text-center">
          {/* Cancel Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="relative bg-orange-500/10 rounded-full p-4">
                <XCircle className="size-16 text-orange-500" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#1F2A44] uppercase tracking-tight font-asap">
              Purchase Cancelled
            </h1>
            <p className="text-sm md:text-base text-gray-500 font-medium">
              Your purchase was cancelled. No charges were made.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              You can return to search and try purchasing again whenever you're ready.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <Button
              onClick={() => router.back()}
              className="w-full h-12 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white rounded-xl font-black uppercase tracking-widest gap-2 cursor-pointer"
            >
              <ArrowLeft className="size-5" />
              Go Back
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest border-2 cursor-pointer"
            >
              Back to Search
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-gray-500 gap-2"
            >
              <Home className="size-5" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
