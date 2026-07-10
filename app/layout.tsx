import { ReactNode, Suspense } from 'react';
import { Metadata, Viewport } from 'next';
import { Inter, Asap } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAProvider } from '@/components/PWAProvider';
import { LayoutShiftPrevention } from '@/components/common/layout-shift-prevention';
import '@/styles/globals.css';
import GoogleAuthWrapper from "@/components/GoogleAuthWrapper"


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const asap = Asap({ subsets: ['latin'], variable: '--font-asap' });

export const metadata: Metadata = {
  title: {
    template: 'Windor Verifications',
    default: 'Windor Verifications',
  },
  description: 'Property Inspection and Verification tool',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Windor Verifications',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

import { UserProvider } from '@/components/providers/user-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex flex-col min-h-screen text-base text-foreground ',
          inter.variable,
          asap.variable,
          inter.className,
        )}
      >
        <GoogleAuthWrapper>
          <UserProvider>
            <NotificationProvider>
              <PWAProvider>
                <LayoutShiftPrevention />
                <TooltipProvider delayDuration={0}>
                  <Suspense>
                    {children}
                  </Suspense>
                  <Toaster position="top-center" />
                </TooltipProvider>
              </PWAProvider>
            </NotificationProvider>
          </UserProvider>
        </GoogleAuthWrapper>
      </body>
    </html>
  );
}
