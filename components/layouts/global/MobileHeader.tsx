"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/components/providers/user-provider";
import { useNotifications } from "@/components/providers/notification-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signout } from "@/lib/actions";
import Image from "next/image";
import Link from "next/link";
import { cn, toPascalCase } from "@/lib/utils";

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
    notifBtn:
      "bg-[rgba(28,167,166,0.2)] border-[rgba(28,167,166,0.28)] text-[#1CA7A6] shadow-[0px_4px_14px_rgba(28,167,166,0.3)]",
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
    notifBtn:
      "bg-white/20 border-white/30 text-white shadow-none backdrop-blur-sm",
    notifDot: "bg-[#F44336]",
    avatarBorder: "border-white/30",
    avatarFallback: "bg-white/20 text-white",
  },
} as const;

export function MobileHeader({
  variant = "solid",
  sticky = true,
}: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const [canGoBack, setCanGoBack] = useState(false);

  const role = user?.role?.toLowerCase() || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(
        window.history.length > 1 ||
          Boolean(window.history.state && window.history.state.idx > 0),
      );
    }
  }, [pathname]);

  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const showBackButton = !isDashboard && canGoBack;

  const styles = HEADER_VARIANTS[variant];

  const handleSignout = async () => {
    await signout();
    router.replace(process.env.NEXT_PUBLIC_LOGIN_URL || "/login");
  };

  return (
    <header
      className={cn(
        "md:hidden fixed top-0 inset-x-0 z-50 w-full h-[70px] flex items-center justify-between px-4 transition-all duration-300",
        variant === "solid" && "border-b border-gray-100",
        styles.container,
        variant === "solid"
          ? "bg-white/95 backdrop-blur-md"
          : "bg-transparent border-transparent",
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 min-w-[120px] z-10">
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-active active:scale-95",
              styles.backBtn,
            )}
          >
            <ChevronLeft className={cn("size-5", styles.backIcon)} />
          </button>
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
            variant === "overlay" && "brightness-0 invert",
          )}
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end gap-2 min-w-[120px] z-10">
        {user && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer select-none outline-none">
                  <Avatar
                    className={cn(
                      "h-[34px] w-[34px] shrink-0",
                      styles.avatarBorder,
                    )}
                  >
                    <AvatarImage
                      src={
                        user.profile_image_url
                          ? `${process.env.NEXT_PUBLIC_BASE_URL}${user.profile_image_url}`
                          : ""
                      }
                      alt={user.first_name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback
                      className={cn(
                        "font-bold text-[10px]",
                        styles.avatarFallback,
                      )}
                    >
                      {user.first_name?.charAt(0)}
                      {user.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col justify-center -space-y-0.5 max-w-[85px] min-w-0 text-left">
                    {user.company_name ? (
                      <>
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              "text-[10px] font-medium font-asap truncate",
                              styles.greeting,
                            )}
                          >
                            Hello, {user.first_name}
                          </span>
                          <Image
                            src="/assets/mdi_hand-wave.png"
                            alt="wave"
                            width={10}
                            height={10}
                            className="shrink-0"
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-asap truncate max-w-[85px] leading-tight",
                            styles.userName,
                          )}
                          title={user.company_name}
                        >
                          {user.company_name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium truncate leading-tight",
                            styles.greeting,
                          )}
                        >
                          {toPascalCase(role)}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              "text-[10px] font-medium font-asap truncate",
                              styles.greeting,
                            )}
                          >
                            Hello, {user.first_name} {user.last_name}
                          </span>
                          <Image
                            src="/assets/mdi_hand-wave.png"
                            alt="wave"
                            width={10}
                            height={10}
                            className="shrink-0"
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-bold font-asap truncate leading-tight",
                            styles.userName,
                          )}
                        >
                          {toPascalCase(role)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-gray-100 shadow-xl p-2 bg-white mt-2 font-inter"
              >
                {/* User Info Header in Dropdown */}
                <div className="px-3 py-2.5 mb-1.5 bg-slate-50/80 rounded-lg border border-slate-100/80 space-y-0.5 font-asap">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[#1F2A44] truncate">
                      Hello, {user.first_name} {user.last_name}
                    </span>
                    <Image
                      src="/assets/mdi_hand-wave.png"
                      alt="wave"
                      width={11}
                      height={11}
                      className="shrink-0"
                    />
                  </div>
                  {user.company_name && (
                    <p className="text-[11px] font-bold text-[#1CA7A6] truncate">
                      {user.company_name}
                    </p>
                  )}
                  <p className="text-[10px] font-medium text-[#708090]">
                    {toPascalCase(role)}
                  </p>
                </div>

                <DropdownMenuItem
                  asChild
                  className="rounded-lg focus:bg-[#1CA7A6]/10 cursor-pointer py-2 px-3"
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 w-full text-gray-700 font-medium text-xs"
                  >
                    <UserIcon className="size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg focus:bg-red-50 cursor-pointer py-2 px-3 text-red-500 focus:text-red-600 font-medium text-xs"
                  onClick={handleSignout}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <LogOut className="size-4" />
                    <span>Sign Out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/notifications"
              className={cn(
                "relative w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0",
                styles.notifBtn,
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
                <span
                  className={cn(
                    "absolute top-px h-1.5 w-1.5 rounded-full animate-pulse",
                    styles.notifDot,
                  )}
                />
              )}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
