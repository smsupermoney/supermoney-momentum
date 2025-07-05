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
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Task, ActivityLog } from '@/lib/types';

const formSchema = z.object({
  outcome: z.string().min(10, 'Please provide a summary of the outcome.'),
  createFollowUp: z.boolean().default(false),
});

type LogOutcomeFormValues = z.infer<typeof formSchema>;

interface LogOutcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSubmit: (createFollowUp: boolean) => void;
}

export function LogOutcomeDialog({ open, onOpenChange, task, onSubmit }: LogOutcomeDialogProps) {
  const { addActivityLog, currentUser, anchors } = useApp();
  const { toast } = useToast();

  const form = useForm<LogOutcomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { outcome: '', createFollowUp: true },
  });

  const handleFormSubmit = (values: LogOutcomeFormValues) => {
    const anchorName = anchors.find(a => a.id === task.associatedWith.anchorId)?.name;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      anchorId: task.associatedWith.anchorId,
      taskId: task.id,
      timestamp: new Date().toISOString(),
      type: task.type,
      title: `${task.type}: ${task.title} with ${anchorName}`,
      outcome: values.outcome,
      userName: currentUser.name,
    };
    addActivityLog(newLog);

    toast({ title: 'Task Completed & Outcome Logged' });
    onSubmit(values.createFollowUp);
    form.reset();
    onOpenChange(false);
  };
  
  const handleClose = () => {
     form.reset();
     onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Outcome & Next Steps</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">Task: {task.title}</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary of Interaction / Outcome</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="e.g. Client confirmed they received the proposal. They will review it internally and revert by Friday." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="createFollowUp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Schedule Next Action</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
