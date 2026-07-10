'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { confirmPayment, getUserProfile, updateMembershipCookie } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [isUpdating, setIsUpdating] = useState(true);
  const [level, setlevel] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, setUser } = useUser();

  useEffect(() => {
    const updateMembership = async () => {
      try {
        const sessionId = searchParams.get('session_id');

        if (sessionId) {
          const response = await confirmPayment(sessionId);
          if (!response.success) {
            toast.error(response.message);
            return;
          }
        }

        const profile = await getUserProfile();
        const hasMembership = profile?.has_membership || false;
        const role = profile?.role;

        const pendingLevel = localStorage.getItem('pending_level');



        setlevel(pendingLevel);
        setUserRole(role);

        await updateMembershipCookie(hasMembership);

        if (profile) {
          setUser(profile);
        }

        toast.success('Membership activated successfully!');
      } catch (error: any) {
        console.error('Failed to update membership status:', error);
        toast.error(error.message || 'Failed to update membership status');
      } finally {
        setIsUpdating(false);
      }
    };

    updateMembership();
  }, []);

  useEffect(() => {
    if (!isUpdating && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isUpdating && countdown === 0) {
      if (userRole === 'CONTRACTOR' && (level === 'GOLD' || level === 'SILVER')) {
        router.push('/profile-setup');
      } else {
        localStorage.removeItem('pending_level');
        router.push('/dashboard');
      }
    }
  }, [countdown, isUpdating, level, userRole, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {isUpdating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-medium text-foreground">Finalizing your membership...</h2>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md z-10"
          >
            <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl transition-all">
              <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center">
                {/* Simplified Header */}
                <div className="flex items-center justify-center gap-6 mb-8 w-full">
                  <div className="relative">
                    <div className="bg-green-500 p-3 rounded-full shadow-lg shadow-green-500/20">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-extrabold text-green-500 tracking-tight">
                    Success!
                  </h1>
                </div>

                <div className="space-y-2 text-center mb-10">
                  <p className="text-xl text-foreground font-semibold">
                    Welcome to the Windor Verifications!
                  </p>
                  <p className="text-muted-foreground">
                    Your subscription is now active. You have full access to all features and reports.
                  </p>
                </div>

                {/* Redirection Line Progress */}
                <div className="w-full space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                    <span>Redirecting in {countdown}s</span>
                    <span>100%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/10">
                    <motion.div
                      className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}