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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Dealer, Supplier } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  contactNumber: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
  email: z.string().email({ message: 'A valid email is required.' }).optional().or(z.literal('')),
  gstin: z.string().optional(),
  location: z.string().optional(),
  anchorId: z.string().optional(),
});

type NewLeadFormValues = z.infer<typeof formSchema>;

interface NewLeadDialogProps {
  type: 'Dealer' | 'Supplier';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function NewLeadDialog({ type, open, onOpenChange, anchorId }: NewLeadDialogProps) {
  const { addDealer, addSupplier, currentUser, anchors } = useApp();
  const { toast } = useToast();

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      email: '',
      gstin: '',
      location: '',
      anchorId: '',
    },
  });
  
  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = (values: NewLeadFormValues) => {
    const isSpecialist = currentUser.role === 'Onboarding Specialist';
    const finalAnchorId = anchorId || values.anchorId || null;
    
    const commonData = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      name: values.name,
      contactNumber: values.contactNumber,
      email: values.email,
      gstin: values.gstin,
      location: values.location,
      assignedTo: isSpecialist ? null : currentUser.uid,
      onboardingStatus: isSpecialist ? 'Unassigned Lead' : (finalAnchorId ? 'Invited' : 'Unassigned Lead'),
      anchorId: finalAnchorId,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {!anchorId && (
                <FormField
                control={form.control}
                name="anchorId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Associated Anchor (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an anchor" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {anchors.map(anchor => (
                                    <SelectItem key={anchor.id} value={anchor.id}>{anchor.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />
            )}

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
