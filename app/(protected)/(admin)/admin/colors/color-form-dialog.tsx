"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createColor, editColor } from "@/lib/actions";
import { toast } from "sonner";
import { Loader2, Palette } from "lucide-react";

const colorSchema = z.object({
  color: z
    .string()
    .min(1, "Color is required")
    .transform((val) => val.trim()),
});

type ColorFormValues = z.infer<typeof colorSchema>;

interface ColorFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  color?: any | null;
  state?: any | null;
  onSuccess: () => void;
}

export function ColorFormDialog({
  isOpen,
  onClose,
  color,
  state,
  onSuccess,
}: ColorFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const activeColor = color ?? state;

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      color: "",
    },
  });

  const currentColorValue = form.watch("color");

  useEffect(() => {
    if (isOpen) {
      if (activeColor) {
        form.reset({
          color: activeColor.color || activeColor.name || "",
        });
      } else {
        form.reset({
          color: "",
        });
      }
    }
  }, [activeColor, form, isOpen]);

  const onSubmit = async (values: ColorFormValues) => {
    setLoading(true);

    const payload = {
      color: values.color,
    };

    try {
      if (activeColor?.id) {
        const response = await editColor(activeColor.id, payload);
        if (!response.success) {
          toast.error(response.message || "Failed to update color");
          return;
        }
        toast.success(response.message || "Color updated successfully");
      } else {
        const response = await createColor(payload);
        if (!response.success) {
          toast.error(response.message || "Failed to create color");
          return;
        }
        toast.success(response.message || "Color created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Palette className="size-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {activeColor ? "Edit Color" : "Add New Color"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {activeColor
              ? "Update the details of the color."
              : "Enter the color name to create a new color."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 py-2"
          >
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">
                    Color Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="e.g. Sea Green, Charcoal, Gray"
                        className="rounded-xl h-11 pr-11"
                        {...field}
                      />
                      {/* {currentColorValue.trim() && (
                        <div
                          className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full border border-black/15 shadow-xs"
                          style={{
                            backgroundColor: currentColorValue
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, ""),
                          }}
                        />
                      )} */}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl px-6 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl px-6 h-11 bg-primary text-white hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : activeColor ? (
                  "Update Color"
                ) : (
                  "Create Color"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
