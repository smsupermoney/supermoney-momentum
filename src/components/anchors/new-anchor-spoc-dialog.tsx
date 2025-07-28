
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Anchor, AnchorSPOC } from '@/lib/types';
import { regions } from '@/lib/validation';
import { IndianStatesAndCities } from '@/lib/india-states-cities';
import { Card, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

const territorySchema = z.object({
  region: z.string().min(1, 'Region is required.'),
  state: z.string().min(1, 'State is required.'),
  city: z.string().min(1, 'City is required.'),
  division: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, 'SPOC name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
  designation: z.string().min(2, 'Designation is required.'),
  territories: z.array(territorySchema).min(1, 'At least one territory is required.'),
});

type NewSPOCFormValues = z.infer<typeof formSchema>;

interface NewAnchorSPOCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: Anchor;
}

export function NewAnchorSPOCDialog({ open, onOpenChange, anchor }: NewAnchorSPOCDialogProps) {
  const { addAnchorSPOC, currentUser } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewSPOCFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      designation: '',
      territories: [{ region: '', state: '', city: '', division: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'territories',
  });
  
  const watchedTerritories = form.watch('territories');

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: NewSPOCFormValues) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newSPOC: Omit<AnchorSPOC, 'id'> = {
        anchorId: anchor.id,
        spocDetails: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          designation: values.designation,
        },
        territories: values.territories,
        isActive: true,
        createdAt: now,
        createdBy: currentUser.uid,
        lastModified: now,
      };

      await addAnchorSPOC(newSPOC);
      
      toast({
        title: 'SPOC Added',
        description: `${values.name} has been added as a SPOC for ${anchor.name}.`,
      });
      handleClose();

    } catch (error) {
      console.error('Failed to create SPOC:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create new SPOC. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Territory SPOC</DialogTitle>
          <DialogDescription>
            Add a new Single Point of Contact for {anchor.name} for one or more territories.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>SPOC Name</FormLabel><FormControl><Input placeholder="e.g. Ramesh Kumar" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="designation" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Designation</FormLabel><FormControl><Input placeholder="e.g. Regional Manager" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contact@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              
              <Separator />

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const selectedRegion = watchedTerritories?.[index]?.region;
                  const selectedState = watchedTerritories?.[index]?.state;
                  const statesForRegion = IndianStatesAndCities.find(r => r.region === selectedRegion)?.states || [];
                  const citiesForState = statesForRegion.find(s => s.name === selectedState)?.cities || [];

                  return (
                    <Card key={field.id} className="p-4 bg-secondary relative">
                        <div className="flex justify-between items-center mb-2">
                            <CardTitle className="text-base">Territory {index + 1}</CardTitle>
                            {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <FormField control={form.control} name={`territories.${index}.region`} render={({ field }) => (
                                <FormItem><FormLabel>Region</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select region..." /></SelectTrigger></FormControl>
                                        <SelectContent>{regions.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name={`territories.${index}.state`} render={({ field }) => (
                                <FormItem><FormLabel>State</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedRegion}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger></FormControl>
                                        <SelectContent>{statesForRegion.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                         <FormField control={form.control} name={`territories.${index}.city`} render={({ field }) => (
                            <FormItem className="mt-4"><FormLabel>City</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedState}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl>
                                    <SelectContent>{citiesForState.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name={`territories.${index}.division`} render={({ field }) => (
                            <FormItem className="mt-4"><FormLabel>Division (Optional)</FormLabel>
                                <FormControl><Input placeholder="e.g., Plates, TMT, Coils" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </Card>
                  )
                })}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ region: '', state: '', city: '', division: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Territory
                 </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 pb-1 -mx-6 px-6 border-t">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add SPOC
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
