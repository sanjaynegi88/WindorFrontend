"use client";

import { SyncEngineProvider } from "@/components/SyncEngineProvider";
import { OfflineStatusIndicator } from "@/components/OfflineStatusIndicator";
import {
  Navbar,
  Footer,
  MobileTabs,
  MobileHeader,
} from "@/components/layouts/global";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AuthGuard from "../../components/AuthGuard";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <SyncEngineProvider>
        <div className="flex flex-col min-h-screen w-full bg-[#FFFFFF] md:bg-[#F8FBFF]">
          <MobileHeader />
          <Navbar />
          <div
            className={cn(
              "flex-1 flex flex-col md:pt-[118px] pb-[80px] pt-[70px] md:pb-0",
            )}
          >
            {children}
          </div>
          <Footer />
          <MobileTabs />
        </div>
        <OfflineStatusIndicator />
      </SyncEngineProvider>
    </AuthGuard>
  );
}
