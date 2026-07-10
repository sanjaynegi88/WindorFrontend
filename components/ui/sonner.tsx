'use client';

import * as React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="group toaster"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-[#1e293b] group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-bold',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:font-medium',
          actionButton:
            'group-[.toast]:rounded-xl group-[.toast]:bg-[#1CA7A6] group-[.toast]:text-white font-bold transition-all hover:bg-[#158f8e]',
          cancelButton:
            'group-[.toast]:rounded-xl group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground font-bold',
          success: '!bg-[#f0fdfa] !text-[#1CA7A6] !border-[#1CA7A6]',
          error: '!bg-[#fee2e2] !text-[#dc2626] !border-[#dc2626]',
          info: '!bg-blue-50 !text-blue-600 !border-blue-600',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
