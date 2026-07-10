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
import { createStates, editStates } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const stateSchema = z.object({
  state_name: z.string().min(1, 'State is required'),

});


interface StateFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: any | null;
  onSuccess: () => void;
}

export function StateFormDialog({ isOpen, onClose, state, onSuccess }: StateFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof stateSchema>>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      state_name: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (state) {
        form.reset({
          state_name: state.state_name,
        });
      } else {
        form.reset({
          state_name: '',
        });
      }
    }
  }, [state, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof stateSchema>) => {
    setLoading(true);
    const payload = { state_name: values.state_name };
    const result = state
      ? await editStates(state.id, payload)
      : await createStates(payload);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || 'Something went wrong');
      return;
    }
    toast.success(state ? 'State updated successfully' : 'State created successfully');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{state ? 'Edit state' : 'Add New state'}</DialogTitle>
          <DialogDescription>
            {state ? 'Update the details of the state.' : 'Enter details for the new state.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

            <FormField
              control={form.control}
              name="state_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">State</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the state" className="rounded-xl h-11" {...field} />
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
                  state ? 'Update state' : 'Create state'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}