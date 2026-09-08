'use client';

import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AccountPlansContent } from './content';
import { Container } from '@/components/common/container';
import { useUser } from '@/components/providers/user-provider';

export default function AccountPlansPage() {
  const { role } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (role === 'admin') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  if (role === 'admin') {
    return null;
  }

  return (
    <Fragment>
      <div className='pb-8' />
      <Container>
        <AccountPlansContent />
      </Container>
    </Fragment>
  );
}
