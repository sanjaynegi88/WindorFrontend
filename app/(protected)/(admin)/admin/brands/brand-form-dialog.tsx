'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createBrand, updateBrand, getComponentTypes, getProjectTypesforPropertyOwner } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { toPascalCase } from '@/lib/utils';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
});

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface BrandFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brand: any | null;
  onSuccess: () => void;
}

export function BrandFormDialog({ isOpen, onClose, brand, onSuccess }: BrandFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [componentTypes, setComponentTypes] = useState<{ name: string }[]>([]);

  useEffect(() => {
    const fetchComponentTypes = async () => {
      try {
        const [response, response1] = await Promise.all([
          getComponentTypes().catch(() => null),
          getProjectTypesforPropertyOwner().catch(() => null)
        ]);

        const compTypes = response?.data?.report_types || [];
        const ownerTypes = response1?.data?.report_types || [];

        const merged = [...compTypes, ...ownerTypes];
        const uniqueNames = new Set<string>();
        const combined = merged.filter(t => {
          if (!t?.name) return false;
          const key = t.name.toUpperCase();
          if (uniqueNames.has(key)) return false;
          uniqueNames.add(key);
          return true;
        });

        setComponentTypes(combined);
      } catch (error) {
        console.error('Failed to fetch component types:', error);
      }
    };
    fetchComponentTypes();
  }, []);

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (brand) {
        form.reset({
          name: brand.name || '',
          description: brand.description || '',
          category: brand.category || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          category: '',
        });
      }
    }
  }, [brand, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof brandSchema>) => {
    setLoading(true);
    const result = brand
      ? await updateBrand(brand.id, values)
      : await createBrand(values as any);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || 'Something went wrong');
      return;
    }
    toast.success(brand ? 'Brand updated successfully' : 'Brand created successfully');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">

        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
          <DialogDescription>
            {brand ? 'Update the details of the brand.' : 'Enter details for the new product manufacturer brand.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the brand" className="rounded-xl h-11" {...field} />
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
                  <FormLabel className="font-semibold text-foreground">Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      {componentTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {toPascalCase(type.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter manufacturer details..."
                      className="min-h-[120px] rounded-xl"
                      {...field}
                    />
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
                ) : (
                  brand ? 'Update Brand' : 'Create Brand'
                )}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }
}
