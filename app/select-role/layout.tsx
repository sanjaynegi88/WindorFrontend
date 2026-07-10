'use client';

import AuthGuard from '@/components/AuthGuard';

/**
 * Minimal layout for the role-selection onboarding step.
 * Uses AuthGuard to validate the session but intentionally omits
 * the global Navbar/Footer — the user hasn't picked a role yet.
 */
export default function SelectRoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen w-full bg-[#F8FBFF]">
        {children}
      </div>
    </AuthGuard>
  );
}
