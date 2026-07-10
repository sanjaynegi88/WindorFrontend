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
import { createServiceProvided, editServiceProvided } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const stateSchema = z.object({
  service_name: z.string().min(1, 'Service is required'),

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
      service_name: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (state) {
        form.reset({
          service_name: state.service_name || '',
        });
      } else {
        form.reset({
          service_name: '',
        });
      }
    }
  }, [state, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof stateSchema>) => {
    setLoading(true);

    const payload = {
      service_name: values.service_name,
    };

    try {
      if (state) {
        await editServiceProvided(state.id, payload);
        toast.success('Service updated successfully');
      } else {
        await createServiceProvided(payload);
        toast.success('Service created successfully');
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
          <DialogTitle className="text-foreground">{state ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            {state ? 'Update the details of the Service.' : 'Enter details for the new Service.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

            <FormField
              control={form.control}
              name="service_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Service</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the Service" className="rounded-xl h-11" {...field} />
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
                  state ? 'Update Service' : 'Create Service'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}