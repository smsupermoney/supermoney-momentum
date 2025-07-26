
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import type { Anchor, AnchorSPOC } from '@/lib/types';
import { regions } from '@/lib/validation';
import { IndianStatesAndCities } from '@/lib/india-states-cities';

const formSchema = z.object({
  name: z.string().min(2, 'SPOC name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
  designation: z.string().min(2, 'Designation is required.'),
  region: z.string().min(1, 'Region is required.'),
  state: z.string().min(1, 'State is required.'),
  city: z.string().min(1, 'City is required.'),
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
      region: '',
      state: '',
      city: '',
    },
  });
  
  const selectedRegion = form.watch('region');
  const selectedState = form.watch('state');

  const statesForRegion = IndianStatesAndCities.find(r => r.region === selectedRegion)?.states || [];
  const citiesForState = statesForRegion.find(s => s.name === selectedState)?.cities || [];

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
        territory: {
          region: values.region,
          state: values.state,
          city: values.city,
        },
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Territory SPOC</DialogTitle>
          <DialogDescription>
            Add a new Single Point of Contact for {anchor.name} for a specific territory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            
            <Card className="p-4 bg-secondary">
                <CardTitle className="text-base mb-2">Territory</CardTitle>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField name="region" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Region</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select region..." /></SelectTrigger></FormControl>
                                <SelectContent>{regions.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )}/>
                     <FormField name="state" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedRegion}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger></FormControl>
                                <SelectContent>{statesForRegion.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )}/>
                </div>
                 <FormField name="city" control={form.control} render={({ field }) => (
                    <FormItem className="mt-4"><FormLabel>City</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedState}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl>
                            <SelectContent>{citiesForState.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
            </Card>
           

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add SPOC
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
