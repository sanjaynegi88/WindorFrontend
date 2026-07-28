'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUserProfile, updateMembershipCookie } from '@/lib/actions';
import { toast } from 'sonner';
import { Role } from '@/config/rbac';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  profile_image_url?: string;
  [key: string]: any;
  company_name:string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  role: Role | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  refreshProfile: () => Promise<User | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncRef = useRef<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  const role = (user?.role?.toLowerCase() ?? null) as Role | null;

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUser(profile);
        const hasMembership = Boolean(profile.has_membership ?? profile.current_subscription?.is_active);
        const userRole = (profile.role ? profile.role.toLowerCase() : null) || role;
        const isSubUser = Boolean(profile.sub_account);

        await updateMembershipCookie(hasMembership);
        document.cookie = `has-membership=${hasMembership}; path=/; max-age=${30 * 24 * 60 * 60}`;

        // Check route restriction if membership is lost
        if (!hasMembership && userRole !== 'admin' && userRole !== 'city_inspector' &&
          !(userRole === 'insurance_company' && isSubUser) &&
          !(userRole === 'contractor' && isSubUser)) {

          const isExemptRoute =
            pathname.startsWith('/plans') ||
            pathname.startsWith('/dashboard') ||
            pathname.startsWith('/subscription/') ||
            pathname.startsWith('/purchase/') ||
            pathname.startsWith('/profile') ||
            pathname.startsWith('/profile-setup') ||
            pathname.startsWith('/change-password') ||
            pathname.startsWith('/property-details') ||
            pathname === '/' ||
            pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/select-role');

          if (!isExemptRoute) {
            toast.error('Your membership has expired or is inactive.');
            router.push('/plans');
          }
        }
        return profile;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
    return null;
  }, [role, pathname, router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Cooldown: Only sync at most once every 60 seconds on tab focus
        if (now - lastSyncRef.current > 60000) {
          lastSyncRef.current = now;
          refreshProfile();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProfile]);

  return (
    <UserContext.Provider value={{ user, setUser, role, isLoading, setIsLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
