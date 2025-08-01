
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Anchor } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Contact name is required' }),
  designation: z.string().min(2, { message: 'Designation is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
});

type NewContactFormValues = z.infer<typeof formSchema>;

interface NewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: Anchor;
}

export function NewContactDialog({ open, onOpenChange, anchor }: NewContactDialogProps) {
  const { updateAnchor } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', designation: '', email: '', phone: '' },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = async (values: NewContactFormValues) => {
    setIsSubmitting(true);
    try {
      const newContact = {
        id: `contact-${Date.now()}`,
        isPrimary: false,
        ...values,
      };

      const updatedContacts = [...anchor.contacts, newContact];
      await updateAnchor({ ...anchor, contacts: updatedContacts });

      toast({
        title: 'Contact Added',
        description: `${values.name} has been added to ${anchor.name}.`,
      });
      handleClose();

    } catch (error) {
      console.error('Failed to add contact:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add new contact. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact person for {anchor.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. Priya Sharma" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="designation" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Designation</FormLabel><FormControl><Input placeholder="e.g. Finance Manager" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="priya.sharma@company.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>{t('dialogs.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Contact
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

