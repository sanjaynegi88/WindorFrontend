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
import { createCity, getStates, updateCity } from '@/lib/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const citySchema = z.object({
  name: z.string().min(1, 'City name is required'),
  state_id: z.string().min(1, 'State is required'),
  zip_codes: z.string()
    .min(1, 'At least one zip code is required (comma separated)')
    .refine((val) => {
      const codes = val.split(',').map(z => z.trim()).filter(z => z !== '');
      return codes.every(code => /^\d{1,6}$/.test(code));
    }, 'Each zip code must be numeric and maximum 6 digits'),
});


interface CityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: any | null;
  onSuccess: () => void;
}

export function CityFormDialog({ isOpen, onClose, city, onSuccess }: CityFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  useEffect(() => {
    const fetchStates = async () => {
      setIsLoadingStates(true);
      try {
        const response = await getStates();
        if (response && response.data) {
          setStates(response.data);
        } else {
          setStates([]);
        }
      } catch (error:any) {
        console.error('Error fetching states:', error);
        toast.error(error.message || 'Failed to load states');
      } finally {
        setIsLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  const form = useForm<z.infer<typeof citySchema>>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '',
      state_id: '',
      zip_codes: '',
    },
  });
  useEffect(() => {
    if (isOpen) {
      if (city) {
        form.reset({
          name: city.name,
          state_id: city.state_entity.id,
          zip_codes: city.zip_codes.join(', '),
        });
      } else {
        form.reset({
          name: '',
          state_id: '',
          zip_codes: '',
        });
      }
    }
  }, [city, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof citySchema>) => {
    setLoading(true);
    const zipCodesArray = values.zip_codes
      .split(',')
      .map(z => z.trim())
      .filter(z => z !== '');
    const payload = { name: values.name, state_id: values.state_id, zip_codes: zipCodesArray };
    const result = city
      ? await updateCity(city.id, payload)
      : await createCity(payload);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || 'Something went wrong');
      return;
    }
    toast.success(city ? 'City updated successfully' : 'City created successfully');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{city ? 'Edit City' : 'Add New City'}</DialogTitle>
          <DialogDescription>
            {city ? 'Update the details of the city.' : 'Enter details for the new city.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">City Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the city" className="rounded-xl h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">State</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingStates ? (
                          <div className="flex items-center justify-center py-2 px-1">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                            <span className="text-xs text-muted-foreground">Loading states...</span>
                          </div>
                        ) : states.length > 0 ? (
                          states.map((state: any) => (
                            <SelectItem key={state.id} value={state.id}>
                              {state.state_name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="py-2 text-center text-xs text-muted-foreground">
                            No states available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip_codes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Zip Codes (Comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Zip codes"
                      className="rounded-xl h-11"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,\s]/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Enter numeric zip codes (max 6 digits each), separated by commas.
                  </p>
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
                  city ? 'Update City' : 'Create City'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}