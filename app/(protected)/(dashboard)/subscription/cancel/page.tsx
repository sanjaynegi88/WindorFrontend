'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, RefreshCw, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SubscriptionCancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/plans');
    }
  }, [countdown, router]);

  const handleGoToPlans = () => {
    router.push('/plans');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="cancel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg z-10"
        >
          <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl transition-all overflow-hidden">
            <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center">
              {/* Header Icon & Title */}
              <div className="flex items-center justify-center gap-6 mb-8 w-full group">
                <div className="relative">
                  <div className="bg-orange-500 p-4 rounded-3xl shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <XCircle className="w-12 h-12 text-white" />
                  </div>
                  {/* Subtle pulsing ring */}
                  <div className="absolute inset-0 bg-orange-500/20 rounded-3xl animate-ping opacity-75 -z-10" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-4xl font-black text-orange-500 tracking-tight leading-none mb-1">
                    Cancelled
                  </h1>
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Payment Cancelled</span>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-4 text-center mb-10">
                <p className="text-xl text-foreground font-semibold leading-relaxed">
                  Your subscription payment was cancelled.
                </p>
                <p className="text-muted-foreground max-w-[280px] mx-auto text-sm leading-relaxed">
                  No charges have been made to your account. You can return to our plans and pick something that fits your needs later.
                </p>
              </div>

              {/* Redirection Line Progress */}
              <div className="w-full space-y-4 mb-10">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 px-1">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin duration-[3s]" />
                    Redirecting to plans in {countdown}s
                  </span>
                  <span>{Math.round(((5 - countdown) / 5) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/5 p-px">
                  <motion.div
                    className="h-full bg-linear-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full">
                <Button
                  onClick={handleGoToPlans}
                  className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] rounded-xl flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </Button>
              </div>

              {/* <div className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground/60 font-semibold uppercase tracking-widest">
                <Undo2 className="w-4 h-4 text-orange-400" />
                <span>Changed your mind?</span>
              </div> */}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}