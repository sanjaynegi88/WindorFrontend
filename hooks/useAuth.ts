'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, signout } from '@/lib/actions';

export const useAuth = () => {
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      try {
        await getUserProfile();
        setIsValidating(false);
      } catch (error) {
        await signout();
        window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
      }
    };

    validateSession();
  }, [router]);

  return { isValidating };
};
