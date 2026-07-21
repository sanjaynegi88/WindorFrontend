'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Search, FileText, User, Plus,
    MoreHorizontal, Users, ClipboardList,
    History, Map as MapIcon, Building2, Tag,
    ShieldCheck, Settings, Shield, Images, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/components/providers/user-provider';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function MobileTabs() {
    const pathname = usePathname();
    const { user } = useUser();
    const role = user?.role?.toLowerCase() || "";
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const tabs = React.useMemo((): { name: string; href?: string; icon: React.ComponentType<any>; isCenter?: boolean }[] => {
        const baseTabs: { name: string; href?: string; icon: React.ComponentType<any>; isCenter?: boolean }[] = [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
        ];

        const hasProperties = role === 'contractor' || role === 'admin' || role === 'property_owner';
        const hasReports = role === 'contractor' || role === 'property_owner' || role === 'insurance_company';

        if (hasProperties) {
            baseTabs.push({ name: 'Properties', href: '/properties', icon: Search });
        }

        baseTabs.push({ name: 'More', icon: Plus, isCenter: true });

        if (hasReports) {
            baseTabs.push({ name: 'Report', href: '/reports', icon: FileText });
        }

        baseTabs.push({ name: 'Profile', href: '/profile', icon: User });

        return baseTabs;
    }, [role]);

    const getMoreOptions = () => {
        const options = [];

        options.push({ name: 'Contractors', href: '/contractors', icon: Shield });

        // Properties & Projects options (available for contractor, admin, property_owner)
        if (role === 'contractor' || role === 'admin' || role === 'property_owner') {
            options.push({ name: 'View Properties', href: '/properties', icon: Search });
            options.push({ name: 'Enter new Property', href: '/properties/new', icon: Plus });
            options.push({ name: 'My projects Lists', href: '/my-projects', icon: ClipboardList });
            options.push({ name: 'Create new Project', href: '/projects', icon: Plus });
        }

        // Inspector Routes
        if (role === 'city_inspector' && !user?.user?.sub_account) {
            options.push({ name: 'Staff', href: '/city-users', icon: Users });
            options.push({ name: 'Logs', href: '/city-logs', icon: ClipboardList });
        }

        // Company Routes
        if (role === 'insurance_company' && !user?.user?.sub_account) {
            options.push({ name: 'Staff', href: '/company-users', icon: Users });
            options.push({ name: 'Logs', href: '/company-logs', icon: ClipboardList });
        }

        if (role === 'contractor' && !user?.user?.sub_account) {
            options.push({ name: 'Staff', href: '/contractor-users', icon: Users });
        }

        // Admin Routes
        if (role === 'admin') {
            options.push({ name: 'Users', href: '/admin/users', icon: Users });
            options.push({ name: 'States', href: '/admin/states', icon: MapIcon });
            options.push({ name: 'City', href: '/admin/city', icon: Building2 });
            options.push({ name: 'Brands', href: '/admin/brands', icon: Tag });
            options.push({ name: 'Membership', href: '/admin/membership', icon: ShieldCheck });
            options.push({ name: 'Property Types', href: '/admin/property-types', icon: Building2 });
            options.push({ name: 'Roles', href: '/admin/roles', icon: Shield });
            options.push({ name: 'Project Image Category', href: '/admin/image-category', icon: Images });
            options.push({ name: 'Service Provided', href: '/admin/service-provided', icon: Building2 });
            options.push({ name: 'Set Prices', href: '/admin/report-price', icon: DollarSign });
            options.push({ name: 'Admin Logs', href: '/admin/admin-logs', icon: History });
        }

        return options;
    };

    const moreOptions = getMoreOptions();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-100 h-[55px] bg-[#1F2A44] md:hidden flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
            {tabs.map((tab) => {
                const isActive = tab.href
                    ? tab.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(tab.href)
                    : false;

                if (tab.isCenter) {
                    return (
                        <Sheet key={tab.name} open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <button className="relative flex flex-col items-center justify-end h-full pb-1.5 min-w-[64px] group outline-none">
                                    <div className="absolute top-[-22px] left-1/2 -translate-x-1/2 w-[54px] h-[54px] bg-[#1F2A44] rounded-full flex items-center justify-center group-active:scale-95 transition-transform duration-200 border-4 border-white/5">
                                        <tab.icon className="size-6 text-white" />
                                    </div>
                                    <span className="text-[13px] font-medium font-asap text-white/90 leading-[10px]">
                                        {tab.name}
                                    </span>
                                </button>
                            </SheetTrigger>
                            <SheetContent
                                side="bottom"
                                className="rounded-t-[25px] border-none bg-white p-8 outline-none h-[65vh] max-h-[550px] flex flex-col"
                            >
                                <SheetHeader className="mb-6 shrink-0">
                                    <SheetTitle className="text-[#1F2A44] font-bold text-xl uppercase tracking-tight text-center font-asap">Menu Options</SheetTitle>
                                </SheetHeader>
                                <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1 pr-1 pb-6">
                                    {moreOptions.map((option) => (
                                        <Link
                                            key={option.name}
                                            href={option.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-gray-50/80 hover:bg-[#1CA7A6]/10 transition-all group active:scale-95"
                                        >
                                            <div className="size-11 rounded-full bg-white flex items-center justify-center text-[#1F2A44] group-hover:text-[#1CA7A6] shadow-sm transition-colors">
                                                <option.icon className="size-5" />
                                            </div>
                                            <span className="text-[11px] font-bold text-[#1F2A44] text-center uppercase leading-tight font-asap">
                                                {option.name}
                                            </span>
                                        </Link>
                                    ))}
                                    {moreOptions.length === 0 && (
                                        <div className="col-span-3 py-10 text-center text-gray-400 font-medium font-asap uppercase tracking-widest text-xs">
                                            No additional options
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    );
                }

                return (
                    <Link
                        key={tab.name}
                        href={tab.href!}
                        className="flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all active:scale-95 duration-200"
                    >
                        <tab.icon className={cn(
                            "size-[18px] transition-colors",
                            isActive ? "text-white" : "text-white/60"
                        )} />
                        <span className={cn(
                            "text-[13px] font-medium font-asap transition-colors leading-[10px]",
                            isActive ? "text-white" : "text-white/60"
                        )}>
                            {tab.name}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
