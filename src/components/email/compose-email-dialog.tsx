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
import type { ActivityLog, Anchor } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3, 'Subject is required'),
  body: z.string().min(10, 'Email body cannot be empty'),
});

type EmailFormValues = z.infer<typeof formSchema>;

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  anchor: Anchor;
}

export function ComposeEmailDialog({ open, onOpenChange, recipientEmail, anchor }: ComposeEmailDialogProps) {
  const { addActivityLog, currentUser } = useApp();
  const { toast } = useToast();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: recipientEmail,
      subject: '',
      body: '',
    },
  });

  useEffect(() => {
    form.reset({
      to: recipientEmail,
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

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      anchorId: anchor.id,
      timestamp: new Date().toISOString(),
      type: 'Email',
      title: `Email: ${values.subject}`,
      outcome: values.body,
      userName: currentUser.name,
    };

    addActivityLog(newLog);

    toast({
      title: 'Email Sent (Simulation)',
      description: 'The email interaction has been logged to the activity feed.',
    });
    handleClose();
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
              <Button type="submit">Send Email & Log</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
