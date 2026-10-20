"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateMembershipLevel } from "@/lib/actions";
import { Loader2 } from "lucide-react";

export interface MembershipLevelItem {
  id: string;
  name: string;
  role?: string;
  priority?: number;
  features?: Record<string, any>;
  is_free?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EditMembershipLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: MembershipLevelItem | null;
  onLevelUpdated: (updatedLevel: MembershipLevelItem) => void;
}

export function EditMembershipLevelDialog({
  open,
  onOpenChange,
  level,
  onLevelUpdated,
}: EditMembershipLevelDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (level) {
      setName(level.name);
    }
  }, [level]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!level) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Level name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const res = await updateMembershipLevel(level.id, { name: trimmedName });
      if (!res.success) {
        toast.error(res.message || "Failed to update membership level");
        return;
      }

      toast.success(res.message || "Membership level name updated successfully");
      const updated: MembershipLevelItem = {
        ...level,
        name: trimmedName,
        ...(res.data && typeof res.data === "object" ? res.data : {}),
      };
      onLevelUpdated(updated);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update membership level");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Level Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-level-name">Level Name</Label>
            <Input
              id="edit-level-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PLATINUM"
              disabled={loading}
              autoFocus
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
