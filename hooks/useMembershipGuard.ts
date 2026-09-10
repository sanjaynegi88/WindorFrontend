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
        const isSubUser = Boolean(
          freshProfile.sub_account === true ||
          freshProfile.sub_account === 'true' ||
          (freshProfile as any).user?.sub_account === true ||
          (freshProfile as any).user?.sub_account === 'true'
        );

        let hasMembership: boolean;
        if (isSubUser) {
          const sub = freshProfile.current_subscription ?? (freshProfile as any).user?.current_subscription;
          hasMembership = Boolean(sub && (sub.status ? sub.status.toUpperCase() === 'ACTIVE' : true));
        } else {
          const rawMembership = freshProfile.has_membership ?? freshProfile.current_subscription?.is_active ?? (freshProfile.current_subscription?.status === 'ACTIVE');
          hasMembership = rawMembership === true || rawMembership === 'true' || rawMembership === 1 || rawMembership === '1';
        }

        if (!hasMembership) {
          await updateMembershipCookie(false);
          document.cookie = "has-membership=false; path=/; max-age=" + 30 * 24 * 60 * 60;
          toast.error("Active membership is required or has expired.");
          router.push(isSubUser ? '/dashboard' : '/plans');
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error("Failed to validate membership before action:", error);
    }

    // Fallback check against client state if fetch fails
    const isSubUser = Boolean(
      user?.sub_account === true ||
      user?.sub_account === 'true' ||
      (user as any)?.user?.sub_account === true ||
      (user as any)?.user?.sub_account === 'true'
    );

    let localMembership: boolean;
    if (isSubUser) {
      const sub = user?.current_subscription ?? (user as any)?.user?.current_subscription;
      localMembership = Boolean(sub && (sub.status ? sub.status.toUpperCase() === 'ACTIVE' : true));
    } else {
      const rawLocal = user?.has_membership ?? user?.current_subscription?.is_active ?? (user?.current_subscription?.status === 'ACTIVE');
      localMembership = rawLocal === true || rawLocal === 'true' || rawLocal === 1 || rawLocal === '1';
    }

    if (!localMembership) {
      toast.error("Active membership is required or has expired.");
      router.push(isSubUser ? '/dashboard' : '/plans');
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
