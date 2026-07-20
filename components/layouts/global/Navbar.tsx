"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, toPascalCase } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  User as UserIcon,
  Map as MapIcon,
  Building2,
  Tag,
  ClipboardList,
  History,
  LogOut,
  Menu,
  X,
  Images,
  ShieldUser,
  DollarSignIcon,
  FileText,
  FileDownIcon,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useUser } from "@/components/providers/user-provider";
import { useNotifications } from "@/components/providers/notification-provider";
import { getUserProfile, signout } from "@/lib/actions";

export function Navbar() {
  const pathname = usePathname();
  const { user, setUser } = useUser();
  const isLoggedIn = !!user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const role = user?.role?.toLowerCase() || "";

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menuName: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(menuName);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
  const isAuthPage =
    pathname.startsWith(loginUrl) ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-otp");

  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/property-details") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/installations") ||
    pathname.startsWith("/city-users") ||
    pathname.startsWith("/company-users") ||
    pathname.startsWith("/city-logs") ||
    pathname.startsWith("/company-logs") ||
    pathname.startsWith("/verification") ||
    pathname.startsWith("/subscription") ||
    pathname.startsWith("/purchase") ||
    pathname.startsWith("/reports");

  useEffect(() => {
    const fetchUser = async () => {
      if (!user && !isAuthPage && !isProtectedPage) {
        try {
          const profile = await getUserProfile();
          setUser(profile);
        } catch {
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [user, isAuthPage, isProtectedPage]);

  useEffect(() => {
    setMobileOpen(false);
    setAdminExpanded(false);
    setMobileSubmenuOpen({});
    setOpenMenu(null);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const handleSignout = async () => {
    await signout();
    router.replace(process.env.NEXT_PUBLIC_LOGIN_URL || '/login');
  };

  const navItems = useMemo((): { name: string; href?: string; activeFor?: string[]; submenu?: { name: string; href: string }[] }[] => {
    if (!isLoggedIn || !user)
      return [
        { name: "DIRECTORY", href: "/contractors" },
      ];

    switch (role) {
      case "contractor":
        return [
          { name: "HOME", href: "/dashboard" },
          {
            name: "PROPERTIES",
            activeFor: ["/properties", "/property-details"],
            submenu: [
              { name: "View Properties", href: "/properties" },
              { name: "Enter new Property", href: "/properties/new" },
            ],
          },
          {
            name: "PROJECTS",
            activeFor: ["/projects", "/my-projects"],
            submenu: [
              { name: "My projects Lists", href: "/my-projects" },
              { name: "Create new Project", href: "/projects" },
            ],
          },
          { name: "REPORTS", href: "/reports" },
          { name: "DIRECTORY", href: "/contractors" },
          //{ name: "PROFILE", href: "/profile" },
          ...(!user?.user?.sub_account
            ? [{ name: "TEAM", href: "/contractor-users" }]
            : []),
        ];

      case "admin":
        return [
          { name: "HOME", href: "/dashboard" },
          {
            name: "PROPERTIES",
            activeFor: ["/properties", "/property-details"],
            submenu: [
              { name: "View Properties", href: "/properties" },
              { name: "Enter new Property", href: "/properties/new" },
            ],
          },
          {
            name: "PROJECTS",
            activeFor: ["/projects", "/my-projects"],
            submenu: [
              { name: "My projects Lists", href: "/my-projects" },
              { name: "Create new Project", href: "/projects" },
            ],
          },
          { name: "DIRECTORY", href: "/contractors" },
          //{ name: "PROFILE", href: "/profile" },
        ];

      case "insurance_company":
        return [
          { name: "HOME", href: "/dashboard" },
          { name: "REPORTS", href: "/reports" },
          { name: "DIRECTORY", href: "/contractors" },
          // { name: "PROFILE", href: "/profile" },
          ...(!user?.user?.sub_account
            ? [
              { name: "TEAM", href: "/company-users" },
              { name: "Audit Logs", href: "/company-logs" },
            ]
            : []),
        ];

      case "city_inspector":
        return [
          { name: "HOME", href: "/dashboard" },
          { name: "DIRECTORY", href: "/contractors" },
          //{ name: "PROFILE", href: "/profile" },
          ...(!user?.user?.sub_account
            ? [
              { name: "TEAM", href: "/city-users" },
              { name: "Audit Logs", href: "/city-logs" },
            ]
            : []),
        ];

      case "property_owner":
        return [
          { name: "HOME", href: "/dashboard" },
          {
            name: "PROPERTIES",
            activeFor: ["/properties", "/property-details"],
            submenu: [
              { name: "View Properties", href: "/properties" }
            ],
          },
          {
            name: "PROJECTS",
            activeFor: ["/projects", "/my-projects"],
            submenu: [
              { name: "My projects Lists", href: "/my-projects" },
              { name: "Create new Project", href: "/projects" },
            ],
          },
          { name: "REPORTS", href: "/reports" },
          { name: "DIRECTORY", href: "/contractors" },
          //{ name: "PROFILE", href: "/profile" },
        ];

      default:
        return [
          { name: "HOME", href: "/dashboard" },
          { name: "REPORTS", href: "/reports" },
          { name: "DIRECTORY", href: "/contractors" },
          // { name: "PROFILE", href: "/profile" },
        ];
    }
  }, [isLoggedIn, user, role]);

  const adminMenuItems = [
    { name: "Users", href: "/admin/users", icon: UserIcon },
    { name: "States", href: "/admin/states", icon: MapIcon },
    { name: "City", href: "/admin/city", icon: Building2 },
    { name: "Brands", href: "/admin/brands", icon: Tag },
    { name: "Membership", href: "/admin/membership", icon: ClipboardList },
    { name: "Property Types", href: "/admin/property-types", icon: Building2 },
    { name: "Roles", href: "/admin/roles", icon: ShieldUser },
    { name: "Project Image Category", href: "/admin/image-category", icon: Images },
    {
      name: "Service Provided",
      href: "/admin/service-provided",
      icon: Building2,
    },
    { name: "Set Prices", href: "/admin/report-price", icon: DollarSignIcon },
    { name: "Admin Logs", href: "/admin/admin-logs", icon: History },
    { name: "Import Data", href: "/admin/import-data", icon: FileDownIcon },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 font-asap hidden md:block transition-all duration-300">
      <div className="max-w-[1170px] flex h-[118px] items-center justify-between mx-auto relative px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="relative h-[85px] w-[93px]">
              <Image
                src="/assets/logo.png"
                alt="Windor Logo"
                fill
                sizes="93px"
                priority
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-[45px]">
          {navItems.map((link) => {
            const isActive = link.activeFor
              ? link.activeFor.some((p) => pathname.startsWith(p))
              : link.href
                ? pathname.startsWith(link.href)
                : link.submenu?.some((sub) => pathname.startsWith(sub.href));

            if (link.submenu) {
              return (
                <div
                  key={link.name}
                  onMouseEnter={() => handleMouseEnter(link.name)}
                  onMouseLeave={handleMouseLeave}
                  className="relative"
                >
                  <DropdownMenu
                    open={openMenu === link.name}
                    onOpenChange={(open) => {
                      if (!open) {
                        setOpenMenu(null);
                      } else {
                        setOpenMenu(link.name);
                      }
                    }}
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={(e) => e.preventDefault()}
                        className={cn(
                          "flex items-center gap-1 text-[15px] font-medium transition-colors uppercase relative py-2 outline-none cursor-pointer",
                          isActive ? "text-[#1CA7A6]" : "text-[#708090]/90 hover:text-[#1CA7A6]"
                        )}
                      >
                        {link.name}
                        <ChevronDown className="size-4" />
                        {isActive && (
                          <div className="absolute bottom-[-10px] left-0 w-full h-[2px] bg-[#1CA7A6] rounded-[3px]" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-56 rounded-xl border-none shadow-2xl p-2 bg-white mt-1"
                      onMouseEnter={() => handleMouseEnter(link.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {link.submenu.map((sub) => (
                        <DropdownMenuItem
                          key={sub.name}
                          asChild
                          className={cn(
                            "rounded-lg focus:bg-[#1CA7A6]/10 focus:text-[#1CA7A6] cursor-pointer py-3 px-4",
                            pathname === sub.href && "bg-[#1CA7A6]/10 text-[#1CA7A6]"
                          )}
                        >
                          <Link href={sub.href} className="w-full">
                            <span className="font-bold text-sm">{sub.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href!}
                className={cn(
                  "text-[15px] font-medium transition-colors uppercase relative py-2",
                  isActive
                    ? "text-[#1CA7A6]"
                    : "text-[#708090]/90 hover:text-[#1CA7A6]",
                )}
              >
                {link.name}
                {isActive && (
                  <div className="absolute bottom-[-10px] left-0 w-full h-[2px] bg-[#1CA7A6] rounded-[3px]" />
                )}
              </Link>
            );
          })}

          {role === "admin" && (
            <div
              onMouseEnter={() => handleMouseEnter("ADMIN")}
              onMouseLeave={handleMouseLeave}
              className="relative"
            >
              <DropdownMenu
                open={openMenu === "ADMIN"}
                onOpenChange={(open) => {
                  if (!open) {
                    setOpenMenu(null);
                  } else {
                    setOpenMenu("ADMIN");
                  }
                }}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center gap-1 text-[15px] font-medium text-[#708090]/90 hover:text-[#1CA7A6] transition-colors outline-none uppercase cursor-pointer"
                  >
                    ADMIN
                    <ChevronDown className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl border-none shadow-2xl p-2 bg-white"
                  onMouseEnter={() => handleMouseEnter("ADMIN")}
                  onMouseLeave={handleMouseLeave}
                >
                  {adminMenuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.name}
                      asChild
                      className={cn(
                        "rounded-lg focus:bg-[#1CA7A6]/10 focus:text-[#1CA7A6] cursor-pointer py-3 px-4",
                        pathname === item.href &&
                        "bg-[#1CA7A6]/10 text-[#1CA7A6]",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className="size-4" />
                        <span className="font-bold text-sm">{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {isLoadingUser ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-[43px] w-[43px] rounded-full bg-gray-200 animate-pulse" />

                <div className="hidden lg:flex flex-col gap-2">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="relative size-10 rounded-full bg-gray-200 animate-pulse" />
            </div>
          ) : isLoggedIn && user ? (
            <div className="flex items-center gap-6">
              <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <Avatar className="h-[43px] w-[43px]">
                      <AvatarImage
                        src={
                          user.profile_image_url
                            ? `${process.env.NEXT_PUBLIC_BASE_URL}${user.profile_image_url}`
                            : ""
                        }
                        alt={user.first_name || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-100 text-[#1F2A44] font-bold">
                        {user.first_name?.charAt(0)}
                        {user.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-[15px] text-[#708090] font-medium leading-[17px]">
                          Hello
                        </span>
                        <Image
                          src={"/assets/mdi_hand-wave.png"}
                          alt="wave-icon"
                          width={12}
                          height={12}
                        />
                      </div>
                      <span className="text-[17px] font-bold text-[#1F2A44] leading-[19px] transition-colors">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-[15px] text-[#708090]">{toPascalCase(role)}</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl border-none shadow-2xl p-2 bg-white mt-2 font-inter"
                >
                  <DropdownMenuItem
                    asChild
                    className="rounded-lg focus:bg-[#1CA7A6]/10  cursor-pointer py-3 px-4"
                  >
                    <Link href="/profile" className="flex items-center gap-3 w-full">
                      <User className="size-4" />
                      <span className="font-bold text-sm">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg focus:bg-[#1CA7A6]/10  cursor-pointer py-3 px-4 text-red-500 focus:text-red-600"
                    onClick={() => handleSignout()}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <LogOut className="size-4" />
                      <span className="font-bold text-sm">Sign Out</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="relative size-10 bg-[#1CA7A6]/20 rounded-full text-[#1CA7A6] border border-[#1CA7A6]/28 shadow-[0px_4px_14px_rgba(28,167,166,0.3)] hover:bg-[#1CA7A6]/30 transition-colors cursor-pointer flex items-center justify-center outline-none">
                    <Image
                      src={"/assets/bell.png"}
                      alt="bell"
                      width={20}
                      height={20}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#F44336] rounded-full animate-pulse" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[360px] p-0 bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden font-inter mt-2"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-[#F8FBFF] border-b border-gray-100">
                    <span className="font-bold text-xs text-[#1F2A44] uppercase tracking-wide">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const unread = notifications.filter((n) => !n.isRead);
                          await Promise.all(unread.map((n) => markAsRead(n.id)));
                        }}
                        className="text-xs font-bold text-[#1CA7A6] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <span className="text-xs font-medium text-gray-400">No notifications</span>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.isRead) markAsRead(notif.id);
                            if (notif.metadata?.propertyId) {
                              router.push(`/property-details/${notif.metadata.propertyId}`);
                            }
                          }}
                          className={cn(
                            "flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors text-left",
                            !notif.isRead && "bg-[#1CA7A6]/5"
                          )}
                        >
                          <div className={cn(
                            "size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            !notif.isRead ? "bg-[#1CA7A6]/10 text-[#1CA7A6]" : "bg-gray-100 text-gray-500"
                          )}>
                            <FileText className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs text-[#1F2A44] leading-snug", !notif.isRead ? "font-bold" : "font-medium")}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <span className="size-1.5 bg-[#1CA7A6] rounded-full mt-2 shrink-0 animate-pulse" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    className="flex items-center justify-center py-3 border-t border-gray-100 text-xs font-bold text-[#1CA7A6] bg-gray-50/50 hover:bg-gray-50 hover:underline transition-colors uppercase tracking-wider"
                  >
                    View all notifications
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href={process.env.NEXT_PUBLIC_LOGIN_URL || "/login"}>
              <Button
                variant="outline"
                className="w-[128px] h-[54px] border-[#1F2A44] text-[#1F2A44] font-bold hover:bg-[#1F2A44] hover:text-white transition-all rounded-[10px] text-[20px] uppercase p-0"
              >
                LOGIN
              </Button>
            </Link>
          )}

          {isLoggedIn && (
            <button
              className="md:hidden p-2 rounded-lg text-[#708090] hover:text-[#1CA7A6] hover:bg-[#1CA7A6]/10 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-1 shadow-lg font-inter max-h-[calc(100vh-120px)] overflow-y-auto">
          {navItems.map((link) => {
            const isActive = link.activeFor
              ? link.activeFor.some((p) => pathname.startsWith(p))
              : link.href
                ? pathname.startsWith(link.href)
                : link.submenu?.some((sub) => pathname.startsWith(sub.href));

            if (link.submenu) {
              const isOpen = !!mobileSubmenuOpen[link.name];
              return (
                <div key={link.name} className="space-y-1">
                  <button
                    onClick={() => setMobileSubmenuOpen(prev => ({ ...prev, [link.name]: !prev[link.name] }))}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-xl text-[15px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                      isActive
                        ? "bg-[#1CA7A6]/10 text-[#1CA7A6]"
                        : "text-[#708090] hover:bg-gray-50 hover:text-[#1CA7A6]"
                    )}
                  >
                    <span>{link.name}</span>
                    <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="pl-4 space-y-1 border-l border-gray-100 ml-4">
                      {link.submenu.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors",
                            pathname === sub.href
                              ? "text-[#1CA7A6] bg-[#1CA7A6]/5"
                              : "text-[#708090] hover:text-[#1CA7A6]"
                          )}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href!}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-[15px] font-bold uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-[#1CA7A6]/10 text-[#1CA7A6]"
                    : "text-[#708090] hover:bg-gray-50 hover:text-[#1CA7A6]",
                )}
              >
                {link.name}
              </Link>
            );
          })}

          {role === "admin" && (
            <div className="space-y-1">
              <button
                onClick={() => setMobileSubmenuOpen(prev => ({ ...prev, ADMIN: !prev.ADMIN }))}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 rounded-xl text-[15px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                  pathname.startsWith("/admin")
                    ? "bg-[#1CA7A6]/10 text-[#1CA7A6]"
                    : "text-[#708090] hover:bg-gray-50 hover:text-[#1CA7A6]"
                )}
              >
                <span>ADMIN</span>
                <ChevronDown className={cn("size-4 transition-transform", !!mobileSubmenuOpen.ADMIN && "rotate-180")} />
              </button>
              {!!mobileSubmenuOpen.ADMIN && (
                <div className="pl-4 space-y-1 border-l border-gray-100 ml-4">
                  {adminMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors",
                        pathname === item.href
                          ? "text-[#1CA7A6] bg-[#1CA7A6]/5"
                          : "text-[#708090] hover:text-[#1CA7A6]"
                      )}
                    >
                      <item.icon className="size-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
