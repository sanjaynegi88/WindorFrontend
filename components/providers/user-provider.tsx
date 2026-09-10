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

  const rawRole = user?.role ?? user?.roleEntity?.role_name;
  const role = (rawRole ? rawRole.toLowerCase() : null) as Role | null;

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUser(profile);
        const isSubUser = Boolean(
          profile.sub_account === true ||
          profile.sub_account === 'true' ||
          (profile as any).user?.sub_account === true ||
          (profile as any).user?.sub_account === 'true'
        );

        let hasMembership: boolean;
        if (isSubUser) {
          const sub = profile.current_subscription ?? (profile as any).user?.current_subscription;
          hasMembership = Boolean(sub && (sub.status ? sub.status.toUpperCase() === 'ACTIVE' : true));
        } else {
          const rawMembership = profile.has_membership ?? profile.current_subscription?.is_active ?? (profile.current_subscription?.status === 'ACTIVE');
          hasMembership = rawMembership === true || rawMembership === 'true' || rawMembership === 1 || rawMembership === '1';
        }

        const rawProfileRole = profile.role ?? profile.roleEntity?.role_name;
        const userRole = (rawProfileRole ? rawProfileRole.toLowerCase() : null) || role;

        await updateMembershipCookie(hasMembership);
        document.cookie = `has-membership=${hasMembership}; path=/; max-age=${30 * 24 * 60 * 60}`;

        // Check route restriction if membership is lost
        if (!hasMembership && userRole !== 'admin' && userRole !== 'city_inspector') {
          const isBasicAllowed =
            pathname.startsWith('/dashboard') ||
            pathname.startsWith('/profile') ||
            pathname.startsWith('/profile-setup') ||
            pathname.startsWith('/change-password') ||
            pathname.startsWith('/reports');

          const isExemptRoute =
            pathname.startsWith('/plans') ||
            pathname.startsWith('/subscription/') ||
            pathname.startsWith('/purchase/') ||
            isBasicAllowed ||
            pathname.startsWith('/property-details') ||
            pathname === '/' ||
            pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/select-role');

          if (isSubUser) {
            if (!isBasicAllowed) {
              toast.error('Active membership is required.');
              router.push('/dashboard');
            }
          } else if (!isExemptRoute) {
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
