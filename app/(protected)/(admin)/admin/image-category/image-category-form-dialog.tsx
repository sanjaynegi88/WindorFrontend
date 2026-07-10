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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createImageCategory, editImageCategory, getComponentTypes, getProjectTypesforPropertyOwner } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toSnakeCase } from '@/lib/helpers';
import { toPascalCase } from '@/lib/utils';


const stateSchema = z.object({
  component_type: z.string().min(1, 'Component Type is required'),
  display_name: z.string().min(1, 'Category Name is required'),
});

interface ImageCategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: any | null;
  onSuccess: () => void;
}

export function ImageCategoryFormDialog({ isOpen, onClose, state, onSuccess }: ImageCategoryFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [componentTypes, setComponentTypes] = useState<any[]>([]);
  const form = useForm<z.infer<typeof stateSchema>>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      component_type: '',
      display_name: '',
    },
  });

  useEffect(() => {
    const fetchComponentTypes = async () => {
      try {
        const [res, res1] = await Promise.all([
          getComponentTypes().catch(() => null),
          getProjectTypesforPropertyOwner().catch(() => null)
        ]);

        const compTypes = res?.data?.report_types || [];
        const ownerTypes = res1?.data?.report_types || [];

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
    }
    fetchComponentTypes();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (state) {
        form.reset({
          component_type: state.component_type || '',
          display_name: state.display_name || '',
        });
      } else {
        form.reset({
          component_type: '',
          display_name: '',
        });
      }
    }
  }, [state, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof stateSchema>) => {
    setLoading(true);

    try {
      if (state) {
        const payload = {
          display_name: values.display_name,
        };

        const response = await editImageCategory(state.id, payload);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success('Image Category updated successfully');
      } else {
        const payload = {
          component_type: values.component_type,
          display_name: toSnakeCase(values.display_name),
        };

        const response = await createImageCategory(payload);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success('Image Category created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px] rounded-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{state ? 'Edit Image Category' : 'Add New Image Category'}</DialogTitle>
          <DialogDescription>
            {state ? 'Update the details of the Image Category.' : 'Enter details for the new Image Category.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Name of the Image Category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="component_type"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!state}>
                    <FormControl>
                      <SelectTrigger className="h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap">
                        <SelectValue placeholder="Select a Component Type" className='placeholder:text-[#1F2A44]/50' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="cursor-pointer">
                      {componentTypes?.map((componentType: any) => (
                        <SelectItem key={componentType.name} value={componentType.name} className='cursor-pointer'>
                          {toPascalCase(componentType.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2" />
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
                  state ? 'Update Image Category' : 'Create Image Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}