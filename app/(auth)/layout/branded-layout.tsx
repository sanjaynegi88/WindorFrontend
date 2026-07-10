import { ReactNode } from 'react';

export function BrandedLayout({ children }: { children: ReactNode }) {
    return (
        <div
            className="flex-1 flex flex-col items-center justify-center py-8 md:py-12 px-4 relative overflow-hidden min-h-[932px] md:min-h-screen"
            style={{
                backgroundImage: 'url("/assets/login/login-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Mobile Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(28,167,166,0.08)] to-[rgba(255,255,255,0.7)] md:hidden pointer-events-none" />
            
            {/* Mobile Background Vectors */}
            <div className="absolute -top-[22px] -left-[51px] w-[294px] h-[317px] bg-[#1CA7A6] opacity-20 blur-[100px] md:hidden pointer-events-none rounded-full" />
            <div className="absolute bottom-[20px] -right-[100px] w-[228px] h-[277px] bg-[#1CA7A6] opacity-30 blur-[100px] md:hidden pointer-events-none rounded-full" />

            <div className="w-full max-w-[1170px] z-10 px-4">
                {children}
            </div>
        </div>
    );
}
