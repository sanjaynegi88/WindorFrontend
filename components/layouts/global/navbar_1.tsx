"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/providers/user-provider";
import { getUserProfile } from "@/lib/actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Map as MapIcon,
  Building2,
  Tag,
  ClipboardList,
  History,
  Images,
  ShieldUser,
  DollarSignIcon,
  LogOut,
} from "lucide-react";

export function Navbar1() {
  const pathname = usePathname();
  const { user, setUser } = useUser();
  const isLoggedIn = !!user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const role = user?.role?.toLowerCase() || "";

  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';
  const isAuthPage =
    pathname.startsWith(loginUrl) ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-otp');

  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/property-details') ||
    pathname.startsWith('/plans') ||
    pathname.startsWith('/properties') ||
    pathname.startsWith('/installations') ||
    pathname.startsWith('/city-users') ||
    pathname.startsWith('/company-users') ||
    pathname.startsWith('/city-logs') ||
    pathname.startsWith('/company-logs') ||
    pathname.startsWith('/verification') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/purchase') ||
    pathname.startsWith('/reports');

  useEffect(() => {
    const fetchUser = async () => {
      if (!user && !isAuthPage && !isProtectedPage) {
        try {
          const profile = await getUserProfile();
          setUser(profile);
        } catch {
          // Silent catch
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [user, isAuthPage, isProtectedPage]);

  const navItems = useMemo(() => {
    if (!isLoggedIn || !user)
      return [
        { name: "HOME", href: "/dashboard" },
        { name: "PROPERTIES", href: "/properties/new", activeFor: ["/properties", "/property-details"] },
        { name: "REPORTS", href: "/reports" },
        { name: "CONTRACTORS", href: "/contractors" },
        { name: "PROFILE", href: "/profile" },
      ];

    switch (role) {
      default:
        return [
          { name: "HOME", href: "/dashboard" },
          { name: "REPORTS", href: "/reports" },
          { name: "CONTRACTORS", href: "/contractors" },
          { name: "PROFILE", href: "/profile" },
        ];
    }
  }, [isLoggedIn, user, role]);


  return (
    <header className="w-full bg-white border-b border-gray-100 relative z-50 font-inter">
      <div className="max-w-[1450px] mx-auto w-[90%] flex items-center justify-between py-2 md:py-3">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/assets/logo-1.png"
              alt="Windor Logo"
              width={150}
              height={54}
              priority
              className="h-[46px] md:h-[54px] w-auto object-contain block"
            />
          </Link>
        </div>

        {/* Right Side Buttons & Menu */}
        <div className="flex items-center">
          {/* Navigation Menu */}
          <nav
            className={`${mobileOpen ? "block" : "hidden"
              } xl:block absolute xl:relative top-full xl:top-auto left-0 right-0 xl:left-auto xl:right-auto bg-white xl:bg-transparent border-t xl:border-t-0 border-gray-100 xl:border-0 shadow-lg xl:shadow-none max-h-[calc(100vh-80px)] xl:max-h-none overflow-y-auto xl:overflow-visible z-999 xl:z-auto mr-4`}
          >
            <ul className="flex flex-col xl:flex-row gap-0 xl:gap-[18px] xl:flex-wrap p-0 xl:p-0 m-0 list-none">
              {navItems.map((link) => (
                <li key={link.name} className="w-full xl:w-auto">
                  <Link
                    href={link.href}
                    className={cn(
                      "no-underline font-medium uppercase text-[15px] transition-colors py-3.5 xl:py-2 px-6 xl:px-0 block",
                      (link.activeFor
                        ? link.activeFor.some((p) => pathname.startsWith(p))
                        : pathname.startsWith(link.href))
                        ? "text-[#339FD0]"
                        : "text-slate-500 hover:text-[#339FD0]"
                    )}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}

            </ul>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link
              href={process.env.NEXT_PUBLIC_LOGIN_URL || "/login"}
              className="py-2.5 md:py-3 px-4 md:px-[22px] border border-[#1f2a44] text-secondary-new font-bold uppercase rounded-[6px] no-underline inline-block text-[13px] md:text-[15px] hover:bg-[#1f2a44] hover:text-white transition-all duration-200"
            >
              Login
            </Link>

            {/* Mobile Hamburger menu */}
            <button
              className="flex xl:hidden items-center gap-1.5 font-semibold text-[#1f2a44] ml-3 p-1 border border-transparent rounded hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="size-6 text-slate-700" />
              ) : (
                <Menu className="size-6 text-slate-700" />
              )}
              <span className="hidden sm:inline text-xs font-bold">
                {mobileOpen ? "CLOSE" : "MENU"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
