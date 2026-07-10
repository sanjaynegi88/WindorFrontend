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
import { Button } from '@/components/ui/button';
import { createPropertyType, editPropertyType } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const stateSchema = z.object({
  type_name: z.string().min(1, 'Property Type is required'),

});


interface StateFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: any | null;
  onSuccess: () => void;
}

export function PropertyTypeFormDialog({ isOpen, onClose, state, onSuccess }: StateFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof stateSchema>>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      type_name: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (state) {
        form.reset({
          type_name: state.type_name || state.typeName || '',
        });
      } else {
        form.reset({
          type_name: '',
        });
      }
    }
  }, [state, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof stateSchema>) => {
    setLoading(true);

    const payload = {
      type_name: values.type_name,
    };

    try {
      if (state) {
        const resposne = await editPropertyType(state.id, payload);
        if (!resposne.success) {
          toast.error(resposne.message);
          return;
        }
        toast.success('Property Type updated successfully');
      } else {
        const resposne = await createPropertyType(payload);
        if (!resposne.success) {
          toast.error(resposne.message);
          return;
        }
        toast.success('Property Type created successfully');
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
      <DialogContent className="sm:max-w-[425px] rounded-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{state ? 'Edit Property Type' : 'Add New Property Type'}</DialogTitle>
          <DialogDescription>
            {state ? 'Update the details of the Property Type.' : 'Enter details for the new Property Type.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

            <FormField
              control={form.control}
              name="type_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Property Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the Property Type" className="rounded-xl h-11" {...field} />
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
                  state ? 'Update Property Type' : 'Create Property Type'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}