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
import { Checkbox } from '@/components/ui/checkbox';
import { createRoles, editRoles } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const stateSchema = z.object({
  role_name: z.string().min(1, 'Role is required'),
  is_public: z.boolean(),
});


interface RoleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: any | null;
  onSuccess: () => void;
}

export function RoleFormDialog({ isOpen, onClose, state, onSuccess }: RoleFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof stateSchema>>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      role_name: '',
      is_public: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (state) {
        form.reset({
          role_name: state.role_name || '',
          is_public: state.is_public ?? false,
        });
      } else {
        form.reset({
          role_name: '',
          is_public: false,
        });
      }
    }
  }, [state, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof stateSchema>) => {
    setLoading(true);

    const payload = {
      role_name: values.role_name,
      is_public: values.is_public,
    };

    try {
      if (state) {
        const response = await editRoles(state.id, payload);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success('Role updated successfully');
      } else {
        const response = await createRoles(payload);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success('Role created successfully');
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
          <DialogTitle className="text-foreground">{state ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          <DialogDescription>
            {state ? 'Update the details of the Role.' : 'Enter details for the new Role.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

            <FormField
              control={form.control}
              name="role_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the Role" className="rounded-xl h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="is_public"
                      />
                    </FormControl>
                    <FormLabel htmlFor="is_public" className="font-semibold text-foreground cursor-pointer !mt-0">
                      Public
                    </FormLabel>
                  </div>
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
                  state ? 'Update Role' : 'Create Role'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}