'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateMembershipCookie } from '@/lib/actions';
import { useUser } from '@/components/providers/user-provider';
import { toast } from 'sonner';

export function useMembershipGuard() {
  const { user, setUser, role } = useUser();
  const router = useRouter();

  /**
   * Validates current user membership status against the backend.
   * If membership is false/expired, updates local state, sets cookie to 'false',
   * displays a toast error message, redirects to /plans, and returns false.
   */
  const validateMembership = useCallback(async (): Promise<boolean> => {
    // Exempt admin and city_inspector roles
    if (role === 'admin' || role === 'city_inspector') {
      return true;
    }

    try {
      const freshProfile = await getUserProfile();
      if (freshProfile) {
        setUser(freshProfile);
        const hasMembership = Boolean(
          freshProfile.has_membership ?? freshProfile.current_subscription?.is_active
        );
        const isSubUser = Boolean(freshProfile.sub_account);

        // Sub-account users under contractors or insurance companies are exempt
        if (isSubUser && (role === 'contractor' || role === 'insurance_company')) {
          return true;
        }

        if (!hasMembership) {
          await updateMembershipCookie(false);
          document.cookie = "has-membership=false; path=/; max-age=" + 30 * 24 * 60 * 60;
          toast.error("Your membership is inactive or has expired. Please subscribe to continue.");
          router.push('/plans');
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error("Failed to validate membership before action:", error);
    }

    // Fallback check against client state if fetch fails
    const localMembership = Boolean(user?.has_membership ?? user?.current_subscription?.is_active);
    const isSubUser = Boolean(user?.sub_account);

    if (isSubUser && (role === 'contractor' || role === 'insurance_company')) {
      return true;
    }

    if (!localMembership) {
      toast.error("Your membership is inactive or has expired. Please subscribe to continue.");
      router.push('/plans');
      return false;
    }

    return true;
  }, [user, setUser, role, router]);

  /**
   * Helper that wraps an async action function.
   * Validates membership first; if valid, executes actionFn and returns result.
   */
  const verifyAndExecute = useCallback(
    async <T>(actionFn: () => Promise<T>): Promise<T | null> => {
      const isValid = await validateMembership();
      if (!isValid) return null;
      return await actionFn();
    },
    [validateMembership]
  );

  return { validateMembership, verifyAndExecute };
}
