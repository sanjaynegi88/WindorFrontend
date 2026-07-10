'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { useNotifications } from '@/components/providers/notification-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    variant?: "solid" | "overlay";
    sticky?: boolean;
}

const HEADER_VARIANTS = {
    solid: {
        container: "bg-[#F8FBFF]",
        backBtn: "bg-[#E5E7EB]",
        backIcon: "text-[#1F2A44]",
        greeting: "text-[#708090]",
        userName: "text-[#1F2A44]",
        logo: "/assets/logo.png",
        notifBtn: "bg-[rgba(28,167,166,0.2)] border-[rgba(28,167,166,0.28)] text-[#1CA7A6] shadow-[0px_4px_14px_rgba(28,167,166,0.3)]",
        notifDot: "bg-[#F44336]",
        avatarBorder: "border-gray-100",
        avatarFallback: "bg-gray-100 text-[#1F2A44]",
    },
    overlay: {
        container: "bg-transparent",
        backBtn: "bg-white/20 backdrop-blur-sm",
        backIcon: "text-white",
        greeting: "text-white/80",
        userName: "text-white",
        logo: "/assets/logo.png",
        notifBtn: "bg-white/20 border-white/30 text-white shadow-none backdrop-blur-sm",
        notifDot: "bg-[#F44336]",
        avatarBorder: "border-white/30",
        avatarFallback: "bg-white/20 text-white",
    }
} as const;

export function MobileHeader({ variant = "solid", sticky = true }: MobileHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const { unreadCount } = useNotifications();

    const isDashboard = pathname === '/dashboard' || pathname === '/';
    const showBackButton = !isDashboard;

    const styles = HEADER_VARIANTS[variant];

    return (
        <header
            className={cn(
                "md:hidden fixed top-0 inset-x-0 z-50 w-full h-[70px] flex items-center justify-between px-4 transition-all duration-300",
                variant === "solid" && "border-b border-gray-100",
                styles.container,
                variant === 'solid'
                    ? "bg-white/95 backdrop-blur-md"
                    : "bg-transparent border-transparent"
            )}
        >
            {/* Left Section */}
            <div className="flex items-center gap-2 min-w-[120px] z-10">
                {showBackButton ? (
                    <button
                        onClick={() => router.back()}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-active active:scale-95",
                            styles.backBtn
                        )}
                    >
                        <ChevronLeft className={cn("size-5", styles.backIcon)} />
                    </button>
                ) : user ? (
                    <div className="flex items-center gap-2">
                        <Avatar className={cn("h-[34px] w-[34px] border", styles.avatarBorder)}>
                            <AvatarImage
                                src={user.profile_image_url ? `${process.env.NEXT_PUBLIC_BASE_URL}${user.profile_image_url}` : ""}
                                alt={user.first_name || "User"}
                                className="object-cover"
                            />
                            <AvatarFallback className={cn("font-bold text-[10px]", styles.avatarFallback)}>
                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-center -space-y-0.5">
                            <div className="flex items-center gap-1">
                                <span className={cn("text-[11px] font-medium font-asap", styles.greeting)}>Hello</span>
                                <Image src="/assets/mdi_hand-wave.png" alt="wave" width={12} height={12} />
                            </div>
                            <span className={cn("text-[11px] font-bold font-asap truncate max-w-[80px]", styles.userName)}>
                                {user.first_name} {user.last_name}
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Center Section - Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                <Image
                    src={styles.logo}
                    alt="Windor Logo"
                    width={80}
                    height={40}
                    className={cn(
                        "object-contain h-10 w-auto",
                        variant === 'overlay' && "brightness-0 invert"
                    )}
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center justify-end min-w-[120px] z-10">
                {user && (
                    <Link
                        href="/notifications"
                        className={cn(
                            "relative w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300",
                            styles.notifBtn
                        )}
                    >
                        <Image
                            src={
                                variant === "overlay"
                                    ? "/assets/bell-white.png"
                                    : "/assets/bell.png"
                            }
                            alt="bell"
                            width={20}
                            height={20}
                        />
                        {unreadCount > 0 && (
                            <span className={cn("absolute top-px h-1.5 w-1.5 rounded-full animate-pulse", styles.notifDot)} />
                        )}
                    </Link>
                )}
            </div>
        </header>
    );
}
