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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ActivityLog } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  to: z.string().email(),
  cc: z.string().email().optional().or(z.literal('')),
  subject: z.string().min(3, 'Subject is required'),
  body: z.string().min(10, 'Email body cannot be empty'),
});

type EmailFormValues = z.infer<typeof formSchema>;

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  entity: { id: string; name: string; type: 'anchor' | 'dealer' | 'vendor' };
}

export function ComposeEmailDialog({ open, onOpenChange, recipientEmail, entity }: ComposeEmailDialogProps) {
  const { addActivityLog, currentUser } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: recipientEmail,
      cc: '',
      subject: '',
      body: '',
    },
  });

  useEffect(() => {
    form.reset({
      to: recipientEmail,
      cc: '',
      subject: '',
      body: '',
    });
  }, [recipientEmail, open, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: EmailFormValues) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to send an email.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        let logOutcome = values.body;
        if (values.cc) {
            logOutcome = `CC: ${values.cc}\n\n${values.body}`;
        }
        
        const newLog: Partial<Omit<ActivityLog, 'id'>> = {
          timestamp: new Date().toISOString(),
          type: 'Email',
          title: `Email: ${values.subject} to ${entity.name}`,
          outcome: logOutcome,
          userName: currentUser.name,
          userId: currentUser.uid,
        };
        
        if (entity.type === 'anchor') {
            newLog.anchorId = entity.id;
        } else if (entity.type === 'dealer') {
            newLog.dealerId = entity.id;
        } else if (entity.type === 'vendor') {
            newLog.vendorId = entity.id;
        }

        addActivityLog(newLog as Omit<ActivityLog, 'id'>);

        toast({
          title: 'Email Sent (Simulation)',
          description: 'The email interaction has been logged to the activity feed.',
        });
        handleClose();

    } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to log email interaction.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            This will simulate sending an email and log the interaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CC (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="cc@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Regarding our proposal..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea rows={10} placeholder="Dear..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Email & Log
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
