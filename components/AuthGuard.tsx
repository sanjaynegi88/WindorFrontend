"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenLoader } from '@/components/common/screen-loader';
import { getUserProfile, signout } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, setUser, isLoading, setIsLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      // If we already have a user, no need to validate again on mount
      if (user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const profile = await getUserProfile();
        setUser(profile);
      } catch (error) {
        console.error('AuthGuard: Validation failed', error);
        await signout();
        toast.error('Your session has expired. Please log in again.');
        router.push(process.env.NEXT_PUBLIC_LOGIN_URL || '/login');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [router, setUser, setIsLoading, user]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
