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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createStyle,
  editStyle,
  getComponentTypes,
  getProjectTypesforPropertyOwner,
} from "@/lib/actions";
import { toast } from "sonner";
import { Loader2, Layers } from "lucide-react";
import { toPascalCase } from "@/lib/utils";

const styleSchema = z.object({
  style: z
    .string()
    .min(1, "Style name is required")
    .transform((val) => val.trim()),
  category: z
    .string()
    .min(1, "Category is required")
    .transform((val) => val.trim()),
});

type StyleFormValues = z.infer<typeof styleSchema>;

interface StyleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  styleItem?: any | null;
  state?: any | null;
  categories?: { id?: string; name: string }[];
  onSuccess: () => void;
}

export function StyleFormDialog({
  isOpen,
  onClose,
  styleItem,
  state,
  categories: passedCategories,
  onSuccess,
}: StyleFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ name: string }[]>(
    passedCategories || [],
  );
  const activeStyle = styleItem ?? state;

  const form = useForm<StyleFormValues>({
    resolver: zodResolver(styleSchema),
    defaultValues: {
      style: "",
      category: "",
    },
  });

  useEffect(() => {
    if (passedCategories && passedCategories.length > 0) {
      setCategories(passedCategories);
      return;
    }

    const fetchCategories = async () => {
      try {
        const [response, response1] = await Promise.all([
          getComponentTypes().catch(() => null),
          getProjectTypesforPropertyOwner().catch(() => null),
        ]);

        const compTypes = Array.isArray(response?.data)
          ? response.data
          : response?.data?.report_types || response?.report_types || [];
        const ownerTypes = Array.isArray(response1?.data)
          ? response1.data
          : response1?.data?.report_types || response1?.report_types || [];

        const merged = [...compTypes, ...ownerTypes];
        const uniqueNames = new Set<string>();
        const combined = merged.filter((t: any) => {
          if (!t?.name) return false;
          const key = t.name.toUpperCase();
          if (uniqueNames.has(key)) return false;
          uniqueNames.add(key);
          return true;
        });

        setCategories(combined);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, passedCategories]);

  useEffect(() => {
    if (isOpen) {
      if (activeStyle) {
        form.reset({
          style: activeStyle.style || activeStyle.name || "",
          category: (activeStyle.category || "").toUpperCase(),
        });
      } else {
        form.reset({
          style: "",
          category: "",
        });
      }
    }
  }, [activeStyle, form, isOpen]);

  const onSubmit = async (values: StyleFormValues) => {
    setLoading(true);

    const payload = {
      style: values.style,
      category: values.category.toUpperCase(),
    };

    try {
      if (activeStyle?.id) {
        const response = await editStyle(activeStyle.id, payload);
        if (!response.success) {
          toast.error(response.message || "Failed to update style");
          return;
        }
        toast.success(response.message || "Style updated successfully");
      } else {
        const response = await createStyle(payload);
        if (!response.success) {
          toast.error(response.message || "Failed to create style");
          return;
        }
        toast.success(response.message || "Style created successfully");
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
      <DialogContent className="sm:max-w-[460px] rounded-2xl text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {activeStyle ? "Edit Style" : "Add New Style"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {activeStyle
              ? "Update the style name and its category."
              : "Enter the details to create a new component style."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">
                    Style Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Metal-1, Shingle-Classic"
                      className="rounded-xl h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">
                    Category
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        size="lg"
                        className="rounded-xl h-11 text-sm bg-white border border-[rgba(112,128,144,0.23)] text-[#1F2A44] font-medium shadow-none focus-visible:border-primary"
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl max-h-60">
                      {/* If the active item has a category not yet in categories list, include it */}
                      {field.value &&
                        !categories.some(
                          (c) => c.name.toUpperCase() === field.value.toUpperCase(),
                        ) && (
                          <SelectItem value={field.value}>
                            {toPascalCase(field.value)}
                          </SelectItem>
                        )}
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.name}
                          value={cat.name.toUpperCase()}
                        >
                          {toPascalCase(cat.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-3 gap-3 sm:gap-0">
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
                ) : activeStyle ? (
                  "Update Style"
                ) : (
                  "Create Style"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
