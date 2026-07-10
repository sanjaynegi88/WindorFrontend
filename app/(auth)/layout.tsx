import { ReactNode, Suspense } from "react";
import { ScreenLoader } from "@/components/common/screen-loader";
import { BrandedLayout } from "./layout/branded-layout";
import { Navbar, Footer } from "@/components/layouts/global";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <div className="flex flex-col min-h-screen w-full">
        <Navbar />
        <div className="flex-1 flex flex-col md:pt-[118px]">
          <BrandedLayout>{children}</BrandedLayout>
        </div>
        <Footer />
      </div>
    </Suspense>
  );
}