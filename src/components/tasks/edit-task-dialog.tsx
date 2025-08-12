
'use client';

import { useEffect, useState } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { NewTaskSchema } from '@/lib/validation';

const EditTaskSchema = NewTaskSchema.extend({ id: z.string() });
type EditTaskFormValues = z.infer<typeof EditTaskSchema>;

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

export function EditTaskDialog({ open, onOpenChange, task }: EditTaskDialogProps) {
  const { updateTask } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(EditTaskSchema),
  });

  useEffect(() => {
    if (task && open) {
      form.reset({
        id: task.id,
        title: task.title,
        type: task.type,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: task.priority,
        description: task.description,
        assignedTo: task.assignedTo,
      });
    }
  }, [task, open, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: EditTaskFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedTask: Task = {
        ...task,
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : '',
        updatedAt: new Date().toISOString(),
      };
      
      updateTask(updatedTask);
      toast({ title: 'Task Updated', description: `Task "${values.title}" has been updated.` });
      handleClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Modify the details of this task.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="type" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Task Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Call">Call</SelectItem><SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Meeting (Online)">Meeting (Online)</SelectItem><SelectItem value="Meeting (In-person)">Meeting (In-person)</SelectItem>
                    <SelectItem value="KYC Document Collection">KYC Document Collection</SelectItem><SelectItem value="Proposal Preparation">Proposal Preparation</SelectItem>
                    <SelectItem value="Internal Review">Internal Review</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
             <FormField
                name="dueDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                        <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        className="rounded-md border"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
            />
            <FormField name="priority" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description / Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
