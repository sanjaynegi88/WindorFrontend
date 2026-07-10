'use client';

import { Fragment } from 'react';
import { AccountPlansContent } from './content';
import { Container } from '@/components/common/container';

export default function AccountPlansPage() {

  return (
    <Fragment>
      <div className='pb-8' />
      <Container>
        <AccountPlansContent />
      </Container>
    </Fragment>
  );
}
