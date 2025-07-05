'use client';

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
import { useToast } from '@/hooks/use-toast';
import type { Dealer, Supplier } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  contactNumber: z.string().min(10, { message: 'A valid contact number is required' }),
  gstin: z.string().optional(),
  location: z.string().optional(),
});

type NewLeadFormValues = z.infer<typeof formSchema>;

interface NewLeadDialogProps {
  type: 'Dealer' | 'Supplier';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function NewLeadDialog({ type, open, onOpenChange, anchorId }: NewLeadDialogProps) {
  const { addDealer, addSupplier, currentUser } = useApp();
  const { toast } = useToast();

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      gstin: '',
      location: '',
    },
  });
  
  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = (values: NewLeadFormValues) => {
    const commonData = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      ...values,
      assignedTo: currentUser.uid,
      onboardingStatus: anchorId ? 'Invited' : 'Unassigned Lead',
      anchorId: anchorId || null,
      createdAt: new Date().toISOString()
    }

    if (type === 'Dealer') {
      addDealer(commonData as Dealer);
    } else {
      addSupplier(commonData as Supplier);
    }

    toast({
      title: `${type} Lead Created`,
      description: `${values.name} has been added as a new ${type.toLowerCase()} lead.`,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>+ New {type} Lead</DialogTitle>
          <DialogDescription>
            Add a new {type.toLowerCase()} lead. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type} Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${type.toLowerCase()} name`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="gstin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GSTIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Add {type}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
