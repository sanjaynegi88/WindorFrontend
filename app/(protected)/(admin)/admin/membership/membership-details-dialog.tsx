'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getMembership } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2, Crown, CheckCircle2, DollarSign, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Membership {
  id: string;
  name: string;
  description: string;
  monthlyAmount: string | number;
  yearlyAmount: string | number;
  targetRole?: string;
  level?: string;
  maxReports?: number;
  features: Record<string, string | number | boolean>;
  createdAt: string;
  isActive: boolean;
}

interface MembershipDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  membershipId: string | null;
}

export function MembershipDetailsDialog({ isOpen, onClose, membershipId }: MembershipDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    const fetchMembershipDetails = async () => {
      if (!isOpen || !membershipId) return;

      setLoading(true);
      try {
        const response = await getMembership(membershipId);
        const membershipData = response.data || response;
        setMembership(membershipData);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch membership details');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipDetails();
  }, [membershipId, isOpen, onClose]);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setMembership(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {membership ? membership.name : "Membership Details"}
        </DialogTitle>
        {loading || !membership ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading details...</p>
          </div>
        ) : (
          <>
            <div className="bg-primary/5 p-8 border-b relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Crown className="size-40 text-primary" />
              </div>
              <DialogHeader className="relative z-10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Crown className="size-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                      {membership.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium mt-1">
                      Membership Plan Details
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="max-h-[60vh]">
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="size-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Description</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{membership.description || 'No description provided.'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="size-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Pricing</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">${membership.monthlyAmount} / ${membership.yearlyAmount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Crown className="size-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Target Role</span>
                    </div>
                    <Badge className="font-medium">{membership.targetRole || 'N/A'}</Badge>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="size-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Status</span>
                    </div>
                    <Badge appearance="outline" variant={membership.isActive ? 'success' : 'destructive'}>{membership.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>

                {(membership.targetRole === 'CONTRACTOR' && membership.level) ||
                  (membership.targetRole === 'INSURANCE' && membership.maxReports) ? (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Crown className="size-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Role-Specific Details</span>
                    </div>
                    {membership.targetRole === 'CONTRACTOR' && membership.level && (
                      <p className="text-sm font-medium text-foreground">
                        Contractor Level: <span className="font-bold">{membership.level}</span>
                      </p>
                    )}
                    {membership.targetRole === 'INSURANCE' && membership.maxReports && (
                      <p className="text-sm font-medium text-foreground">
                        Maximum Reports: <span className="font-bold">{membership.maxReports}</span>
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Included Features
                  </h4>

                  {membership.features && Object.keys(membership.features).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(membership.features).map(([key, val]) => {
                        const readableKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        return (
                          <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-muted-foreground/10 transition-colors">
                            <span className="text-xs font-semibold text-muted-foreground">{readableKey}</span>
                            {typeof val === 'boolean' ? (
                              <Badge
                                variant={val ? "success" : "destructive"}
                                appearance="outline"
                              >
                                {val ? "Included" : "Excluded"}
                              </Badge>
                            ) : typeof val === 'object' && val !== null ? (
                              <span className="text-xs font-bold bg-background px-2 py-1 rounded-md border shadow-sm">
                                {(val as any).description || JSON.stringify(val)}
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-background px-2 py-1 rounded-md border shadow-sm">
                                {String(val)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-dashed text-center">
                      No specific features listed for this plan.
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/10 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl px-8 h-11 font-bold text-xs uppercase tracking-widest"
              >
                Close View
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
